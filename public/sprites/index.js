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
import Palette, { makePixel } from './Palette.js';

const container = document.querySelector('#container');
const exampleBasicLink = document.querySelector('#basic-example-link');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites .container');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const mapUpload = document.querySelector('#upload-map input');
const currentSpriteId = document.querySelector('#current-sprite');
const pickerColour = document.querySelector('.pickerColour');
const palettePickerColour = document.querySelector('#palette .picker');
const userToolPalette = document.querySelector('#palette .colour-picker');
const buttons = $('[data-action]');
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const subSprites = $('#preview-8x8 canvas').map((canvas) => {
  canvas.width = canvas.height = 8 * 6;
  return canvas.getContext('2d');
});

let sprites = null;

function pad3(n) {
  return n.toString().padStart(3, '0');
}

function newSpriteSheet(file) {
  let tmp;
  if (sprites) tmp = sprites.defaultScale;
  sprites = new SpriteSheet(file, { ctx, subSprites });
  if (tmp) sprites.setScale(tmp);
  tileMap.sprites = sprites; // just in case
  return sprites;
}

function saveLocal() {
  console.log('saving state locally');

  saveState({ spriteSheet: sprites, tileMap });
}

function generateNewSpriteSheet({ check = true, file = null } = {}) {
  if (!file && check) {
    if (!confirm('Are you sure you want to create a blank new sprite sheet?')) {
      return;
    }
    localStorage.removeItem('spriteSheet');
  }

  let spriteData;

  const restored = restoreState();

  if (!check && restored.lastSaved > Date.now() - ONE_WEEK) {
    spriteData = Uint8Array.from(restored.spriteSheet.data);
    sprites = newSpriteSheet(spriteData);

    if (restored.tileMap) {
      const tileMapData = restored.tileMap;
      tileMap.load({
        sprites,
        bank: new Uint8Array(tileMapData.bank),
        dimensions: tileMapData,
      });
      tileMap.paint();
    }
    console.log(
      'State restored from ' + new Date(restored.lastSaved).toLocaleString()
    );
  } else {
    sprites = newSpriteSheet(
      file ||
        Uint8Array.from({ length: 256 * 16 * 4 }, (_, i) => {
          if (check == false && i < 256) return i;
          return transparent;
        })
    );
  }

  sprites.hook(() => {
    currentSpriteId.textContent = `sprite #${pad3(sprites.spriteIndex())}`;

    document.body.dataset.scale = sprites.defaultScale;
    container.dataset.scale = sprites.defaultScale;
  });

  sprites.hook(debounce(saveLocal, 2000));

  sprites.current = 0; // triggers complete draw

  // FIXME not quite right…
  tileMap.sprites = sprites;
  tileMap.paint();

  renderSpritePreviews();
  renderCurrentSprite();

  currentSpriteId.textContent = `sprite #${pad3(sprites.spriteIndex())}`;

  return sprites;
}

function download() {
  const filename = prompt('Filename:', 'untitled.spr');
  if (filename) {
    save(sprites.data, filename);
  }
}

const tabs = new Tabs('.tabbed');
tabs.hook((tab) => {
  sprites.paint();
  tileMap.paint();

  if (tab === 'sprite-editor') {
    palette.moveTo('sprite-editor');
  }

  if (tab === 'palette') {
    palette.moveTo('palette');
    userToolPalette.innerHTML = '';
    userToolPalette.appendChild(
      document.querySelector('.pickerColour').cloneNode(true)
    );
  }
});
const palette = new Palette({ node: palettePickerColour });
const colour = new ColourPicker({ size: 8, node: pickerColour, palette });
const tool = new Tool({ colour });
const tileMap = new TileMap({ size: 16, sprites });

// const palettePicker = new ColourPicker(8, palettePickerColour.parentNode);
palette.moveTo(tabs.selected);
palette.render();
tileMap.hook(debounce(saveLocal, 2000));

let imageWindow = null;
window.tileMap = tileMap;
window.palette = palette;
window.picker = colour;
if (!document.body.prepend) {
  document.querySelector('#tile-map-container').appendChild(tileMap.ctx.canvas);
} else {
  document.querySelector('#tile-map-container').prepend(tileMap.ctx.canvas);
}

async function fileToImageWindow(data, file) {
  const res = await parseNoTransformFile(data, file);
  const ctx = document.querySelector('#importer canvas.png').getContext('2d');
  imageWindow = new ImageWindow(res.data, ctx, res.width, res.height);
  imageWindow.oncopy = (data) => {
    sprites.set(data);
    sprites.renderSubSprites();
  };
  window.imageWindow = imageWindow;
  imageWindow.paint();
}

function fileToTile(file) {
  const unpack = new Unpack(file);

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
    dimensions.height = file.length / width;
    bank = new Uint8Array(file);
  } else if (header.hOffset !== 0x8000) {
    // then we've got a version where I tucked the dimensions in the file
    dimensions.width = header.autostart; // aka autostart
    dimensions.height = (header.length - 128) / dimensions.width; // header is 128 bytes
    bank = new Uint8Array(file.slice(unpack.offset));
  } else {
    bank = new Uint8Array(file.slice(unpack.offset));
  }
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
    imageWindow.copy($('#copy-as-8x8').checked);
  }
});

exampleBasicLink.addEventListener('mousedown', () => {
  exampleBasicLink.search = `?data=${btoa(tileMap.toBasic())}`;
});

buttons.on('click', async (e) => {
  const action = e.target.dataset.action;

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
    sprites.paste();
  }

  if (action === 'clear') {
    sprites.clear();
  }

  if (action === 'download') {
    download();
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
  start() {
    tool.start(event);
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
      focusTool.shiftX(true, e.ctrlKey ? 8 : 1, sprites);
    }
    if (e.shiftKey && e.key === 'ArrowRight') {
      focusTool.shiftX(false, e.ctrlKey ? 8 : 1, sprites);
    }
    if (e.shiftKey && e.key === 'ArrowUp') {
      focusTool.shiftY(true, e.ctrlKey ? 8 : 1, sprites);
    }
    if (e.shiftKey && e.key === 'ArrowDown') {
      focusTool.shiftY(false, e.ctrlKey ? 8 : 1, sprites);
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
  sprites.getPreviewElements().map((_, i) => {
    _.title = 'Index: ' + i;
    spritesContainer.appendChild(_);
  });
}

function fileHandler(file) {
  file = decode(file);
  sprites = generateNewSpriteSheet({ file });
  // tileMap.sprites = sprites;
  // tileMap.paint();

  // renderSpritePreviews();
  // renderCurrentSprite();
}

function render(data, into) {
  into.innerHTML = '';
  for (let i = 0; i < data.length; i++) {
    let value = data[i];
    into.appendChild(makePixel(value, i));
  }
}

container.onmousemove = (e) => {
  let { x, y } = sprites.getCoords(e);
  const value = sprites.pget({ x, y });

  debug.innerHTML = `X:${x} Y:${y} -- ${value} 0x${value
    .toString(16)
    .padStart(2, '0')}`;
};

container.onmouseout = () => {
  debug.innerHTML = '&nbsp;';
};

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
    fileToTile(new Uint8Array(event.target.result));
  };
  reader.readAsArrayBuffer(droppedFile);
});

$('input[name="transparency"]').on('change', (e) => {
  document.documentElement.dataset.transparency = e.target.value;
});

function downloadTiles() {
  const filename = prompt('Filename:', 'untitled.map');
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

// render the colour picker
// render(
//   Uint8Array.from({ length: 256 }, (_, i) => i),
// picker
// );

buildStyleSheet();
