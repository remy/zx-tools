import codes from './codes.js';
import { zxFloat } from '../lib/to.js';
import pack from '../lib/unpack/pack.js';
import { toHex } from '../lib/to.js';
import { bas2txtLines } from './bas2txt.js';

export const encode = a => new TextEncoder().encode(a);

const opTable = Object.entries(codes).reduce(
  (acc, [code, str]) => {
    acc[str] = parseInt(code);
    return acc;
  },
  {
    GOTO: 0xec,
  }
);

export const header = basic => {
  const res = pack(
    '< A8$sig C$eof C$issue C$version I$length C$hType S$hFileLength n$hLine S$hOffset',
    {
      sig: 'PLUS3DOS',
      eof: 26,
      issue: 1,
      version: 0,
      length: basic.length,
      hType: 0,
      hFileLength: basic.length - 128,
      hLine: 30848,
      hOffset: basic.length - 128,
    }
  );

  const checksum = Array.from(res).reduce((acc, curr) => (acc += curr), 0);

  // Array.from(res)
  //   .map(_ => toHex(_))
  //   .join(' '); //?

  const result = new Uint8Array(128);
  result.set(res, 0);
  result[127] = checksum;

  return result;
};

header(Uint8Array.from({ length: 440 }));

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
        if (codes[value] === 'REM') {
          token = this._processComment();
          length += token.value.length;
          tokens.push(token);
        }
      } else if (name === 'NUMBER') {
        length += value.toString().length;
        tokens.push(token);

        if ((value | 0) === value && value >= -65535 && value <= 65535) {
          const view = new DataView(new ArrayBuffer(6));
          view.setUint8(0, 0x0e);
          view.setUint8(1, 0x00);
          view.setUint8(2, value < 0 ? 0xff : 0x00);
          view.setUint16(3, value, true);
          tokens.push({
            name: 'NUMBER_DATA',
            value: new Uint8Array(view.buffer),
          });
          length += 6;
        } else {
          const res = zxFloat(value);
          tokens.push({
            name: 'NUMBER_DATA',
            value: new Uint8Array(res.value.buffer),
          });
          length += 6;
        }
      } else {
        length += value.toString().length;
        // TODO test the binary token value
        tokens.push(token);
      }
    }

    tokens.push({ name: 'KEYWORD', value: 0x0d });
    length++;

    const buffer = new DataView(new ArrayBuffer(length + 4));

    buffer.setUint16(0, lineNumber, false);
    buffer.setUint16(2, length, true);

    let offset = 4;

    tokens.forEach(({ name, value }) => {
      if (name === 'KEYWORD') {
        buffer.setUint8(offset, value);
        offset++;
      } else if (name === 'NUMBER_DATA') {
        const view = new Uint8Array(buffer.buffer);
        view.set(value, offset);
        offset += value.length;
      } else {
        const v = value.toString();
        const view = new Uint8Array(buffer.buffer);
        view.set(encode(v), offset);
        offset += v.length;
      }
    });

    console.log({ tokens });

    return {
      basic: new Uint8Array(buffer.buffer),
      lineNumber,
      tokens,
      length,
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
    const _next = this.buf.charAt(this.pos + 1);

    // comments are slurped elsewhere

    // Look it up in the table of operators
    var op = this.opTable[c];
    if (op !== undefined) {
      return { name: 'KEYWORD', value: op, pos: this.pos++ };
    } else {
      // Not an operator - so it's the beginning of another token.
      if (Lexer._isAlpha(c)) {
        return this._processIdentifier();
      } else if (c === '.' && Lexer._isDigit(this.buf.charAt(this.pos + 1))) {
        return this._processNumber();
      } else if (Lexer._isDigit(c)) {
        return this._processNumber();
      } else if (Lexer._isSymbol(c)) {
        if (c === '<' && _next === '>') {
          return {
            name: 'KEYWORD',
            value: this.opTable['<>'],
            pos: (this.pos += 2),
          };
        }
        return { name: 'SYMBOL', value: c, pos: this.pos++ };
      } else if (c === '"') {
        return this._processQuote();
      } else {
        throw Error(`Token error at ${this.pos} (${c})\n${this.buf}`);
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
    return ',;:=-+/*^()<>'.includes(c);
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
    while (
      endPos < this.bufLen &&
      (Lexer._isDigit(this.buf.charAt(endPos)) ||
        this.buf.charAt(endPos) === '.')
    ) {
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
    var endPos = this.pos;
    // Skip until the end of the line
    var c = this.buf.charAt(this.pos);
    while (endPos < this.bufLen && !Lexer._isNewLine(this.buf.charAt(endPos))) {
      endPos++;
    }

    var tok = {
      name: 'COMMENT',
      value: this.buf.substring(this.pos, endPos).trim(),
      pos: this.pos,
    };
    this.pos = endPos + 1;
    return tok;
  }

  _isOpCode(endPos) {
    let curr = this.buf.substring(this.pos, endPos).toUpperCase();

    const _next = this.buf.charAt(endPos, endPos + 1);

    let ignorePeek = false;
    if (_next == ' ' && curr === 'GO') {
      // check if the next is "SUB" or "TO"
      const next = this._peekToken(1).toUpperCase(); // ?
      if (next === 'SUB' || next === 'TO') {
        endPos = endPos + 1 + next.length;
        curr = curr + ' ' + next;
        ignorePeek = true;
      }
    }

    if (this.opTable[curr] !== undefined) {
      const peeked = this._peekToken(-1); // ?
      if (ignorePeek === false && curr !== peeked) {
        return false;
      } // ? [$,curr]
      this.pos = endPos;

      return {
        name: 'KEYWORD',
        value: this.opTable[curr],
        pos: this.pos,
      };
    }
    return false;
  }

  _peekToken(offset = 0) {
    const tmp = this.pos;
    this.pos += offset + 1;
    this._skipNonTokens();
    let endPos = this.pos + 1;
    while (endPos < this.bufLen && Lexer._isAlphaNum(this.buf.charAt(endPos))) {
      endPos++;
    }

    const self = this;
    const value = this.buf.substring(this.pos, endPos);

    this.pos = tmp;

    return value;
  }

  _processIdentifier() {
    var endPos = this.pos + 1;
    while (endPos < this.bufLen && Lexer._isAlphaNum(this.buf.charAt(endPos))) {
      let tok = this._isOpCode(endPos);

      if (tok) {
        return tok;
      }
      endPos++;
    }

    let tok = this._isOpCode(endPos);

    if (tok) {
      return tok; // ?
    }

    // special case for GO<space>[TO|SUB]
    let value = this.buf.substring(this.pos, endPos);

    // if (this.buf.substring(endPos, endPos + 1) === ' ') {
    //   value += ' '; // ?
    //   endPos++;
    // }

    tok = {
      name: 'IDENTIFIER',
      value,
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
// const l = new Lexer();
// const res = l.line('2010 LET p$ = INKEY$ INKEY$IN    PRINT GOTO GO SUB').basic; // ?

// bas2txtLines(res); // ?
