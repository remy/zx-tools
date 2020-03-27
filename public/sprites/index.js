import drop from '../lib/dnd.js';
import { rgbFromIndex, transparent } from './lib/colour.js';
import save from '../lib/save.js';
import { decode } from './lib/parser.js';
import { $ } from '../lib/$.js';
import SpriteSheet from './SpriteSheet.js';
import ColourPicker from './ColourPicker.js';
import Tool from './Tool.js';

const container = document.querySelector('#container');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const pickerColour = document.querySelector('.pickerColour div');

const buttons = $('#tools button[data-action]');

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

  renderSpritePreviews();
  renderCurrentSprite();
}

const newSprite = () => {
  totalSprites++;
  currentSprite = totalSprites - 1;
  sprites = Uint8Array.from(
    Array.from(sprites).concat(
      Array.from({ length: 256 }).fill(colour.transparent)
    )
  );
  renderSpritePreviews();
  renderCurrentSprite();
};

const dupeSprite = () => {
  const offset = currentSprite;
  console.log('dupe ' + offset);
  const copy = Array.from(sprites.slice(offset * 256, offset * 256 + 256));
  totalSprites++;
  currentSprite = totalSprites - 1;
  sprites = Uint8Array.from(Array.from(sprites).concat(copy));
  renderSpritePreviews();
  renderCurrentSprite();
};

function download() {
  const filename = prompt('Filename:', 'untitled.spr');
  if (filename) {
    save(sprites.data, filename);
  }
}

const colour = new ColourPicker(8, pickerColour.parentNode);
const tool = new Tool({ colour });

buttons.on('click', e => {
  const action = e.target.dataset.action;

  if (action === 'new') {
    newSpriteSheet(true);
  }

  if (action === 'undo') {
    sprites.undo();
  }

  if (action === 'dupe') {
    dupeSprite();
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

  if (action === 'del') {
    const copy = Array.from(sprites);
    copy.splice(offset, 256);
    sprites = Uint8Array.from(copy);
    totalSprites--;
    if (currentSprite !== 0) {
      currentSprite--;
    }
    renderSpritePreviews();
    renderCurrentSprite();
  }

  if (action === 'clear') {
    sprites.clear();
  }

  if (action === 'download') {
    download();
  }
});

picker.addEventListener('mousedown', e => {
  colour.value = e.target.dataset.value;
});

let down = false;
container.addEventListener(
  'mousedown',
  event => {
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
  e => {
    if (down) {
      container.onclick(e);
    }
  },
  true
);

container.onclick = e => {
  if (e.altKey || e.ctrlKey) {
    colour.value = sprites.pget(SpriteSheet.getCoords(e));
  } else {
    tool.apply(e, sprites);
  }
};

// main key handlers
document.body.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    tool.shift(false);
  }
});

document.body.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    tool.shift(true);
  }

  if (e.key >= '1' && e.key <= '8') {
    colour.index = parseInt(e.key, 10) - 1;
    return;
  }

  if (e.shiftKey === false && e.key === 'z' && (e.metaKey || e.ctrlKey)) {
    sprites.undo();
    return;
  }

  if (e.key === 'D') {
    download();
    return;
  }

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
  sprites.getPreviewElements().map(_ => spritesContainer.appendChild(_));
}

function fileHandler(file) {
  file = decode(file);
  sprites = new SpriteSheet(file, ctx);

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
  return d;
}

container.onmousemove = e => {
  let { x, y } = SpriteSheet.getCoords(e);
  const value = sprites.pget({ x, y });

  debug.innerHTML = `X:${x} Y:${y} -- ${value} 0x${value
    .toString(16)
    .padStart(2, '0')}`;
};

container.onmouseout = () => {
  debug.innerHTML = '&nbsp;';
};

spritesContainer.addEventListener('click', e => {
  const node = e.target;
  if (node.nodeName === 'CANVAS') {
    sprites.current = Array.from(node.parentNode.childNodes).indexOf(node);
  }
});

drop(document.documentElement, fileHandler);
upload.addEventListener('change', e => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();
  reader.onload = event => {
    fileHandler(new Uint8Array(event.target.result));
  };
  reader.readAsArrayBuffer(droppedFile);
});

newSpriteSheet(false);

// render the colour picker
render(
  Uint8Array.from({ length: 256 }, (_, i) => i),
  picker
);
buildStyleSheet();
