import CodeMirror from '/web_modules/codemirror/src/codemirror.js';
import '/web_modules/codemirror/addon/mode/simple.js';
import codes from './codes.js';

const keywords = Object.values(codes)
  .filter(_ => !['*', 'REM'].includes(_))
  .map(_ => _.replace(/\$/, '\\$(?:\\s)'));

CodeMirror.defineSimpleMode('basic', {
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: 'string' },
    { regex: /\s*\d+\b/, token: 'variable-3 basic-line-number', sol: true },
    { regex: /(GO TO)(\s+)(\d+)\b/, token: ['keyword', null, 'variable-3'] },
    { regex: /BIN\s[01]+/, token: 'number-binary number' },
    {
      regex: /(?:0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?)/i,
      token: 'number',
    },
    {
      regex: new RegExp(`\\b(?:${keywords.join('|')})\\b`),
      token: 'keyword',
    },
    { regex: /'.*/, token: 'comment' },
    { regex: /\b(REM)\b(.*)/, token: ['keyword', 'comment comment-body'] },
    {
      regex: new RegExp('&|\\*|\\-|\\+|=|<>|<|>|\\|\\^|<<|>>|~'),
      token: 'operator',
    },
  ],
  meta: {
    dontIndentStates: ['comment'],
    lineComment: 'REM',
  },
});

CodeMirror.defineMIME('text/x-basic', 'basic');
