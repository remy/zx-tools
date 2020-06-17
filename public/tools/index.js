import drop from '../lib/dnd.js';
import { pixelsForSCR } from './lib/scr.js';
import { $ } from '../lib/$.js';
import save from '../lib/save.js';
import { dither } from './lib/retrofy.js';
import { Tzx, TapFile } from './lib/tzx.js';
import { plus3DOSHeader } from 'txt2bas';
import { charset } from './lib/font.js';

let explore = null;
const buttons = $('[data-action]');

const result = $('#result')[0];

buttons.on('click', async (e) => {
  const action = e.target.dataset.action;
  const ids = Array.from(
    result.querySelectorAll('input[name="block"]:checked')
  ).map((el) => parseInt(el.value));

  const id = ids[0];
  const block = explore.blocks[id];
  let filename = explore.blocks[id - 1].header.filename.trim();

  let ext = '';

  if (action === 'download-basic') {
    ext = '.bas';
  } else {
    ext = '.bin';
  }

  filename = prompt('Filename:', filename + ext);
  if (!filename) {
    return;
  }

  if (action === 'download-basic') {
    const data = new Uint8Array(block.length + 128);
    const header = plus3DOSHeader(block.data);
    data.set(header, 0);
    data.set(block.data, 128);
    save(data, filename);
  } else {
    save(block.data, filename);
  }
});

function exploreTap(data) {
  try {
    explore = new TapFile(data);
    renderBlockTable(explore.blocks);
  } catch (e) {
    result.innerHTML = `<div class="error"><p>The file couldn't be parsed. Please try a different file, or report the issue via the help menu (top right). Thanks.</p><pre><code>${e.message}\n\n${e.stack}</code></pre></div>`;
  }
}

function exploreTzx(data) {
  try {
    explore = new Tzx(data);
    renderBlockTable(explore.blocks);
  } catch (e) {
    result.innerHTML = `<div class="error"><p>The file couldn't be parsed. Please try a different file, or report the issue via the help menu (top right). Thanks.</p><pre><code>${e.message}\n\n${e.stack}</code></pre></div>`;
  }
}

function peek(data) {
  try {
    if (data.header && data.header.flagByte === 0) {
      return `filename: ${data.header.filename}
length: ${data.header.length}
param1: 0x${data.header.p1.toString(16).padStart(4, '0').toUpperCase()}
param2: 0x${data.header.p2.toString(16).padStart(4, '0').toUpperCase()}`;
    }

    if (data.header && data.length === 768) {
      const id = `font${Math.random().toString().split('.').pop()}`;
      new Promise((resolve) => {
        setTimeout(resolve, 100);
      }).then(() => {
        const canvases = charset(data.data);
        const root = document.querySelector('#' + id);
        canvases.forEach((c) => root.appendChild(c));
      });
      return `<div id="${id}"></div>`;
    }

    if (data.header && data.length === 6912) {
      const id = `scr${Math.random().toString().split('.').pop()}`;
      new Promise((resolve) => {
        const ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = 256;
        ctx.canvas.height = 192;
        pixelsForSCR(data.data, ctx);
        setTimeout(() => ctx.canvas.toBlob(resolve), 100);
      })
        .then((blob) => {
          const url = URL.createObjectURL(blob);

          const root = document.querySelector('#' + id);
          root.src = url;

          URL.revokeObjectURL(url);
        })
        .catch((e) => console.log(e));
      return `<img id="${id}">`;
    }

    if (data.peek) return data.peek();

    if (data.toString) return data.toString();
  } catch (e) {
    return 'Failed to peek';
  }
}

function renderBlockTable(blocks) {
  result.onclick = (event) => {
    if (event.target.nodeName === 'LABEL' || event.target.nodeName === 'INPUT')
      return;
    event.preventDefault();

    const tr = event.target.closest('tr');

    if (tr) {
      const i = tr.dataset.id;
      const el = $('#download' + i);
      el.checked = !el.checked;
    }
  };

  document.body.classList.add('download-data');

  const html = blocks
    .map((data, i) => {
      return `
<tr data-id="${i}">
  <td><input type="radio" name="block" id="download${i}" value="${i}"></td>
  <td><label for="download${i}">${i}</label></td>
  <td class="type">${data.type}</td>
  <td><label for="peek${i}" class="peek">peek</label></td>
  <td class="contents">${data.toString()}</td>
</tr>
<tr class="peek-contents"><td colspan="5"><input type="checkbox" id="peek${i}"><div>${peek(
        data
      )}</div></td></tr>
`;
    })
    .join('\n');

  result.innerHTML = `<table><thead><tr><th></td><th>Id</th><th>Type</th><th colspan=2>Contents</th></tr></thead><tbody>${html}</tbody></table>`;
}

function basename(filename) {
  return filename.split('.').slice(0, -1).join('.');
}

function container(filename, altDownload, r = result) {
  const isSCR = filename.toUpperCase().endsWith('.SCR');

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const div = document.createElement('div');
  div.className = 'container';
  div.appendChild(canvas);

  const button = document.createElement('button');
  div.appendChild(button);
  button.onclick = async () => {
    const file = await new Promise((resolve) => canvas.toBlob(resolve));

    save(file, basename(filename) + '.png');
  };
  button.innerText = 'Download PNG';

  if (!isSCR) {
    const button = document.createElement('button');
    div.appendChild(button);
    button.onclick = async () => {
      save(altDownload, basename(filename) + '.scr');
    };
    button.innerText = 'Download SCR';
  }

  r.prepend(div);
  return ctx;
}

async function fileHandler(data, file) {
  const { name, type } = file;
  const ext = name.split('.').pop().toUpperCase();
  if (ext === 'TAP') {
    exploreTap(data);
  } else if (ext === 'TZX') {
    exploreTzx(data);
  } else if (ext === 'SCR') {
    if (data.length === 128 + 6912) {
      // includes a header - just drop it
      data = data.slice(128);
    }
    pixelsForSCR(data, container(name));
  } else {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const res = await dither({ url });
    pixelsForSCR(res, container(name, res));
    URL.revokeObjectURL(url);
  }
}

drop(document.body, fileHandler);

$('input').on('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) =>
    fileHandler(new Uint8Array(event.target.result), file);
  reader.readAsArrayBuffer(file);
});
