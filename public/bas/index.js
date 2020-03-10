import dnd from '../lib/dnd.js';
import { $ } from '../lib/$.js';
import { Unpack, default as unpacker } from '../lib/unpack/unpack.js';
import BASIC from './codes.js';
import Lexer from './Lexer.js';
import CodeMirror from './lib/cm.js';
import './basic-syntax.js';

const lexer = new Lexer();
const ta = $('textarea')[0];
const cm = CodeMirror.fromTextArea(ta, {
  mode: 'text/x-basic',
});

cm.on('keydown', (cm, event) => {
  if (event.key === 'Enter') {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);

    if (line.trim() === '') {
      return;
    }

    const data = lexer.line(line);
    try {
      const line = bas2txtLines(data.basic).trim();
      console.log(line);

      cm.replaceRange(
        line,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: line.length }
      );
      // event.preventDefault();
    } catch (e) {
      console.error(e);
    }
  }
});

dnd(document.body, bas2txt);

window.$ = $;

function bas2txt(data) {
  const unpack = new Unpack(data);

  let { length, ...header } = unpack.parse(
    `<A8$sig
    C$marker
    C$issue
    C$version
    I$length
    C$hType
    S$hFileLength
    n$hLine
    S$hOffset
    x
    x104
    C$checksum`
  );

  const string = bas2txtLines(data.slice(unpack.offset));

  cm.setValue(string);
  console.log(string);
}

function bas2txtLines(data) {
  const unpack = new Unpack(data);
  let next;
  let string = '';
  while ((next = unpack.parse('<n$line s$length'))) {
    const { length, line: lineNumber } = next;
    //console.log('A' + line.length + '$data', data, line.__offset);
    const content = unpack.parse(`<C${length}$data`);
    if (!content || !content.data) break;

    string = string + lineNumber + ' ';

    const data = Array.from(content.data);

    while (data.length) {
      let chr = data.shift();
      if (BASIC[chr]) {
        string += BASIC[chr] + ' ';
      } else if (chr === 0x0e) {
        // move forward 5 bits
        chr = data.shift();
        let value = null;
        let neg = 1;
        if (chr === 0x00) {
          const n = unpacker('<C$sign s$value x', data.splice(0, 4));
          value = n.value;
          neg = n.sign === 0x00 ? 1 : -1;
        } else if ((chr & 0b0110000) === 0b0110000) {
          // one letter number
          const exp = chr - 128; // 128 float adjust…weird
          let mantissa = unpacker('I$m', data.splice(0, 4)).m; // 32bit
          neg = mantissa > 0x7f000000 ? -1 : 1; // sign mask is on the mantissa

          mantissa = mantissa <<= 1; // now shift it off
          value = mantissa ** exp;
        } else {
          // array
          console.log('TODO');
        }
        value *= neg;
        // console.log({ value });
      } else {
        string += String.fromCharCode(chr);
      }
    }

    string += '\n';
  }

  return string;
}
