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
import { indexToNextLEShort, next512FromRGB } from '../sprites/lib/colour.js';
import { Palette } from '../sprites/Palette.js';
import { renderImageFromNextFormat } from './lib/next-image.js';
import odin from './lib/odn.js';
import Exporter from '../sprites/Exporter';
import Bind from '../lib/bind';

let explore = null;
let uploadedPalette = null;
let palInputType = 'default';
const buttons = $('[data-action]');

const result = document.querySelector('#result');
const nextResult = document.querySelector('#next-image-result');
const fontSize = document.querySelector('#font-size');
const tapExplore = document.querySelector('#tap-explore-result');
const tapCreatorOutput = document.querySelector('#tap-creator tbody');

let tapper = new Tapper();
window.tapper = tapper;

class ExportBinary {
  constructor() {
    this.exporter = new Exporter();
    this.exporter.binaryFile = [];
    this.filename = 'untitled';

    drop(document.querySelector('#export'), (data, file) =>
      this.setFile(data, file)
    );

    $('#export button[data-action]').on('click', (e) => {
      const { action } = e.target.dataset;

      if (action === 'export-copy') {
        navigator.clipboard.writeText(this.output.value);
        return;
      }

      const asm = this.exporter.settings.dist === 'asm';
      if (action === 'export-download-source') {
        const filename = prompt(
          'Filename?',
          this.filename + '.' + (asm ? 's' : 'bas')
        );
        if (filename) {
          const file = new TextEncoder().encode(this.output.value);
          save(file, filename);
        }
      }

      if (action === 'export-download') {
        const filename = prompt('Filename?', this.fullFilename);
        if (filename) {
          const file = this.exporter.binaryFile;
          save(file, filename);
        }
      }
    });

    $('#export-source-file').on('change', (event) => {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        this.setFile(new Uint8Array(readerEvent.target.result), file);
      };
      reader.readAsArrayBuffer(file);
    });

    this.exporter.hook((_, forced) => {
      if (!forced) this.update();
    });

    const callback = () => {
      if (!this.file) return;

      const max = this.file.length - this.settings.offset;
      $('#export-source-length')[0].setAttribute('max', max);

      if (this.settings.length > max) {
        this.settings.length = max;
      }

      this.exporter.binaryFile = this.file.slice(
        this.settings.offset,
        this.settings.length
      );

      this.update();
    };

    this.settings = new Bind(
      { offset: 0, length: 0 },
      {
        offset: { dom: '#export-source-offset', callback },
        length: { dom: '#export-source-length', callback },
      }
    );
  }

  get output() {
    return this.exporter.output;
  }

  setFile(data, file) {
    this.file = data;
    this.filename = file.name.split('.').slice(-1).join('.');
    this.fullFilename = file.name;
    this.exporter.binaryFile = data;
    this.settings.length = data.length;
    $('#export-source-length')[0].setAttribute('max', data.length);
    $('#export-source-offset')[0].setAttribute('max', data.length);
    this.update();
  }

  update() {
    this.exporter.update(true);
  }
}

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

  if (!action.startsWith('download-')) return;

  const ids = Array.from(
    tapExplore.querySelectorAll('input[name="block"]:checked')
  ).map((el) => parseInt(el.value));

  const id = ids[0];
  const block = explore.blocks[id];
  let filename = explore.blocks[0].header.filename.trim();

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
    console.log(e);
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
  const parts = filename.split('.').filter(Boolean);
  if (parts.length === 1) {
    return parts[0];
  }
  return parts.slice(0, -1).join('.');
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
  const palette = palInputType === 'custom' ? uploadedPalette : new Palette();
  const canvas = document.createElement('canvas');
  /** @type HTMLImageElement */
  let img = await loadImage(file);

  let width = 256;
  let height = 192;

  if (img.width < 256) {
    width = img.width;
    height = img.height;
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  const div = document.createElement('div');
  div.className = 'container';

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const bmp = new BmpEncoder({
    data: new Uint8Array(imageData.data.buffer),
    width,
    height,
    palette: palInputType === 'detect' ? null : palette.data,
  });
  const bmpData = bmp.encode();

  const ext = {
    default: ['SL2', 'sl2'],
    128: ['SLR', 'slr'],
  };

  let renderedImage = new Image();
  const blob = new Blob([bmpData], { type: 'image/bmp' });
  const url = URL.createObjectURL(blob);

  renderedImage.src = url;

  div.appendChild(renderedImage);

  const filename = file.name;

  const g1 = document.createElement('div');
  g1.className = 'button-group';
  div.appendChild(g1);

  const g2 = document.createElement('div');
  g2.className = 'button-group';
  div.appendChild(g2);

  const button = document.createElement('button');
  button.innerText = 'BMP';
  g1.appendChild(button);
  button.onclick = () => save(bmpData, basename(filename) + '.bmp');

  const buttonSL = document.createElement('button');
  buttonSL.innerText = (ext[width] || ext.default)[0];

  g1.appendChild(buttonSL);
  buttonSL.onclick = () => {
    // convert the palette to next raw data
    const layerBmp = new BmpEncoder({
      data: new Uint8Array(imageData.data.buffer),
      width,
      height,
      palBitSize: 8,
    });

    save(
      Uint8Array.from(layerBmp.pixels),
      basename(filename) + '.' + (ext[width] || ext.default)[1]
    );
  };

  const buttonNXP = document.createElement('button');
  buttonNXP.innerText = 'PAL';
  g1.appendChild(buttonNXP);

  const buttonNXIp = document.createElement('button');
  buttonNXIp.innerText = 'NXI + pal';
  g2.appendChild(buttonNXIp);

  const buttonNXI = document.createElement('button');
  buttonNXI.innerText = 'NXI - pal';
  g2.appendChild(buttonNXI);

  const p1 = Array.from(bmp.palette);
  const p2 = new Uint16Array(256);
  for (let i = 0; i < p1.length; i += 4) {
    const [b, g, r] = p1.slice(i, i + 3);
    p2[i / 4] = indexToNextLEShort(next512FromRGB({ r, g, b }));
  }
  const p3 = new Uint8Array(p2.buffer);

  buttonNXIp.onclick = () => {
    const bytes = new Uint8Array(512 + bmp.index.length);
    bytes.set(p3, 0);
    bytes.set(bmp.index, 512);
    save(bytes, basename(filename) + '.nxi');
  };

  buttonNXI.onclick = () => {
    const bytes = new Uint8Array(bmp.index.length);
    bytes.set(bmp.index, 0);
    save(bytes, basename(filename) + '.nxi');
  };

  buttonNXP.onclick = () => {
    const bytes = new Uint8Array(512);
    bytes.set(p3, 0);
    save(bytes, basename(filename) + '.pal');
  };

  nextResult.prepend(div);
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
 * @param {String} c Character to render
 * @param {number} i
 * @param {string} [font="16px test"]
 * @param {number} height
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
    const base = name.replace(/\..*$/, '');
    button.textContent = 'Download "' + base + '" font';
    button.style.display = 'block';
    button.onclick = () => {
      save(bytes, base + '.bin');
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

function exploreOdin(data) {
  const ta = document.createElement('textarea');
  ta.value = odin(data);
  ta.setAttribute('spellcheck', 'false');
  ta.className = 'code';
  tapExplore.appendChild(ta);
}

/**
 * @param {Uint8Array} data
 * @param {File} file
 * @param {FileList} fileList
 * @param {Event} event
 * @returns {*}
 */
async function fileHandler(data, file, fileList, event) {
  const { id } = event.target;
  const { name, type } = file;

  const ext = name.split('.').pop().toUpperCase();

  if (id === 'create-tap') {
    return createTapAddFile(data, file);
  }

  if (id === 'upload-pal') {
    uploadedPalette = new Palette();
    uploadedPalette.import(file, data);
    return;
  }

  if (id === 'font-import') {
    return importFont(data, file);
  }

  if (ext === 'TAP') {
    exploreTap(data);
  } else if (ext === 'TZX') {
    exploreTzx(data);
  } else if (ext === 'ODS' || ext === 'ODN') {
    exploreOdin(data);
  } else if (ext === 'GDE') {
    window.location = '/tools/gde';
  } else if (ext === 'SCR') {
    if (data.length === 128 + 6912) {
      // includes a header - just drop it
      data = data.slice(128);
    }
    pixelsForSCR(data, container(name));
  } else if (id === 'upload-next-format') {
    renderImageFromNextFormat(
      file,
      data,
      uploadedPalette || new Palette(),
      result
    );
  } else if (id === 'upload-convert') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const res = await dither({ url });
    pixelsForSCR(res, container(name, res));
    URL.revokeObjectURL(url);
  } else if (id === 'export-source-file') {
    exporter.setFile(data);
  } else {
    renderImageForBmp(file, data);
  }
}

const exporter = new ExportBinary();
drop(document.body, fileHandler);
drop(document.querySelector('#tap-creator'), createTapAddFile);

$('input[type="file"]').on('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (readerEvent) => {
    fileHandler(new Uint8Array(readerEvent.target.result), file, null, event);
    if (event.target.id === 'bmp-to-next') event.target.value = '';
  };
  reader.readAsArrayBuffer(file);
});

$('input[name="next-pal"]').on('change', (e) => {
  palInputType = e.target.value;
  nextResult.innerHTML = '';
});
