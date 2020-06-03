import CodeMirror from '../lib/cm.js';
import { codes } from 'txt2bas';

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
      regex: /(\s*)(;.*)/,
      token: [null, 'comment'],
      sol: true,
      eol: true,
    },
    {
      regex: /(:)\s*(;.*)/,
      token: [null, 'comment'],
      next: 'comment',
      eol: true,
    },
    {
      regex: /#\w+/,
      sol: true,
      token: ['pragma'],
      // eol: true,
    },
    {
      regex: /\b(PROC)(\s+)([a-z][a-z0-9]+)/i,
      token: ['keyword keyword-with-fn', null, 'goto fn goto-fn'],
    },
    { regex: /\s*\d+\b/, token: 'variable-3 basic-line-number', sol: true },
    {
      regex: /(GO SUB|GO TO|LINE|THEN)(\s+)(%?\d+)\b/,
      token: ['keyword', null, 'number goto'],
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
  comment: [
    { regex: /.$/, token: 'comment', next: 'start' },
    { regex: /.*$/, token: 'comment' },
  ],
  meta: {
    dontIndentStates: ['comment'],
    lineComment: 'REM',
  },
});

CodeMirror.defineMIME('text/x-basic', 'basic');
