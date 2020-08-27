import CodeMirror from '../../lib/cm.js';

const meta = ['author', 'build', 'copyright', 'date', 'title', 'version'];
const keywords = ['index', 'node', 'rem', 'next', 'prev', 'toc'];

CodeMirror.defineSimpleMode('gde', {
  // The start state contains the rules that are intially used
  start: [
    // The regex matches the token, the token property contains the type
    {
      regex: new RegExp(`(@(?:${keywords.join('|')}))(\\s)(\\S+)`, 'i'),
      token: ['keyword', null, 'param block-link-content'],
    },
    {
      regex: new RegExp(`(?:@${meta.join('|@')})`),
      token: 'variable-3',
      sol: true,
    },
    {
      regex: /(@{b})(.*?)(@{ub})/,
      token: [null, 'block-b', null],
    },
    {
      regex: /(@{i})(.*?)(@{ui})/,
      token: [null, 'block-i', null],
    },
    // {
    //   regex: /@{(.*?)}(.*)@{(u.*?)}$/,
    //   token: ['variable-2', null, 'variable-2'],
    // },
    {
      regex: /(@{\s*".+?" LINK )(.+?)(})/i,
      token: ['block-link', 'block-link block-link-content', 'block-link'],
    },

    {
      regex: /^(@{c}.*)/,
      token: ['block-c block'],
    },
    {
      regex: /^(@{r}.*)/,
      token: ['block-r block'],
    },
    {
      regex: /^(@{h1}.*)/,
      token: ['block-h1 block'],
    },
    {
      regex: /^(@{h2}.*)/,
      token: ['block-h2 block'],
    },
    {
      regex: /^(@{h3}.*)/,
      token: ['block-h3 block'],
    },
    {
      regex: /^(@{h4}.*)/,
      token: ['block-h4 block'],
    },
    {
      regex: /^@.*$/,
      token: 'comment',
    },

    // { regex: /\s*\d+\b/, token: 'variable-3 basic-line-number', sol: true },
  ],
  meta: {},
});

CodeMirror.defineMIME('text/x-gde', 'gde');
