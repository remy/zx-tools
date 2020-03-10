import codes from './codes.js';

console.clear();

export const encode = a => new TextEncoder().encode(a);

const opTable = Object.entries(codes).reduce(
  (acc, [code, str]) => {
    acc[str] = parseInt(code);
    return acc;
  },
  {
    GOTO: 0xed,
  }
);

// FIXME there's an alias for goto => go to, etc

// Based on (with huge mods) https://eli.thegreenplace.net/2013/07/16/hand-written-lexer-in-javascript-compared-to-the-regex-based-ones
export default class Lexer {
  pos = 0;
  buf = null;
  bufLen = 0;

  // Operator table, mapping operator -> token name
  opTable = opTable;

  // Initialize the Lexer's buffer. This resets the lexer's internal
  // state and subsequent tokens will be returned starting with the
  // beginning of the new buffer.
  input(buf) {
    this.pos = 0;
    this.buf = buf;
    this.bufLen = buf.length;
  }

  line(line) {
    this.input(line);
    let lineNumber = null;
    let tokens = [];
    let length = 0;

    let token = null;
    while ((token = this.token())) {
      const { name, value } = token;
      if (!lineNumber && name === 'NUMBER') {
        lineNumber = parseInt(value, 10);
        continue;
      }

      if (name === 'KEYWORD') {
        length++;
        tokens.push(token);
      } else {
        length += value.toString().length;
        // TODO add the binary token value
        tokens.push(token);
      }
    }

    tokens.push({ name: 'KEYWORD', value: 0x0d });
    length++;

    console.log('making buffer ' + (length + 4));

    const buffer = new DataView(new ArrayBuffer(length + 4));

    console.log('len', buffer.byteLength);

    buffer.setUint16(0, lineNumber, false);
    buffer.setUint16(2, length, true);

    let offset = 4;

    tokens.forEach(({ name, value }) => {
      console.log(name, value, offset, buffer.buffer);
      if (name === 'KEYWORD') {
        console.log(value, offset);

        buffer.setUint8(offset, value);
        offset++;
      } else {
        // TODO handle numbers differently
        const v = value.toString();
        const view = new Uint8Array(buffer.buffer);
        view.set(encode(v), offset);
        offset += v.length;
      }
    });

    return {
      basic: new Uint8Array(buffer.buffer),
      lineNum: lineNumber,
      tokens,
      len: length,
    };
  }

  // Get the next token from the current buffer. A token is an object with
  // the following properties:
  // - name: name of the pattern that this token matched (taken from rules).
  // - value: actual string value of the token.
  // - pos: offset in the current buffer where the token starts.
  //
  // If there are no more tokens in the buffer, returns null. In case of
  // an error throws Error.
  token() {
    this._skipNonTokens();
    if (this.pos >= this.bufLen) {
      return null;
    }

    // The char at this.pos is part of a real token. Figure out which.
    var c = this.buf.charAt(this.pos);

    // comments are slurped
    if (c.toUpperCase() === 'R') {
      var next_c = this.buf.substr(this.pos, 3);

      if (next_c.toUpperCase() === 'REM') {
        return this._processComment();
      } else {
        return { name: 'DIVIDE', value: '/', pos: this.pos++ };
      }
    } else {
      // Look it up in the table of operators
      var op = this.opTable[c];
      if (op !== undefined) {
        return { name: op, value: c, pos: this.pos++ };
      } else {
        // Not an operator - so it's the beginning of another token.
        if (Lexer._isAlpha(c)) {
          return this._processIdentifier();
        } else if (Lexer._isDigit(c)) {
          return this._processNumber();
        } else if (Lexer._isSymbol(c)) {
          return { name: 'SYMBOL', value: c, pos: this.pos++ };
        } else if (c === '"') {
          return this._processQuote();
        } else {
          throw Error(`Token error at ${this.pos} (${c})`);
        }
      }
    }
  }

  static _isNewLine(c) {
    return c === '\r' || c === '\n';
  }

  static _isDigit(c) {
    return c >= '0' && c <= '9';
  }

  static _isSymbol(c) {
    return c === ',' || c === ';' || c === ':';
  }

  static _isAlpha(c) {
    return (
      (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_' || c === '$'
    );
  }

  static _isAlphaNum(c) {
    return (
      (c >= 'a' && c <= 'z') ||
      (c >= 'A' && c <= 'Z') ||
      (c >= '0' && c <= '9') ||
      c === '_' ||
      c === '$'
    );
  }

  _processNumber() {
    var endPos = this.pos + 1;
    while (endPos < this.bufLen && Lexer._isDigit(this.buf.charAt(endPos))) {
      endPos++;
    }

    let value = this.buf.substring(this.pos, endPos);

    if (value.includes('.')) {
      value = parseFloat(value);
    } else {
      value = parseInt(value, 10);
    }

    var tok = {
      name: 'NUMBER',
      value,
      pos: this.pos,
    };
    this.pos = endPos;
    return tok;
  }

  _processComment() {
    var endPos = this.pos + 2;
    // Skip until the end of the line
    var c = this.buf.charAt(this.pos + 2);
    while (endPos < this.bufLen && !Lexer._isNewLine(this.buf.charAt(endPos))) {
      endPos++;
    }

    var tok = {
      name: 'COMMENT',
      value: this.buf.substring(this.pos + 3, endPos).trim(),
      pos: this.pos,
    };
    this.pos = endPos + 1;
    return tok;
  }

  _isOpCode(endPos) {
    const curr = this.buf.substring(this.pos, endPos).toUpperCase();

    const _next = this.buf.charAt(endPos, endPos + 1);

    if (_next && (curr === 'GO' || curr === 'IN')) {
      return false;
    }

    if (this.opTable[curr] !== undefined) {
      this.pos = endPos;

      return {
        name: 'KEYWORD',
        value: this.opTable[curr],
        pos: this.pos,
      };
    }
    return false;
  }

  _processIdentifier() {
    var endPos = this.pos + 1;
    while (endPos < this.bufLen && Lexer._isAlphaNum(this.buf.charAt(endPos))) {
      const tok = this._isOpCode(endPos);

      if (tok) {
        return tok;
      }
      endPos++;
    }

    let tok = this._isOpCode(endPos);

    if (tok) {
      return tok;
    }

    tok = {
      name: 'IDENTIFIER',
      value: this.buf.substring(this.pos, endPos),
      pos: this.pos,
    };
    this.pos = endPos;
    return tok;
  }

  _processQuote() {
    // this.pos points at the opening quote. Find the ending quote.
    var end_index = this.buf.indexOf('"', this.pos + 1);

    if (end_index === -1) {
      throw Error('Unterminated quote at ' + this.pos);
    } else {
      var tok = {
        name: 'QUOTE',
        value: this.buf.substring(this.pos, end_index + 1),
        pos: this.pos,
      };
      this.pos = end_index + 1;
      return tok;
    }
  }

  _skipNonTokens() {
    while (this.pos < this.bufLen) {
      var c = this.buf.charAt(this.pos);
      if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
        this.pos++;
      } else {
        break;
      }
    }
  }
}

// console.clear();
const l = new Lexer(); // ?
const line = l.line('20 INPUT "what is your name?", n$');
console.log(line, line.basic.length);
// console.log(l.line('20GOTO10'));
