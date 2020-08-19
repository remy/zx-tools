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
 * @param {string} name
 * @returns {gde}
 */
export default function explodeGde(data, name) {
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

  const blockTags = ['h1', 'h2', 'h3', 'h4', 'c', 'r'];

  const toMarkdown = (line) => {
    const blocks = [];
    line = line
      .replace(/[<>]/, (m) => {
        return { '<': '&lt;', '>': '&gt;' }[m];
      })
      .replace(/@{(.*?)}|@@/g, (all, match) => {
        if (all === '@@') return all;
        if (blockTags.includes(match)) {
          blocks.push(match);
          return '';
        }
        if (tags[match]) return tags[match];
        if (!match.includes('LINK')) {
          return '';
        }
        const link = match.split(/"(.*)"\sLINK\s(.*$)/).filter(Boolean);

        const spacer = link[0].match(/(\s+)/g);
        let left = '';
        let right = '';
        if (spacer) {
          left = ' '.repeat(spacer[0].length);
          if (spacer.length > 1) right = ' '.repeat(spacer.pop().length);
        }

        return `${left}<a href="${link[1].toLowerCase()}">${link[0].trim()}</a>${right}`;
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
  <base href="${location.origin}">
  <link href="/assets/gde.css" rel="stylesheet">
</head>
<body><main>
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
            id: param.toLowerCase(),
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
    } else if (node) {
      // convert to markdown
      node.content += toMarkdown(line) + '\n';
    }
  });

  const footer = (node) => `
</main><footer><p class="info"><span class="name">${name}</span> <span class="node-id">${node.id.toUpperCase()}</span></p><nav>
    <ul>
      <li>${
        node.prev
          ? `<a href="${node.prev.toLowerCase()}">Previous</a>`
          : '&nbsp;'
      }</li>
      <li><a href="${nodes[0].id.toLowerCase()}">Main</a></li>
      <li>${
        metadata.index
          ? `<a href="${metadata.index.toLowerCase()}">Index</a>`
          : '&nbsp;'
      }</li>
      <li>${
        node.next ? `<a href="${node.next.toLowerCase()}">Next</a>` : '&nbsp;'
      }</li>

    </ul>
  </nav>
</footer>
<script>
document.body.addEventListener('click', (e) => {
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
      const filename = html
        .substring(index + 8, html.indexOf('"', index + 8))
        .toLowerCase();
      const n = nodes.find((_) => _.id === filename);

      if (!n) {
        console.log('not found: ' + filename);
      } else {
        linkIndex[filename] = n.url;
      }
    }
  });

  const index = nodes[0];

  const navigate = (key) => linkIndex[key.substr(1).toLowerCase()];

  return { url: index.url, navigate };
}
