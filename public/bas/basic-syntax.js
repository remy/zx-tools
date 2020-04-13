import CodeMirror from '../lib/cm.js';
import codes from './codes.js';

const keywords = Object.values(codes).filter(
  (_) => !['*', 'REM', '$'].includes(_)
);

const $keywords = Object.values(codes)
  .filter((_) => _.includes('$'))
  .map((_) => _.replace(/\$/, '\\$'));

CodeMirror.defineSimpleMode('basic', {
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: 'string' },
    {
      regex: /(\s*\d+)(\b\s*)(;.*)/,
      token: ['variable-3 basic-line-number', null, 'comment'],
      sol: true,
      eol: true,
    },
    {
      regex: /(:)\s*(;.*)/,
      token: [null, 'comment'],
      eol: true,
    },
    { regex: /\s*\d+\b/, token: 'variable-3 basic-line-number', sol: true },
    {
      regex: /(GO SUB|GO TO|LINE)(\s+)(%?\d+)\b/,
      token: ['keyword', null, 'number goto'],
    },
    {
      regex: /\b(PROC)(\s+)(.+)\(\)/,
      token: ['keyword', null, 'goto goto-fn'],
    },
    { regex: /BIN\s[01]+/, token: 'number-binary number' },
    {
      regex: /(?:\$[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?)/i,
      token: 'number',
    },
    {
      regex: new RegExp(`\\b(?:${keywords.join('|')})\\b`),
      token: 'keyword',
    },
    {
      regex: new RegExp(`\\b(?:${$keywords.join('|')})(?:[\\b|\\s|]|$)`),
      token: 'keyword',
    },
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
