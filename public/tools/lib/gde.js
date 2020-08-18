/**
 * @param {Uint8Array} d
 * @returns {string}
 **/
const decode = (d) => new TextDecoder().decode(d);

/**
 * @typedef {object} gde
 * @property {string} url
 * @property {Function} navigate
 */

/**
 * @param {Uint8Array} data
 * @returns {gde}
 */
export default function explodeGde(data) {
  const contents = decode(data);
  const lines = contents.split('\n');

  const metadata = {};
  const nodes = [];

  const isMetaData = (s) => s.startsWith('@') && !s.startsWith('@{');

  const tags = {
    h1: '<h1>',
    h2: '<h2>',
    h3: '<h3>',
    h4: '<h4>',
    c: '<span class="center">',
    i: '<em>',
    ui: '</em>',
    b: '<strong>',
    ub: '</strong>',
    r: '<span class="right">',
  };

  const urlLength = `blob:${location.origin}/`.length + 36;
  const link = (/**@type string */ s) => s; //.padEnd(urlLength, ' ');

  const blockTags = ['h1', 'h2', 'h3', 'h4', 'c', 'r'];

  const toMarkdown = (line) => {
    const blocks = [];
    line = line.replace(/@{(.*?)}/g, (all, match) => {
      if (blockTags.includes(match)) {
        blocks.push(match);
        return '';
      }
      if (tags[match]) return tags[match];
      if (!match.includes('LINK')) {
        throw new Error('Unknown tag: ' + match);
      }
      const parts = match.split(/"(.*)"\sLINK\s(.*$)/).filter(Boolean);

      return `<a href="${link(parts[1])}">${parts[0].trim()}</a>`;
    });

    let className = '';
    if (blocks.includes('r')) {
      className = 'right';
    }
    if (blocks.includes('c')) {
      className = 'center';
    }

    const headings = blocks
      .filter((_) => _.startsWith('h'))
      .map((tag) => {
        line = `<${tag} class="${className}">${line}</${tag}>`;
      });

    if (className && headings.length === 0) {
      line = `<span class="${className}">${line}</span>`;
    }

    return line;
  };

  const commands = [
    'author',
    'build',
    'copyright',
    'date',
    'index',
    'node',
    'rem',
    'title',
    'version',
    'next',
    'prev',
    'toc',
  ];

  let node = null;

  const head = (metadata) => `
<html>
<head>
  <title>${metadata.title}</title>
  <base href="${window.location.origin}">
  <link href="/assets/gde.css" rel="stylesheet">
</head>
<body>
`;

  lines.forEach((line) => {
    if (isMetaData(line)) {
      let [command, ...param] = line.substr(1).split(' ');
      param = param.join(' ');
      command = command.toLowerCase();
      if (!commands.includes(command)) return;

      switch (command) {
        case 'node':
          node = {
            id: param,
            content: head(metadata),
          };
          nodes.push(node);
          break;
        case 'prev':
        case 'next':
          node[command] = param;
          break;
        default:
          metadata[command] = param;
      }
    } else {
      // convert to markdown
      node.content += toMarkdown(line) + '\n';
    }
  });

  const footer = (node) => `
<footer>
  <nav>
    <ul>
      <li><a href="${link(node.prev)}">Previous</a></li>
      <li><a href="${link(metadata.index)}">Index</a></li>
      <li><a href="${link(node.next)}">Next</a></li>
    </ul>
  </nav>
</footer>
<script>
document.body.addEventListener('click', (e) => {
  debugger;
  if (e.target.nodeName !== 'A') return;
  e.preventDefault();
  window.location = window.opener.gdeNavigate(e.target.pathname);
});
</script>
`;

  nodes.forEach((node) => {
    node.content += footer(node);
    node.url = URL.createObjectURL(
      new Blob([node.content], { type: 'text/html' })
    );
  });

  const linkIndex = {};

  nodes.forEach((node) => {
    const html = node.content;
    let index = -1;
    while ((index = html.indexOf('a href="', index + 1)) != -1) {
      const filename = html.substring(index + 8, html.indexOf('"', index + 8));
      const n = nodes.find((_) => _.id === filename);

      if (!n) {
        console.log('not found: ' + filename);
      } else {
        linkIndex[filename] = n.url;
      }

      // if (ctr > 100) break;
    }
  });

  const index = nodes.find((_) => _.id === 'INDEX');

  const navigate = (key) => linkIndex[key.substr(1)];

  return { url: index.url, navigate };
}
