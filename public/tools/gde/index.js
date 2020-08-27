import { $ } from '../../lib/$.js';
import { gde } from '../lib/gde';
import CodeMirror from '../../lib/cm.js';
import './syntax';
import save from '../../lib/save.js';

const preview = $('iframe');
const meta = $('#meta');
const editor = CodeMirror.fromTextArea(document.querySelector('#editor'), {
  lineWrapping: true,
  extraKeys: { 'Alt-F': 'findPersistent' },
  mode: 'text/x-gde',
  viewportMargin: Infinity,
  styleActiveLine: true,
});

window.editor = editor;

let currentNode = null;
let widgets = [];

/**
 * Saves current state to local storage
 */
function saveLocal() {
  localStorage.setItem('gde', editor.getValue());
}

/**
 * restores from local storage
 */
function restore() {
  const gde = localStorage.getItem('gde');
  if (gde) {
    editor.setValue(gde);
  }
}

/**
 * boot up
 */
function init() {
  try {
    restore();
  } catch (e) {}
  const source = editor.getValue();
  if (source.trim().length) {
    process(source);
  }
}

/**
 * Convert source into rendered HTML and check for errors
 *
 * @param {string} source
 */
function process(source) {
  clearErrors();
  const res = gde(source, 'untitled.gde');
  console.log(res);

  if (!currentNode) {
    currentNode = res.nodes[0].id;
  }

  meta.innerHTML = `<p>Errors: ${
    res.errors.length
  } &nbsp; Nodes: <select>${res.nodes.map(
    (_) => `<option ${currentNode === _.id ? 'selected' : ''}>${_.id}</option>`
  )}</select></p>`;

  meta.onchange = ({ target }) => {
    const url = window.gdeNavigate(target.value);
    console.log(url);
    preview.src = url;
  };

  if (res.errors) {
    res.errors.forEach(createError);
  }

  let url = res.navigate(currentNode) || res.url;

  preview.src = url;
  window.gdeNavigate = (url) => {
    console.log('nav to ' + url);
    currentNode = url;

    return res.navigate(url);
  };
}

function createError(error) {
  console.log(error);

  const el = document.createElement('div');
  el.className = 'line-error';
  if (error.type === 'bad_link') {
    el.textContent = 'Bad link syntax: ' + error.data.join(' ');
    widgets.push(editor.addLineWidget(error.lineNumber, el));
  } else if (error.type === 'missing_node') {
    const lines = editor.getValue().toLowerCase().split('\n');
    el.textContent = 'Unknown node: @' + error.data.filename;
    lines.map((line, i) => {
      if (line.includes('link ' + error.data.filename.toLowerCase())) {
        widgets.push(editor.addLineWidget(i, el));
      }
    });
  }
}

function clearErrors() {
  widgets.forEach((w) => w.clear());
  widgets = [];
}

editor.on('change', () => {
  saveLocal();
  process(editor.getValue());
});

editor.on('keydown', (cm, event) => {
  console.log('keydown', event.altKey);

  if (event.altKey) {
    document.body.classList.add('goto');
  } else {
    document.body.classList.remove('goto');
  }
});

editor.on('keyup', () => {
  document.body.classList.remove('goto');
});

editor.getWrapperElement().addEventListener('click', (e) => {
  if (e.altKey) {
    let onToken = e.target.classList.contains('cm-block-link-content');
    console.log(onToken);

    if (onToken) {
      const needle = '@node ' + e.target.innerText.trim().toLowerCase();

      let target = null;
      editor.eachLine((line) => {
        const { text } = line;

        if (text.toLowerCase().includes(needle))
          target = editor.getLineNumber(line);
      });

      if (target !== null) {
        editor.setCursor({ line: target, ch: needle.toString().length });
      }
    }
  }
});

$('#meta button').on('click', async () => {
  const res = await fetch('/assets/NextGuide.gde');
  const text = await res.text();
  editor.setValue(text);
  saveLocal();
  process(text);
});

editor.setOption('extraKeys', {
  'Cmd-s': function () {
    const filename = prompt('Filename:', 'untitled.gde');
    if (filename) {
      save(editor.getValue(), filename);
    }
  },
});

init();
