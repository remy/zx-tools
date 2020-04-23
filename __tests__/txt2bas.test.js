import Lexer from '../public/bas/txt2bas.js';
import { toHex } from '../public/lib/to.js';
import { bas2txtLines } from '../public/bas/bas2txt.js';
import tap from 'tap';
const lexer = new Lexer();

function asHex(s) {
  return s.split('').map((_) => toHex(_.charCodeAt(0)));
}

tap.test('source = output', (t) => {
  let src = ['10 REM marker', '5 LET b=@01111100', '10 LET b=%$ea'];

  src.forEach((src) => {
    t.same(bas2txtLines(lexer.line(src).basic), src);
  });

  t.end();
});

tap.test('binary', (t) => {
  let src = ['10 LET %a= BIN 1', '10 LET %b=%@10'];

  let expect = [
    [0xc4, 0x31, 0x0e, 0x00, 0x00, 0x01, 0x00, 0x00, 0x0d],
    [0x25, 0x40, 0x31, 0x30, 0x0d],
  ];

  src.forEach((src, i) => {
    const res = Array.from(lexer.line(src).basic).slice(-expect[i].length);
    // console.log(Array.from(res).map((_) => toHex(_)));
    t.same(res, expect[i]);
  });

  t.end();
});

tap.test('comments', (t) => {
  let src = ['10; one', '10 REM one'];

  let expect = [
    [0x06, 0x00, 0x3b, 0x20, 0x6f, 0x6e, 0x65, 0x0d],
    [0xea, 0x6f, 0x6e, 0x65, 0x0d],
  ];

  src.forEach((src, i) => {
    const res = Array.from(lexer.line(src).basic);
    // console.log(Array.from(res).map((_) => toHex(_)));
    t.same(res.slice(-expect[i].length), expect[i]);
  });

  t.end();
});

tap.test('end with $', (t) => {
  let src = ['202 IF INKEY$="s"'];

  let expect = [[0x00, 0xca, 0x06, 0x00, 0xfa, 0xa6, 0x22, 0x73, 0x22, 0x0d]];

  src.forEach((src, i) => {
    const res = Array.from(lexer.line(src).basic);
    t.same(res.slice(-expect[i].length), expect[i]);
  });

  t.end();
});
