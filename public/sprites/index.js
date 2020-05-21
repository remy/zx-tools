import drop from '../lib/dnd.js';
import { rgbFromIndex, transparent } from './lib/colour.js';
import save from '../lib/save.js';
import { decode, pngNoTransformFile } from './lib/parser.js';
import ImageWindow from './ImageWindow.js';
import { $ } from '../lib/$.js';
import SpriteSheet from './SpriteSheet.js';
import ColourPicker from './ColourPicker.js';
import Tool from './Tool.js';
import TileMap from './TileMap.js';
import { plus3DOSHeader } from 'txt2bas';
import Tabs from '../lib/Tabs.js';
import { Unpack } from '../lib/unpack/unpack.js';
import { saveState, restoreState } from './state.js';
import debounce from 'lodash.debounce';

const container = document.querySelector('#container');
const exampleBasicLink = document.querySelector('#basic-example-link');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites .container');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const mapUpload = document.querySelector('#upload-map input');
const currentSpriteId = document.querySelector('#current-sprite');
const pickerColour = document.querySelector('.pickerColour div');
const buttons = $('[data-action]');
const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const subSprites = $('#preview-8x8 canvas').map((canvas) => {
  canvas.width = canvas.height = 8 * 6;
  return canvas.getContext('2d');
});

let sprites = null;

function newSpriteSheet(file) {
  sprites = new SpriteSheet(file, { ctx, subSprites });
  tileMap.sprites = sprites; // just in case
  return sprites;
}

function saveLocal() {
  console.log('saving state locally');

  saveState({ spriteSheet: sprites, tileMap });
}

function generateNewSpriteSheet(check = true) {
  if (check) {
    if (!confirm('Are you sure you want to create a blank new sprite sheet?')) {
      return;
    }
    localStorage.clear();
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
      Uint8Array.from({ length: 256 * 16 * 4 }, (_, i) => {
        if (check == false && i < 256) return i;
        return transparent;
      })
    );
  }

  sprites.hook(() => {
    currentSpriteId.textContent = `sprite #${sprites.spriteIndex()}`;
    document.body.dataset.scale = sprites.defaultScale;
    document.body.dataset.subSprite = sprites.sprite.subSprite;
    container.dataset.scale = sprites.defaultScale;
  });

  sprites.hook(debounce(saveLocal, 2000));

  sprites.current = 0; // triggers complete draw

  // FIXME not quite right…
  tileMap.sprites = sprites;
  tileMap.paint();

  renderSpritePreviews();
  renderCurrentSprite();
}

function download() {
  const filename = prompt('Filename:', 'untitled.spr');
  if (filename) {
    save(sprites.data, filename);
  }
}

const tabs = new Tabs('.tabbed');
tabs.hook(() => {
  sprites.paint();
  tileMap.paint();
});
const colour = new ColourPicker(8, pickerColour.parentNode);
const tool = new Tool({ colour });
const tileMap = new TileMap({ size: 16, sprites });
tileMap.hook(debounce(saveLocal, 2000));

let imageWindow = null;
window.tileMap = tileMap;
if (!document.body.prepend) {
  document.querySelector('#tile-map-container').appendChild(tileMap.ctx.canvas);
} else {
  document.querySelector('#tile-map-container').prepend(tileMap.ctx.canvas);
}

function fileToImageWindow(file) {
  const res = pngNoTransformFile(file);
  const ctx = document
    .querySelector('#png-importer canvas.png')
    .getContext('2d');
  imageWindow = new ImageWindow(res.data, ctx, res.png.width, res.png.height);
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
  if (header.hOffset !== 0x8000) {
    // then we've got a version where I tucked the dimensions in the file
    dimensions.width = header.autostart; // aka autostart
    dimensions.height = (header.length - 128) / dimensions.width; // header is 128 bytes
  }
  tileMap.load({ bank: new Uint8Array(file.slice(unpack.offset)), dimensions });
  tileMap.sprites = sprites; // just in case
  tileMap.paint();
}

drop(document.querySelector('#png-importer'), fileToImageWindow);
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
      tileMap.clear();
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
    document.body.dataset.scale = sprites.defaultScale;
    saveLocal();
  }

  if (action === 'download-map') {
    downloadTiles();
  }

  if (action === 'new') {
    generateNewSpriteSheet(true);
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

      const next = targetIndex * 64;

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

picker.addEventListener('mousedown', (e) => {
  colour.value = e.target.dataset.value;
});

let down = false;
container.addEventListener(
  'mousedown',
  (event) => {
    down = true;
    tool.start(event);
  },
  true
);

container.addEventListener(
  'mouseup',
  () => {
    down = false;
    tool.end();
  },
  true
);

container.addEventListener(
  'mousemove',
  (e) => {
    if (down) {
      container.onclick(e);
    }
  },
  true
);

container.onclick = (e) => {
  if (e.altKey || e.ctrlKey) {
    colour.value = sprites.pget(sprites.getCoords(e));
  } else {
    tool.apply(e, sprites);
  }
};

// main key handlers
document.documentElement.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') {
    tool.shift(false);
  }
});

document.documentElement.addEventListener('keydown', (e) => {
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
  } else if (tabs.selected === 'png-importer') {
    focusTool = imageWindow;
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
  sprites = newSpriteSheet(file);
  tileMap.sprites = sprites;
  tileMap.paint();

  renderSpritePreviews();
  renderCurrentSprite();
}

function render(data, into) {
  into.innerHTML = '';
  for (let i = 0; i < data.length; i++) {
    let index = data[i];
    into.appendChild(makePixel(index, i));
  }
}

function makePixel(index, dataIndex) {
  const d = document.createElement('div');
  d.className = 'c-' + index;
  d.dataset.value = index;
  d.dataset.index = dataIndex;
  d.title = `${index} -- 0x${index.toString(16).padStart(2, '0')}`;
  return d;
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
    currentSpriteId.textContent = `sprite #${
      m * Array.from(node.parentNode.childNodes).indexOf(node)
    }`;
  }
});

spritesContainer.addEventListener('mouseout', () => {
  currentSpriteId.textContent = `sprite #${sprites.spriteIndex()}`;
});

drop(document.documentElement, fileHandler);

document.documentElement.ondrop = async (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;

  if (files.length === 1) {
    const droppedFile = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      fileHandler(new Uint8Array(event.target.result));
    };
    reader.readAsArrayBuffer(droppedFile);
  } else {
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

generateNewSpriteSheet(false);

// render the colour picker
render(
  Uint8Array.from({ length: 256 }, (_, i) => i),
  picker
);
buildStyleSheet();
