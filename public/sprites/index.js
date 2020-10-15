import drop from '../lib/dnd.js';
import { rgbFromIndex, transparent, rgbFromNext } from './lib/colour.js';
import save from '../lib/save.js';
import { decode, parseNoTransformFile } from './lib/parser.js';
import ImageWindow from './ImageWindow.js';
import { $ } from '../lib/$.js';
import SpriteSheet from './SpriteSheet.js';
import ColourPicker from './ColourPicker.js';
import Tool from './Tool.js';
import TileMap from './TileMap.js';
import { plus3DOSHeader } from 'txt2bas';
import Tabs from '../lib/Tabs.js';
import { Unpack } from '@remy/unpack';
import { saveState, restoreState } from './state.js';
import debounce from 'lodash.debounce';
import trackDown from '../lib/track-down.js';
import palette from './Palette.js';
import Animate from './Animate.js';
import Exporter from './Exporter.js';

/**
 * @typedef { import("../lib/dnd").DropCallback } DropCallback
 */

const container = document.querySelector('#container');
const exampleBasicLink = document.querySelector('#basic-example-link');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites .container');
const debug = document.querySelector('#debug');
const upload = document.querySelector('#upload input');
const mapUpload = document.querySelector('#upload-map input');
const currentSpriteId = document.querySelector('#current-sprite');
const pickerColour = document.querySelector('.pickerColour');
const userToolPalette = document.querySelector('#palette .colour-picker');
const hasPriority = document.querySelector('#has-priority');
const buttons = $('[data-action]');
const animateContainer = document.querySelector('#animate');
const fourBitPalSelected = document.querySelector('#four-bit-pal-selection');
const fourBitPalPicker = document.querySelector('#four-bit-pal-picker');
const globalTransparencyWarning = document.querySelector(
  '#global-transparency-warning'
);
const globalTransparency = document.querySelector('#global-transparency');
const bitSize = $('#bit-size');
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const subSprites = $('#preview-8x8 canvas').map((canvas) => {
  canvas.width = canvas.height = 8 * 6;
  return canvas.getContext('2d');
});

/** @type {SpriteSheet} */
let sprites = null;

function pad3(n) {
  return n.toString().padStart(3, '0');
}

/**
 *
 * @param {Uint8Array} data
 * @param {File} [file]
 *
 * @returns {SpriteSheet}
 */
function newSpriteSheet(data, file = { name: 'untitled.spr' }) {
  let tmp;
  if (sprites) tmp = sprites.defaultScale;
  sprites = new SpriteSheet(data, {
    ctx,
    subSprites,
    fourBit: $('#size-4-bit').checked || file.name.includes('.nx'),
  });
  if (tmp) sprites.setScale(tmp);
  tileMap.sprites = sprites; // just in case
  animate.sprites = sprites;

  exporter.sprites = sprites;
  exporter.update();

  bitSize.emit('change');

  return sprites;
}

const saveLocal = debounce(() => {
  console.log('saving state locally');
  saveState({ spriteSheet: sprites, tileMap, palette, animate, exporter });
}, 200);

/**
 *
 * @param {object} options
 * @param {boolean} options.check confirm whether we should replace the current sprite sheet
 * @param {Uint8Array} [options.data]
 * @param {File} [options.file]
 * @returns {SpriteSheet}
 */
function generateNewSpriteSheet({
  check = true,
  data = null,
  file = { name: 'untitled.spr' },
} = {}) {
  if (!data && check) {
    const fourBit = $('#size-4-bit').checked;
    if (!confirm('Are you sure you want to create a blank new sprite sheet?')) {
      return;
    }
    localStorage.removeItem('spriteSheet');
    data = Uint8Array.from({ length: 256 * 16 * 4 }, () => {
      // if (check == false && i < 256) return i;
      if (fourBit) return 0;
      return transparent;
    });
  }

  let spriteData;

  if (!data) {
    const restored = restoreState();

    if (
      !check &&
      restored.lastSaved > Date.now() - ONE_WEEK &&
      restored.spriteSheet
    ) {
      spriteData = Uint8Array.from(restored.spriteSheet.data);
      sprites = newSpriteSheet(spriteData);

      sprites.filename = restored.spriteSheet.filename;
      file.name = sprites.filename;
      palette.restoreFromData(Uint8Array.from(restored.palette.data));
      palette.filename = restored.palette.filename;

      if (restored.animate) {
        animate.restore(restored.animate);
      }

      // happens _after_ palette reset
      if (restored.spriteSheet.fourBit) {
        sprites.fourBit = true;
        $('#size-4-bit').checked = true;
      }

      if (restored.tileMap) {
        const tileMapData = restored.tileMap;
        tileMap.load({
          sprites,
          bank: new Uint8Array(tileMapData.bank),
          dimensions: tileMapData,
        });
        tileMap.filename = tileMapData.filename;
        tileMap.paint();
      }

      if (restored.exporter) {
        exporter.restore(restored.exporter);
      }

      console.log(
        'State restored from ' + new Date(restored.lastSaved).toLocaleString()
      );
    } else {
      data = Uint8Array.from({ length: 256 * 16 * 4 }, (_, i) => {
        if (check == false && i < 256) return i;
        return transparent;
      });
      sprites = newSpriteSheet(data);
    }
  } else {
    sprites = newSpriteSheet(data, file);
  }

  sprites.hook((event) => {
    if (event === 'select') {
      if (sprites.fourBit) {
        let max = null;
        sprites.sprite.pixels.forEach((i) => {
          if (i > max) max = i;
        });

        fourBitPalSelected.value = (max / 16) | 0;
        palette.node.parentNode.dataset.pal = (max / 16) | 0;
      }
    }
    currentSpriteId.textContent = `sprite #${pad3(sprites.spriteIndex())}`;

    document.body.dataset.scale = sprites.defaultScale;
    container.dataset.scale = sprites.defaultScale;
  });

  sprites.hook(debounce(saveLocal, 2000));

  sprites.current = 0; // triggers complete draw
  sprites.filename = file.name;

  // FIXME not quite right…
  tileMap.sprites = sprites;
  tileMap.paint();

  sprites.paintAll();
  renderSpritePreviews();
  renderCurrentSprite();

  currentSpriteId.textContent = `sprite #${pad3(sprites.spriteIndex())}`;

  return sprites;
}

function download() {
  const filename = prompt('Filename:', sprites.filename);
  if (filename) {
    save(sprites.getData(), filename);
  }
}

const tabs = new Tabs('.tabbed');
tabs.hook((tab) => {
  sprites.paint();
  tileMap.paint();

  if (tab === 'sprite-editor') {
    palette.moveTo('sprite-editor');
  }

  if (tab === 'export') {
    exporter.update();
  }

  if (tab === 'palette') {
    palette.moveTo('palette');
    userToolPalette.innerHTML = '';
    userToolPalette.appendChild(
      document.querySelector('.pickerColour').cloneNode(true)
    );
    palette.updateEditor();
  }
});

const colour = new ColourPicker({ size: 8, node: pickerColour, palette });
const tool = new Tool({ colour });
const tileMap = new TileMap({ size: 16, sprites });

palette.hook((type, node) => {
  if (type === 'select') {
    if (node) {
      hasPriority.parentElement.hidden = false;
      hasPriority.checked = palette.getPriority();
    } else {
      hasPriority.parentElement.hidden = true;
    }
    return;
  }
  if (type !== 'change') return;

  sprites.paintAll();
  tileMap.paint();
  saveLocal();
});

hasPriority.onchange = (e) => {
  palette.setPriority(e.target.checked);
};
// const palettePicker = new ColourPicker(8, palettePickerColour.parentNode);
palette.moveTo(tabs.selected === 'sprite-editor' ? 'sprite-editor' : 'palette');
palette.render();
palette.hook(() => {
  globalTransparencyWarning.hidden =
    palette.transparent === -1 || palette.transparencyIsDefault;
  globalTransparency.textContent = palette.transparent;
});
tileMap.hook(debounce(saveLocal, 2000));

const animate = new Animate(sprites);
animate.hook(debounce(saveLocal, 200));

const exporter = new Exporter();
exporter.tiles = tileMap;

let imageWindow = null;
window.exporter = exporter;
window.tileMap = tileMap;
window.palette = palette;
window.picker = colour;
window.animate = animate;
if (!document.body.prepend) {
  document.querySelector('#tile-map-container').appendChild(tileMap.ctx.canvas);
} else {
  document.querySelector('#tile-map-container').prepend(tileMap.ctx.canvas);
}

exporter.hook(saveLocal);

/** @type {DropCallback} */
async function fileToImageWindow(data, file) {
  const res = await parseNoTransformFile(data, file);
  res.filename = file.name;
  const ctx = document.querySelector('#importer canvas.png').getContext('2d');
  imageWindow = new ImageWindow(res.data, ctx, res);
  imageWindow.oncopy = (data, offset) => {
    if (offset) {
      sprites.current = sprites.current + offset;
    }
    sprites.set(data);
    sprites.renderSubSprites();

    if (offset) {
      sprites.current = sprites.current - offset;
    }
  };
  window.imageWindow = imageWindow;
  imageWindow.paint();
}

/** @type {DropCallback} */
function fileToTile(data, file) {
  const unpack = new Unpack(data);

  const header = unpack.parse(
    `<A8$sig
    C$marker
    C$issue
    C$version
    I$length
    C$hType
    S$hFileLength
    S$autostart
    S$hOffset
    x
    x104
    C$checksum`
  );

  const dimensions = {};
  let bank = null;
  if (header.sig !== 'PLUS3DOS') {
    const dims = prompt('Tile map width?');
    const width = parseInt(dims.trim(), 10);
    dimensions.width = width; // aka autostart
    dimensions.height = data.length / width;
    bank = new Uint8Array(data);
  } else if (header.hOffset !== 0x8000) {
    // then we've got a version where I tucked the dimensions in the file
    dimensions.width = header.autostart; // aka autostart
    dimensions.height = (header.length - 128) / dimensions.width; // header is 128 bytes
    bank = new Uint8Array(data.slice(unpack.offset));
  } else {
    bank = new Uint8Array(data.slice(unpack.offset));
  }
  tileMap.filename = file.name;
  tileMap.load({ bank, dimensions });
  tileMap.sprites = sprites; // just in case
  tileMap.paint();
}

drop(document.querySelector('#importer'), fileToImageWindow);
drop(document.querySelector('#tiles'), fileToTile);

const importMask = document.querySelector('#png-container .focus');
$('#png-import-tools input[type=range]').on('input', (e) => {
  const v = parseInt(e.target.value);
  importMask.style.borderColor = `rgba(127, 127, 127, ${v / 100})`;
});

$('#png-import-tools button').on('click', (e) => {
  const action = e.target.dataset.action;
  if (action === 'zoom-in') {
    imageWindow.zoom++;
  }

  if (action === 'zoom-out') {
    imageWindow.zoom--;
  }

  if (action === 'copy') {
    imageWindow.copy($('#copy-as-8x8').checked, false, sprites.fourBit);
  }

  if (action === 'copy-over') {
    imageWindow.copy(
      $('#copy-as-8x8').checked,
      sprites.sprite.pixels,
      sprites.fourBit
    );
  }

  if (action === 'import-palette') {
    if (imageWindow) imageWindow.importPalette(sprites.fourBit);
  }
});

exampleBasicLink.addEventListener('mousedown', () => {
  exampleBasicLink.search = `?data=${btoa(tileMap.toBasic())}`;
});

buttons.on('click', async (e) => {
  const action = e.target.dataset.action;

  if (action === 'download-pal') {
    downloadPal();
  }

  if (action === 'pal-shift-l') {
    return palette.shiftLeft();
  }

  if (action === 'pal-shift-r') {
    return palette.shiftRight();
  }

  if (action === 'reset-pal-16') {
    const data = await fetch('/assets/l01.pal').then((res) =>
      res.arrayBuffer()
    );
    palette.restoreFromData(new Uint8Array(data));
    palette.filename = 'l01.pal';
  }

  if (action === 'reset-pal') {
    palette.reset();
  }

  if (action === 'clear-map') {
    if (confirm('This will replace your current map, continue?')) {
      localStorage.removeItem('tileMap');
      tileMap.clear();
      tileMap.scale = 3; // FIX hack for local storage out of sync
      saveLocal();
    }
  }

  if (action === 'debug-sprites') {
    if (confirm('This will replace your current spritesheet, continue?')) {
      const res = await fetch('/assets/numbers.spr');
      const file = await res.arrayBuffer();
      fileHandler(new Uint8Array(file));
    }
  }

  if (action === 'toggle-scale') {
    sprites.toggleScale();
    saveLocal();
  }

  if (action === 'toggle-animate') {
    animateContainer.hidden = !animateContainer.hidden;
    document.body.dataset.animate = !animateContainer.hidden;
  }

  if (action === 'download-map') {
    downloadTiles();
  }

  if (action === 'new') {
    generateNewSpriteSheet({ check: true });
  }

  if (action === 'select-sub-sprite') {
    sprites.setSubSprite(parseInt(e.target.dataset.index, 10));
  }

  if (action === 'undo') {
    sprites.undo();
  }

  if (action === 'pal-sort') {
    e.preventDefault();
    let sorter = document
      .querySelector('#pal-sort')
      .value.trim()
      .toLowerCase()
      .split(',')
      .map((_) => _.trim());

    // peek last
    let offset = 0;
    let limit = 256;
    if (!isNaN(parseInt(sorter[sorter.length - 1], 10))) {
      offset = parseInt(sorter.pop(), 10);
    }
    if (!isNaN(parseInt(sorter[sorter.length - 1], 10))) {
      limit = offset;
      offset = parseInt(sorter.pop(), 10);
    }

    sorter = sorter.filter(Boolean);
    if (sorter.length) {
      palette.sort(sorter.join(','), offset, limit);
    }
  }

  let currentSprite = sprites.current;
  const totalSprites = sprites.length;

  if (action.startsWith('ro')) {
    const left = action === 'rol';
    const right = action === 'ror';

    if (sprites.defaultScale === 16) {
      if (
        (right && currentSprite == totalSprites - 1) ||
        (left && currentSprite === 0)
      ) {
        return;
      }

      sprites.snapshot();
      const offset = 256 * currentSprite;
      const copy = sprites.data.slice(offset, offset + 256);
      const next = (currentSprite + (left ? -1 : 1)) * 256;
      sprites.data.set(sprites.data.slice(next, next + 256), offset);
      sprites.data.set(copy, next);
      sprites.current += left ? -1 : 1;
      sprites.rebuild(sprites.current - 1);
      sprites.rebuild(sprites.current + 1);
      sprites.rebuild(sprites.current);
      sprites.paint();
    } else {
      sprites.snapshot();
      const base = 256 * currentSprite;
      const index = sprites.sprite.subSprite;
      const offset = base + 64 * index;
      const copy = sprites.data.slice(offset, offset + 64);
      let targetIndex = (sprites.sprite.subSprite + (left ? -1 : 1)) % 4;

      if (targetIndex < 0) {
        targetIndex = 3;
      }

      const next = base + 64 * targetIndex;

      sprites.data.set(sprites.data.slice(next, next + 64), offset);
      sprites.data.set(copy, next);
      sprites.rebuild(currentSprite);
      sprites.renderSubSprites();
      sprites.sprite.subSprite = targetIndex;
      sprites.paint();
      sprites.trigger();
    }
  }

  if (action === 'copy') {
    sprites.copy();
  }

  if (action === 'paste') {
    sprites.paste(event.shiftKey);
  }

  if (action === 'clear') {
    sprites.clear();
  }

  if (action === 'download') {
    if (event.shiftKey) {
      exporter.update(true);
      navigator.clipboard.writeText(exporter.output.value).then(() => {
        const btn = $('button[data-action="download"]');
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1100);
      });
    } else {
      download();
    }
  }

  if (action.startsWith('export-')) {
    if (action === 'export-palette-range-all') {
      exporter.pRange.min = 0;
      exporter.pRange.max = 255;
    }

    if (action === 'export-sprite-range-all') {
      exporter.sRange.min = 0;
      exporter.sRange.max = 63;
    }

    exporter.update(true);
    const asm = exporter.settings.dist === 'asm';

    if (action === 'export-copy') {
      navigator.clipboard.writeText(exporter.output.value);
    }

    if (action === 'export-download-source') {
      const filename = prompt('Filename?', 'untitled.' + (asm ? 's' : 'bas'));
      if (filename) {
        const file = new TextEncoder().encode(exporter.output.value);
        save(file, filename);
      }
    }

    if (action === 'export-as-bmp') {
      const filename = prompt('8bit BMP Filename?', 'untitled.bmp');
      if (filename) {
        const size = prompt('How many sprites wide?', '8');
        if (size) save(exporter.bmp(parseInt(size, 10)), filename);
      }
    }

    if (action === 'export-as-png') {
      const filename = prompt('PNG Filename?', 'untitled.png');
      if (filename) {
        const size = prompt('How many sprites wide?', '8');
        if (size) save(await exporter.png(parseInt(size, 10)), filename);
      }
    }

    if (action === 'export-pal-as-gpl') {
      const filename = prompt('Filename?', 'untitled.gpl');
      if (filename) {
        const file = new TextEncoder().encode(palette.exportGPL());
        save(file, filename);
      }
    }

    if (action === 'export-as-piskel') {
      const filename = prompt('Filename?', 'untitled.piskel');
      if (filename) {
        const file = new TextEncoder().encode(exporter.piskel());
        save(file, filename);
      }
    }
  }
});

const drawHandler = (e) => {
  if (e.type.startsWith('touch')) {
    e.preventDefault();
  }
  if (e.altKey || e.ctrlKey) {
    colour.value = sprites.pget(sprites.getCoords(e));
  } else {
    tool.apply(e, sprites);
  }
};

trackDown(container, {
  handler: drawHandler,
  start(event) {
    tool.start(event, sprites);
  },
  end() {
    tool.end();
  },
});

// main key handlers
document.documentElement.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    tool.shift(false);
  }
});

document.documentElement.addEventListener('keydown', (e) => {
  if (e.target.nodeName === 'INPUT') {
    return;
  }

  if (e.key === '?') {
    return tabs.show('usage');
  }

  if (e.key === 'Shift') {
    tool.shift(true);
  }

  if (e.key === 's' && e.metaKey) {
    e.preventDefault();
    saveLocal();
  }

  // shift + 1-4
  if (e.shiftKey && e.which >= 49 && e.which <= 52) {
    sprites.setSubSprite(e.which - 49);
    return;
  }

  let focusTool = null;
  if (tabs.selected === 'sprite-editor') {
    focusTool = tool;
  } else if (tabs.selected === 'importer') {
    focusTool = imageWindow;
  }

  if (tabs.selected === 'palette') {
    if (e.key === '.') {
      palette.setInc();
      return;
    }
    if (e.key === 'ArrowLeft') {
      palette.prev();
      return;
    }
    if (e.key === 'ArrowRight') {
      palette.next();
      return;
    }
  }

  if (focusTool) {
    if (e.shiftKey && e.key === 'ArrowLeft') {
      focusTool.shiftX(true, e.ctrlKey ? 1 : 8, sprites);
      e.preventDefault();
    }
    if (e.shiftKey && e.key === 'ArrowRight') {
      focusTool.shiftX(false, e.ctrlKey ? 1 : 8, sprites);
      e.preventDefault();
    }
    if (e.shiftKey && e.key === 'ArrowUp') {
      focusTool.shiftY(true, e.ctrlKey ? 1 : 8, sprites);
      e.preventDefault();
    }
    if (e.shiftKey && e.key === 'ArrowDown') {
      focusTool.shiftY(false, e.ctrlKey ? 1 : 8, sprites);
      e.preventDefault();
    }
  }

  if (e.key >= '1' && e.key <= '8') {
    colour.index = parseInt(e.key, 10) - 1;
    return;
  }

  if (e.key === 'r' && !e.metaKey) {
    if (sprites.defaultScale === 8) {
      return alert(`Rotate isn't supported yet for 8x8 sprites`);
    }
    sprites.rotate();
    return;
  }

  if (e.key === 'h' && !e.metaKey) {
    if (sprites.defaultScale === 8) {
      return alert(`Mirror isn't supported yet for 8x8 sprites`);
    }
    sprites.mirror(true);
    return;
  }

  if (e.key === 'v' && !e.metaKey) {
    if (sprites.defaultScale === 8) {
      return alert(`Flip isn't supported yet for 8x8 sprites`);
    }

    sprites.mirror(false);
    return;
  }

  if (e.shiftKey === false && e.key === 'z' && (e.metaKey || e.ctrlKey)) {
    // check if tile or sprite is in focus
    if (tabs.selected === 'sprite-editor') {
      sprites.undo();
      tool.resetState();
    } else if (tabs.selected === 'tiles') {
      tileMap.undo();
    }
    return;
  }

  if (e.key === 'D') {
    if (event.shiftKey) {
      exporter.update(true);
      navigator.clipboard.writeText(exporter.output.value).then(() => {
        const btn = $('button[data-action="download"]');
        btn.classList.add('copied');
        setTimeout(() => btn.classList.remove('copied'), 1100);
      });
      return;
    }
    download();
    return;
  }

  if (!e.shiftKey) {
    let current = sprites.current;
    if (e.key === 'ArrowLeft') {
      current--;
    }
    if (e.key === 'ArrowRight') {
      current++;
    }

    if (current === sprites.length) {
      current = 0;
    } else if (current < 0) {
      current = sprites.length - 1;
    }

    if (current !== sprites.current) {
      sprites.current = current;
    }
  }
});

function buildStyleSheet() {
  let css = '';
  for (let i = 0; i < 256; i++) {
    const { r, g, b, a } = rgbFromIndex(i);
    css += `.c-${i} { background: rgba(${[r, g, b, a].join(', ')}); }`;
  }
  const s = document.createElement('style');
  s.innerText = css;
  document.head.append(s);

  css = '';
  for (let i = 0; i < 512; i++) {
    const { r, g, b, a } = rgbFromNext(i);
    css += `.c2-${i} { background: rgba(${[r, g, b, a].join(', ')}); }`;
  }
  const s2 = document.createElement('style');
  s2.innerText = css;
  document.head.append(s2);
}

function renderCurrentSprite() {
  try {
    spritesContainer.querySelector('.focus').classList.remove('focus');
  } catch (e) {
    // noop
  }

  const focused = document.querySelector(
    `#sprites > :nth-child(${sprites.current + 1})`
  );
  if (focused) focused.classList.add('focus');

  sprites.paint();
}

function renderSpritePreviews() {
  spritesContainer.innerHTML = '';
  sprites.getPreviewElements().map((_) => {
    spritesContainer.appendChild(_);
  });
}

/** @type {DropCallback} */
function fileHandler(data, file) {
  data = decode(data);
  sprites = generateNewSpriteSheet({ file, data });
}

const move = (e) => {
  let { x, y } = sprites.getCoords(e);
  const index = sprites.pget({ x, y });

  debug.innerHTML = `X:${x} Y:${y} ${palette.info(index)}`;
};

trackDown(container, {
  move,
  handler: move,
  out() {
    debug.innerHTML = '&nbsp;';
  },
});

spritesContainer.addEventListener('click', (e) => {
  const node = e.target;
  if (node.nodeName === 'CANVAS') {
    sprites.current = Array.from(node.parentNode.childNodes).indexOf(node);
  }
});

spritesContainer.addEventListener('mousemove', (e) => {
  const node = e.target;
  if (node.nodeName === 'CANVAS') {
    const m = sprites.defaultScale === 8 ? 4 : 1;
    currentSpriteId.textContent = `sprite #${pad3(
      m * Array.from(node.parentNode.childNodes).indexOf(node)
    )}`;
  }
});

spritesContainer.addEventListener('mouseout', () => {
  currentSpriteId.textContent = `sprite #${pad3(sprites.spriteIndex())}`;
});

drop(document.documentElement, fileHandler);

// handler for multiple files
document.documentElement.ondrop = async (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;

  if (files.length > 1) {
    let id = sprites.current + 1;
    await Promise.all(
      Array.from(files).map((file) => {
        const reader = new FileReader();
        return new Promise((resolve) => {
          reader.onload = (event) => {
            const res = decode(new Uint8Array(event.target.result));
            sprites.current = id;
            sprites.set(res);
            id++;
            resolve();
          }; // data url!
          reader.readAsArrayBuffer(file);
        });
      })
    );
    renderSpritePreviews();
    renderCurrentSprite();
  }
};

document.querySelector('#upload-pal').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    const data = new Uint8Array(event.target.result);
    palette.import(file, data);
  };
  reader.readAsArrayBuffer(file);
});

upload.addEventListener('change', (e) => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    fileHandler(new Uint8Array(event.target.result));
  };
  reader.readAsArrayBuffer(droppedFile);
});

mapUpload.addEventListener('change', (e) => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) => {
    fileToTile(new Uint8Array(event.target.result), droppedFile);
  };
  reader.readAsArrayBuffer(droppedFile);
});

$('input[name="transparency"]').on('change', (e) => {
  document.documentElement.dataset.transparency = e.target.value;
});

bitSize.on('change', () => {
  sprites.fourBit = $('#size-4-bit').checked;
  document.documentElement.dataset.bit = sprites.fourBit ? 4 : 8;
  saveLocal();
});

$('#tile-bg').on('change', (e) => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(new Blob([file]));
  const canvas = $('#tile-map-container canvas');
  canvas.style.setProperty('--bg-image', `url("${url}")`);
  canvas.style.backgroundSize = '100%';
});

fourBitPalPicker.addEventListener('click', (e) => {
  const base = parseInt(e.target.textContent, 16);
  fourBitPalSelected.value = base;
  palette.node.parentNode.dataset.pal = base;
  const pixels = sprites.sprite.pixels;
  pixels.forEach((value, i) => {
    const root = value & 15; // effectively mod 16
    pixels[i] = root + 16 * base;
  });
  sprites.paintAll();
});
fourBitPalSelected.addEventListener('change', () => {
  // change all the sprite preview values to X
  const base = parseInt(fourBitPalSelected.value, 10);
  palette.node.parentNode.dataset.pal = base;
  const pixels = sprites.sprite.pixels;
  pixels.forEach((value, i) => {
    const root = value & 15; // effectively mod 16
    pixels[i] = root + 16 * base;
  });
  sprites.paintAll();
});

function downloadPal() {
  const filename = prompt('Filename:', palette.filename);
  if (filename) {
    save(palette.export(), filename);
  }
}

function downloadTiles() {
  const filename = prompt('Filename:', tileMap.filename);
  if (filename) {
    const includeHeader = $('#include-tile-header').checked;
    let length = tileMap.bank.length;
    let offset = 0;

    if (includeHeader) {
      length += 128;
      offset = 128;
    }

    const data = new Uint8Array(length);
    // this is naughty, but I'm putting the height and width in the +3dos header
    if (includeHeader) {
      data.set(
        plus3DOSHeader(data, {
          hType: 3,
          autostart: tileMap.width,
        })
      );
    }
    data.set(tileMap.bank, offset);
    save(data, filename);
  }
}

document.documentElement.addEventListener('drop', () => saveLocal(), true);

// support native paste of pngs
document.onpaste = async (event) => {
  const items = (event.clipboardData || event.originalEvent.clipboardData)
    .items;
  const files = [];
  for (let index in items) {
    const item = items[index];
    if (item.kind === 'file' && item.type === 'image/png') {
      files.push(item);
    }
  } // will only ever be 1 file :(

  let id = sprites.current;

  await Promise.all(
    files.map((item) => {
      const blob = item.getAsFile();
      const reader = new FileReader();
      return new Promise((resolve) => {
        reader.onload = (event) => {
          const res = decode(new Uint8Array(event.target.result));
          sprites.current = id;
          sprites.set(res);
          id++;
          resolve();
        }; // data url!
        reader.readAsArrayBuffer(blob);
      });
    })
  );

  renderSpritePreviews();
  renderCurrentSprite();
};

generateNewSpriteSheet({ check: false });

buildStyleSheet();

// fetch('/testing/jetpac.png')
//   .then((res) => res.blob())
//   .then((res) => {
//     const file = new Blob([res], { type: 'image/png' });
//     fileToImageWindow(res, file);
//   });
