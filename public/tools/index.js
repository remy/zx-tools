import drop from '../lib/dnd.js';
import { pixelsForSCR } from './lib/scr.js';
import { $ } from '../lib/$.js';
import save from '../lib/save.js';
import { dither } from './lib/retrofy.js';
import { Tzx, TapFile } from './lib/tzx.js';
import { plus3DOSHeader, statements, file2txt } from 'txt2bas';
import { charset } from './lib/font.js';
import { Tapper } from './lib/tapper';
import { toHex } from '../lib/to.js';
import BmpEncoder from '../lib/bmpEncoder.js';
import fontMetrics, { computeHeightFromMetrics } from '../lib/fontMetrics';

let explore = null;
const buttons = $('[data-action]');

const result = $('#result')[0];
const fontSize = document.querySelector('#font-size');
const tapExplore = $('#tap-explore-result')[0];
const tapCreatorOutput = $('#tap-creator tbody')[0];

let tapper = new Tapper();
window.tapper = tapper;

function selected(value, cmp) {
  if (value === cmp) return 'selected';
  return '';
}

function renderTapperBlock({ tr, block }) {
  const html = `
  <td><label><input size="3" min="1" type="number" name="order" value="${
    block.order
  }"></label></td>
  <td class="filename"><input type="text" name="filename" size="11" maxlength="10" value="${
    block.filename
  }"></td>
  <td class="dataType"><select value="${
    block.dataType
  }" name="dataType"><option ${selected(
    block.dataType,
    0
  )} value="0">BASIC</option><option ${selected(
    block.dataType,
    1
  )} value="1">CODE</option><option ${selected(
    block.dataType,
    2
  )} value="2">BANK</option><option ${selected(
    block.dataType,
    3
  )} value="3">SCREEN$</option></select></td>
  <td class="blockType"><select name="blockType"><option ${selected(
    block.type,
    0
  )} value="0">Program</option><option ${selected(
    block.type,
    3
  )} value="3">Data</option></select></td>
  <td class="p1"><label><input size="6" name="p1" type="text" value="0x${toHex(
    block.p1,
    16
  )}"></label></td>
  <td class="p2"><label><input size="6" name="p2" type="text" value="0x${toHex(
    block.p2,
    16
  )}"></label></td>
  <td><button>del</button></td>
</tr>
`;
  tr.innerHTML = html;
}

function createTapAddFile(data, file) {
  const block = tapper.add({ file, data });
  const index = tapper.length - 1;

  if (index === 0 && file.name.toLowerCase().endsWith('.bas')) {
    // try to get auto start too
    const dataView = new DataView(data.buffer);
    const autostart = dataView.getUint16(18, true);

    block.p1 = autostart || 10;

    const st = statements(file2txt(data));

    const loads = st.filter(({ tokens }) => {
      return tokens.filter((token) => token.text === 'LOAD').length;
    });

    const meta = loads.map(({ tokens }) => {
      let ready = false;
      let next = null;
      let addr = 0xc000;
      let filename = null;
      let i = 0;
      for (; i < tokens.length; i++) {
        if (ready && tokens[i].name === 'STRING') {
          filename =
            tokens[i].value === '""' ? '"&lt;unnamed&gt;"' : tokens[i].value;
        }
        if (ready && tokens[i].name === 'KEYWORD') {
          next = tokens[i].text;
          break;
        }
        if (tokens[i].text === 'LOAD') {
          ready = true;
        }
      }

      if (next === 'CODE') {
        addr = tokens.slice(i).find((token) => token.numeric).value;
      }

      return { filename, next, addr };
    });

    $('#tap-creator .meta').innerHTML = `<p>Expecting ${
      meta.length
    } more file(s) (not particularly in this order):</p><ol>${meta
      .map(
        (res) =>
          `<li>${res.filename} ${res.next}${
            res.next === 'CODE' ? ` @ ${res.addr}` : ''
          }</li>`
      )
      .join('')}</ol>`;
  }

  const tr = document.createElement('tr');
  block.render = () => {
    renderTapperBlock({ tr, block });
  };

  block.render();

  const p1 = tr.querySelector('[name="p1"]');
  const p2 = tr.querySelector('[name="p2"]');
  const dt = tr.querySelector('[name="dataType"]');
  const bt = tr.querySelector('[name="blockType"]');

  const updateParams = () => {
    p1.value = `0x${toHex(block.p1, 16)}`;
    p2.value = `0x${toHex(block.p2, 16)}`;
  };

  tr.querySelector('button').addEventListener('click', () => {
    tapper.splice(index, 1);
    tapCreatorOutput.removeChild(tr);
  });

  p1.addEventListener('blur', () => {
    let v = p1.value;
    const radix = v.toLowerCase().includes('x') ? 16 : 10;
    v = parseInt(v, radix);
    block.p1 = v;
    updateParams();
  });

  p2.addEventListener('blur', () => {
    let v = p2.value;
    const radix = v.toLowerCase().includes('x') ? 16 : 10;
    v = parseInt(v, radix);
    block.p2 = v;
    updateParams();
  });

  tr.addEventListener('input', (e) => {
    const { name, value } = e.target;

    if (name === 'order') {
      const order = parseInt(value, 10);

      tapper.forEach((_) => {
        if (_.order === order) {
          _.order = block.order;
          _.render();
        }
      });
      block.order = order;

      // re-order nodes
      const trs = Array.from(tapCreatorOutput.childNodes);
      trs.sort((a, b) => {
        return (
          parseInt(a.querySelector('[name="order"]').value, 10) -
          parseInt(b.querySelector('[name="order"]').value, 10)
        );
      });
      trs.forEach((_) => {
        tapCreatorOutput.appendChild(_);
      });
      e.target.focus();
    }

    if (name === 'blockType') {
      block.type = value;
      updateParams();
      dt.value = block.dataType;
    }

    if (name === 'dataType') {
      block.dataType = value;
      updateParams();
      bt.value = block.type;
    }

    if (name === 'filename') {
      block.filename = value;
    }
  });

  tapCreatorOutput.appendChild(tr);
}

buttons.on('click', async (e) => {
  const action = e.target.dataset.action;

  if (action === 'generate-tap') {
    const filename = prompt('Filename:', 'untitled.tap');
    if (!filename) {
      return;
    }

    const data = tapper.generate();
    save(data, filename);

    return;
  }

  const ids = Array.from(
    tapExplore.querySelectorAll('input[name="block"]:checked')
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
    tapExplore.innerHTML = `<div class="error"><p>The file couldn't be parsed. Please try a different file, or report the issue via the help menu (top right). Thanks.</p><pre><code>${e.message}\n\n${e.stack}</code></pre></div>`;
  }
}

function exploreTzx(data) {
  try {
    explore = new Tzx(data);
    renderBlockTable(explore.blocks);
  } catch (e) {
    tapExplore.innerHTML = `<div class="error"><p>The file couldn't be parsed. Please try a different file, or report the issue via the help menu (top right). Thanks.</p><pre><code>${e.message}\n\n${e.stack}</code></pre></div>`;
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
  tapExplore.onclick = (event) => {
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

  tapExplore.innerHTML = `<table><thead><tr><th></td><th>Id</th><th>Type</th><th colspan=2>Contents</th></tr></thead><tbody>${html}</tbody></table>`;
}

function basename(filename) {
  return filename.split('.').slice(0, -1).join('.');
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = reject;
    img.src = url;
  });
}

async function renderImageForBmp(file) {
  const canvas = document.createElement('canvas');
  const width = 256;
  const height = 192;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const div = document.createElement('div');
  div.className = 'container';
  div.appendChild(canvas);

  const img = await loadImage(file);
  ctx.drawImage(img, 0, 0); // TODO scale to 256x192

  const button = document.createElement('button');
  div.appendChild(button);
  button.onclick = async () => {
    const imageData = ctx.getImageData(0, 0, width, height);

    const bmp = new BmpEncoder({
      data: new Uint8Array(imageData.data.buffer),
      width,
      height,
    });

    save(bmp.encode(), basename(file.name) + '.bmp');
  };
  button.innerText = 'Download as 8bit BMP';
  result.prepend(div);
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

/**
 * Print the single character and clean up the semi-opaque pixels
 * @param {Canvas2DContext} ctx
 * @param {String} c Character to render
 * @returns {HTMLCanvasElement} canvas element
 */
function generateChr(c, i, font = '16px "test"', height = 8) {
  const ctx = document.createElement('canvas').getContext('2d');

  ctx.canvas.title = `"${c}" -- 0x${i.toString(16)}`;

  ctx.canvas.width = 8;
  ctx.canvas.height = 8;
  ctx.imageSmoothingEnabled = false;
  ctx.canvas.classList.add('font');
  ctx.font = font;
  ctx.fillStyle = 'black';
  ctx.fillText(c, 0, height);

  // now clean up the bit data
  const imageData = ctx.getImageData(0, 0, 8, 8);
  const bytes = new Uint8Array(8);
  bytes.fill(0);
  for (let i = 0; i < imageData.data.length; i += 4) {
    const index = i / 4;
    const byteIndex = (index / 8) | 0;
    const bit = 7 - (index % 8);
    const byte = bytes[byteIndex];
    if (imageData.data[i + 3] === 255) {
      // 1
      bytes[byteIndex] = byte + (1 << bit);
    } else if (imageData.data[i + 3] > 128) {
      // 0
      imageData.data[i + 0] = 0;
      imageData.data[i + 1] = 0;
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    } else {
      imageData.data[i + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return { canvas: ctx.canvas, bytes };
}

function importFont(data, file) {
  const { name, type } = file;
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);

  let f = new FontFace('test', `url(${url})`);
  const bytes = new Uint8Array(768);

  const render = () => {
    const container = document.createElement('div');
    result.appendChild(container);
    const metrics = fontMetrics(data);
    const fontSizeValue = parseInt(fontSize.value);
    const computed = computeHeightFromMetrics(fontSizeValue, metrics);
    console.log({ ...metrics, ...computed });

    fontSize.onchange = () => {
      result.removeChild(container);
      render();
    };

    window.metrics = metrics;

    for (let i = 0x20; i < 0x80; i++) {
      let j = i;
      if (j === 0x60) j = 163;
      if (j === 0x7f) j = 169;
      const c = generateChr(
        String.fromCharCode(j),
        i,
        `${computed.fontSize}px/${computed.lineHeight} "test"`,
        8
      );
      container.appendChild(c.canvas);
      bytes.set(c.bytes, (i - 0x20) * 8);
    }
    const button = document.createElement('button');
    container.appendChild(button);
    button.textContent = 'Download font';
    button.onclick = () => {
      save(bytes, name.replace(/\.[...]/, '') + '.bin');
    };
  };

  f.load()
    .then((font) => {
      // To use the font in a canvas, we need to add to document fonts
      document.fonts.add(font);
      render();
    })
    .catch((e) => console.log(e));
}

async function fileHandler(data, file, id) {
  const { name, type } = file;
  const ext = name.split('.').pop().toUpperCase();

  if (id === 'create-tap') {
    return createTapAddFile(data, file);
  }

  if (id === 'font-import') {
    return importFont(data, file);
  }

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
  } else if (id === 'upload-convert') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const res = await dither({ url });
    pixelsForSCR(res, container(name, res));
    URL.revokeObjectURL(url);
  } else {
    renderImageForBmp(file, data);
  }
}

drop(document.body, fileHandler);
drop(document.querySelector('#tap-creator'), createTapAddFile);

$('input').on('change', (event) => {
  const file = event.target.files[0];
  const id = event.target.id;
  const reader = new FileReader();
  reader.onload = (event) =>
    fileHandler(new Uint8Array(event.target.result), file, id);
  reader.readAsArrayBuffer(file);
});
