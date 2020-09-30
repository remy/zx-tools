import Lexer from '../public/bas/txt2bas.js';
import tap from 'tap';
const lexer = new Lexer();

tap.test('CM simple line', (t) => {
  let line = '80 PRINT %(1 << 1)';

  const newLine = lexer.line(line);
  t.same(newLine.lineNumber, 80);
  t.end();
});
