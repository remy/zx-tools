import Lexer from '../public/bas/txt2bas.js';
import { toHex } from '../public/lib/to.js';
import { bas2txtLines } from '../public/bas/bas2txt.js';
import tap from 'tap';
const lexer = new Lexer();

function asHex(s) {
  return s.split('').map(_ => toHex(_.charCodeAt(0)));
}

tap.test('source = output', t => {
  let src = ['10 REM marker', '5 LET b=@01111100', '10 LET b=%$ea'];

  src.forEach(src => {
    t.same(bas2txtLines(lexer.line(src).basic), src);
  });

  t.end();
});

// tap.test('multi-char symbols, << etc', t => {
//   let src = '80 PRINT %(1 << 1)';
//   const res = lexer.line(src).basic;

//   const expected = new Uint8Array([
//     0x00,
//     0x50,
//     0x08,
//     0x00,
//     0xf5,
//     0x25,
//     0x28,
//     0x31,
//     0x8c,
//     0x31,
//     0x29,
//     0x0d,
//   ]);

//   t.same(res, expected);

//   t.end();
// });
