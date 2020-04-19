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
const container = document.querySelector('#container');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites .container');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const pickerColour = document.querySelector('.pickerColour div');
const buttons = $('button[data-action]');
const tileDownloads = $('#tiles button');

let sprites = null;

function newSpriteSheet(check = true) {
  if (check) {
    if (!confirm('Are you sure you want to create a blank new sprite sheet?')) {
      return;
    }
  }

  sprites = new SpriteSheet(
    Uint8Array.from({ length: 256 * 16 * 4 }, (_, i) => {
      if (check == false && i < 256) return i;
      return transparent;
    }),
    ctx
  );

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
const colour = new ColourPicker(8, pickerColour.parentNode);
const tool = new Tool({ colour });
const tileMap = new TileMap({ size: 16, sprites });
let imageWindow = null;
window.tileMap = tileMap;
document.querySelector('#tile-map-container').appendChild(tileMap.ctx.canvas);

function fileToImageWindow(file) {
  const res = pngNoTransformFile(file);
  const ctx = document
    .querySelector('#png-importer canvas.png')
    .getContext('2d');
  imageWindow = new ImageWindow(res.data, ctx, res.png.width, res.png.height);
  imageWindow.oncopy = (data) => sprites.set(data);
  window.imageWindow = imageWindow;
  imageWindow.paint();
}

function fileToTile(file) {
  const unpack = new Unpack(file);

  unpack.parse(
    `<A8$sig
    C$marker
    C$issue
    C$version
    I$length
    C$hType
    S$hFileLength
    n$hLine
    S$hOffset
    x
    x104
    C$checksum`
  );

  tileMap.bank = new Uint8Array(file.slice(unpack.offset));
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
    imageWindow.copy();
  }
});

buttons.on('click', (e) => {
  const action = e.target.dataset.action;

  if (action === 'new') {
    newSpriteSheet(true);
  }

  if (action === 'undo') {
    sprites.undo();
  }

  let currentSprite = sprites.current;
  const totalSprites = sprites.length;

  if (action.startsWith('ro')) {
    const left = action === 'rol';
    const right = action === 'ror';
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

  if (e.shiftKey === false && e.key === 'z' && (e.metaKey || e.ctrlKey)) {
    sprites.undo();
    tool.resetState();
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
  sprites = new SpriteSheet(file, ctx);
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

drop(document.documentElement, fileHandler);

document.documentElement.ondrop = async (e) => {
  e.preventDefault();
  const files = e.dataTransfer.files;

  console.log('file length', files.length);

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

$('input[name="transparency"]').on('change', (e) => {
  document.documentElement.dataset.transparency = e.target.value;
});

tileDownloads.on('click', (e) => {
  console.log(e.target.dataset.type);
  const filename = prompt('Filename:', 'untitled.map');
  if (filename) {
    const data = new Uint8Array(tileMap.bank.length + 128);
    data.set(plus3DOSHeader(data, { hType: 3, hOffset: 0x8000 }));
    data.set(tileMap.bank, 128);
    save(data, filename);
  }
});

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

newSpriteSheet(false);

// render the colour picker
render(
  Uint8Array.from({ length: 256 }, (_, i) => i),
  picker
);
buildStyleSheet();
