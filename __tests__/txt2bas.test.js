import Lexer from '../public/bas/txt2bas.js';
import { toHex } from '../public/lib/to.js';
import { bas2txtLines } from '../public/bas/bas2txt.js';
import tap from 'tap';
const lexer = new Lexer();

function asHex(s) {
  return s.split('').map(_ => toHex(_.charCodeAt(0)));
}

tap.test('numbers', t => {
  let src = ['5 LET b=@01111100', '10 LET b=%$ea'];

  src.forEach(src => {
    t.same(bas2txtLines(lexer.line(src).basic), src);
  });

  t.end();
});
