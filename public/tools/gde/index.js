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
  // viewportMargin: Infinity,
  styleActiveLine: true,
});

window.editor = editor;

let currentNode = null;
let errorWidgets = [];
let nodeWidgets = [];

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

  if (!currentNode) {
    currentNode = res.nodes[0].id;
  }

  meta.innerHTML = `<p>Errors: ${
    res.errors.length
      ? `<button data-action="error-jump" id="error-jump">${res.errors.length}</button>`
      : 0
  } &nbsp; Nodes: <select>${res.nodes.map(
    (_) => `<option ${currentNode === _.id ? 'selected' : ''}>${_.id}</option>`
  )}</select></p>`;

  meta.onchange = ({ target }) => {
    const url = window.gdeNavigate(target.value);
    // console.log(url);
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
  console.log({ error });

  const el = document.createElement('div');
  el.className = 'line-error';
  if (error.type === 'bad_link') {
    el.textContent = 'Bad link syntax: ' + error.data.join(' ');
    errorWidgets.push(editor.addLineWidget(error.lineNumber, el));
  } else if (error.type === 'missing_node') {
    el.textContent = 'Unknown node: @' + error.data.id;
    errorWidgets.push(editor.addLineWidget(error.data.lineNumber, el));
  } else if (error.type === 'unknown_tag') {
    el.textContent = 'Unknown tag: ' + error.data;
    errorWidgets.push(editor.addLineWidget(error.lineNumber, el));
  }
}

function clearErrors() {
  errorWidgets.forEach((w) => w.clear());
  errorWidgets = [];
}

var waiting;

editor.on('change', () => {
  saveLocal();
  process(editor.getValue());
  clearTimeout(waiting);
  waiting = setTimeout(updateNodeSplits, 500);
});

editor.on('keydown', (cm, event) => {
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

function updateNodeSplits() {
  editor.operation(() => {
    for (var i = 0; i < nodeWidgets.length; ++i) {
      editor.removeLineWidget(nodeWidgets[i]);
    }
    nodeWidgets.length = 0;

    const nodes = editor
      .getValue()
      .split('\n')
      .map((line, i) => {
        if (!line.toLowerCase().includes('@node ')) return false;

        return {
          line,
          lineNumber: i,
          name: line.trim().match(/@node\s+(.*$)/i)[1],
        };
      })
      .filter(Boolean);

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const el = document.createElement('div');
      el.className = 'line-node-split';
      el.textContent = `Start of new node: ${node.name}`;
      nodeWidgets.push(
        editor.addLineWidget(node.lineNumber, el, {
          coverGutter: false,
          noHScroll: true,
          above: true,
        })
      );
    }
  });
}

document.documentElement.addEventListener('click', async ({ target }) => {
  const action = target.dataset.action;
  if (!action) return;

  if (action === 'load-demo') {
    const res = await fetch('/assets/NextGuide.gde');
    const text = await res.text();
    editor.setValue(text);
    saveLocal();
    process(text);
  }

  if (action === 'error-jump') {
    const first = errorWidgets[0];
    editor.scrollIntoView({ line: first.line.lineNo(), ch: 0 }, 60);
  }
});

CodeMirror.commands.save = () => {
  const filename = prompt('Filename:', 'untitled.gde');
  if (filename) {
    save(editor.getValue(), filename);
  }
};

init();
