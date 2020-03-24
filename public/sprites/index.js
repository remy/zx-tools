import drop from '../lib/dnd.js';
import { rgbFromIndex } from './lib/colour.js';
import save from '../lib/save.js';
import { decode } from './lib/parser.js';
import { $ } from '../lib/$.js';

const container = document.querySelector('#container');
const spritesContainer = document.querySelector('#sprites');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const pickerColour = document.querySelector('.pickerColour div');

const buttons = $('#tools button[data-action]');

let sprites = Uint8Array.from({ length: 256 }, (_, i) => i);
let currentSprite = 0;
let totalSprites = 1;

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
    save(sprites, filename);
  }
}

class Tool {
  types = ['brush', 'fill', 'erase', 'pan'];
  _selected = 'brush';

  constructor({ type = 'brush', colour }) {
    this.colour = colour;

    $('#tool-types button').on('click', e => {
      this.selected = e.target.dataset.action;
    });

    const shortcuts = this.types.map(_ => _[0]);

    document.body.addEventListener('keydown', e => {
      const k = e.key;
      const i = shortcuts.indexOf(k);
      if (i > -1) {
        this.selected = this.types[i];
      }
    });

    this.selected = type;
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    this._selected = value;
    console.log('selection to ' + value);

    $('#tool-types button').className = '';
    $(`#tool-types button[data-action="${value}"]`).className = 'selected';
  }

  shift(shift) {
    if (shift) {
      if (this._last !== 'erase') this._last = this.selected;
      this.selected = 'erase';
    } else if (this._last) {
      this.selected = this._last;
      this._last = null;
    }
  }

  pan() {}

  fill(node, source, target) {
    if (!node) return;

    const index = parseInt(node.dataset.index, 10);
    const value = parseInt(node.dataset.value, 10);

    if (value !== source || value === target) {
      return;
    }

    this.paint(node, target);

    const { x, y } = indexToXY(index);
    const { children } = node.parentNode;

    this.fill(children[xyToIndex({ x: x - 1, y })], source, target);
    this.fill(children[xyToIndex({ x: x + 1, y })], source, target);
    this.fill(children[xyToIndex({ x, y: y - 1 })], source, target);
    this.fill(children[xyToIndex({ x, y: y + 1 })], source, target);
  }

  paint(node, target) {
    const index = node.dataset.index;
    node.className = 'c-' + target;
    node.dataset.value = target;
    const offset = 256 * currentSprite;
    const x = offset + parseInt(index, 10);
    sprites[x] = target;
  }

  apply(node) {
    let target = this.colour.value;
    if (this.selected === 'erase') {
      target = this.colour.transparent;
    }

    if (this.selected === 'fill') {
      // now find surrounding pixels of the same colour
      this.fill(node, parseInt(node.dataset.value, 10), target);
    } else {
      this.paint(node, target);
    }

    // update preview
    const div = document.querySelector(`#sprites .focus`);
    render(
      new Uint8Array(
        sprites.slice(currentSprite * 256, currentSprite * 256 + 256)
      ),
      div
    );
  }
}

class ColourPicker {
  transparent = 0xe3;
  _index = 0;
  _history = [];

  constructor(size, target) {
    this.size = size;

    const html = Array.from({ length: size }, (_, i) => {
      return `<div title="Key ${i + 1}" data-id=${i} id="picker-${i}"></div>`;
    }).join('');
    target.innerHTML = html;

    target.addEventListener('mousedown', e => {
      if (e.target.dataset.id) {
        this.index = e.target.dataset.id;
      }
    });

    this.container = target;
    this.history = [0, 255, this.transparent];
    this.index = 0;
  }

  set value(index) {
    const colour = parseInt(index, 10);

    if (colour === this._history[0]) {
      this.index = 0;
      return;
    }

    this._history.unshift(colour);
    this.history = this._history.slice(0, this.size);
    this.index = 0;
  }

  set history(values) {
    this._history = values;
    values.forEach((value, i) => {
      document.querySelector('#picker-' + i).className = 'c-' + value;
    });
  }

  get value() {
    return this._history[this._index];
  }

  set index(value) {
    value = parseInt(value, 10);
    this._index = value;
    this.container.dataset.selected = value + 1;
  }
}

const colour = new ColourPicker(8, pickerColour.parentNode);
const tool = new Tool({ colour });

buttons.on('click', e => {
  const action = e.target.dataset.action;
  const offset = 256 * currentSprite;

  if (action === 'new') {
    newSprite();
  }

  if (action === 'dupe') {
    dupeSprite();
  }

  if (action.startsWith('ro')) {
    const left = action === 'rol';
    const right = action === 'ror';
    if (
      (right && currentSprite == totalSprites - 1) ||
      (left && currentSprite === 0)
    ) {
      return;
    }

    const copy = sprites.slice(offset, offset + 256);
    const next = (currentSprite + (left ? -1 : 1)) * 256;
    sprites.set(sprites.slice(next, next + 256), offset);
    sprites.set(copy, next);
    currentSprite += left ? -1 : 1;
    renderSpritePreviews();
    renderCurrentSprite();
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
    for (let i = offset; i < offset + 256; i++) {
      sprites[i] = colour.transparent;
    }
    renderSpritePreviews();
    renderCurrentSprite();
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
  () => {
    down = true;
  },
  true
);

container.addEventListener(
  'mouseup',
  () => {
    down = false;
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

document.body.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    tool.shift(true);
  }
});

document.body.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    tool.shift(false);
  }
});

container.onclick = e => {
  if (e.target.className.startsWith('c-')) {
    if (e.altKey || e.ctrlKey) {
      colour.value = e.target.dataset.value;
    } else {
      // const target = e.shiftKey ? colour.transparent : colour.value;
      // e.target.className = 'c-' + target;
      // e.target.dataset.value = target;

      tool.apply(e.target);
    }
  }
};

document.body.addEventListener('keydown', e => {
  if (e.key >= '1' && e.key <= '8') {
    colour.index = parseInt(e.key, 10) - 1;
    return;
  }

  if (e.key === 'D') {
    download();
    return;
  }

  const current = currentSprite;
  if (e.key === 'ArrowLeft') {
    currentSprite--;
  }
  if (e.key === 'ArrowRight') {
    currentSprite++;
  }

  if (currentSprite === totalSprites) {
    currentSprite = 0;
  } else if (currentSprite < 0) {
    currentSprite = totalSprites - 1;
  }

  if (currentSprite !== current) {
    renderCurrentSprite();
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

  document
    .querySelector(`#sprites > :nth-child(${currentSprite + 1})`)
    .classList.add('focus');
  const offset = 256 * currentSprite;
  render(new Uint8Array(sprites.slice(offset, offset + 256)));
}

function renderSpritePreviews() {
  spritesContainer.innerHTML = '';

  Array.from({ length: totalSprites }, (_, offset) => {
    const div = document.createElement('div');
    div.className = 'sprite';
    render(
      new Uint8Array(sprites.slice(offset * 256, offset * 256 + 256)),
      div
    );
    div.addEventListener('mousedown', () => {
      currentSprite = offset;
      renderCurrentSprite();
    });
    spritesContainer.appendChild(div);
  });
}

function fileHandler(file) {
  file = decode(file);

  totalSprites = file.byteLength / 256;
  currentSprite = 0;
  sprites = file;

  renderSpritePreviews();
  renderCurrentSprite();
}

function render(data, into = container) {
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

function indexToXY(i) {
  const x = i % 16;
  const y = (i / 16) | 0;

  return { x, y };
}

function xyToIndex({ x, y }) {
  if (x < 0) {
    return null;
  }

  if (x >= 16) {
    return null;
  }

  if (y >= 16) {
    return null;
  }

  return 16 * y + x;
}

container.onmousemove = e => {
  const value = e.target.dataset.value;
  if (value === undefined) {
    return;
  }

  const { x, y } = indexToXY(e.target.dataset.index);

  debug.innerHTML = `X:${x} Y:${y} -- ${value} 0x${value
    .toString(16)
    .padStart(2, '0')}`;
};

container.onmouseout = () => {
  debug.innerHTML = '';
};

drop(document.documentElement, fileHandler);
upload.addEventListener('change', e => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();
  reader.onload = event => {
    fileHandler(new Uint8Array(event.target.result));
  };
  reader.readAsArrayBuffer(droppedFile);
});

renderSpritePreviews();
renderCurrentSprite();

render(sprites, picker);
buildStyleSheet();
