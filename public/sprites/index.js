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

let sprites = Array.from({ length: 256 }, (_, i) => i);
let currentSprite = 0;
let totalSprites = 1;

const newSprite = () => {
  totalSprites++;
  currentSprite++;
  sprites = sprites.concat(
    Array.from({ length: 256 }).fill(colour.transparent)
  );
  renderSpritePreviews();
  renderCurrentSprite();
};

function download() {
  const filename = prompt('Filename:', 'untitled.spr');
  if (filename) {
    save(sprites, filename);
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

    target.onclick = e => {
      if (e.target.dataset.id) {
        this.index = e.target.dataset.id;
      }
    };

    this.container = target;
    this.history = [0, 255, this.transparent];
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

const colour = new ColourPicker(6, pickerColour.parentNode);

buttons.on('click', e => {
  const action = e.target.dataset.action;
  if (action === 'new') {
    newSprite();
  }

  if (action === 'clear') {
    const offset = 256 * currentSprite;
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

picker.onclick = e => {
  colour.value = e.target.dataset.value;
};

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

container.onclick = e => {
  if (e.target.className.startsWith('c-')) {
    if (e.altKey || e.ctrlKey) {
      colour.value = e.target.dataset.value;
    } else {
      const target = e.shiftKey ? colour.transparent : colour.value;
      e.target.className = 'c-' + target;
      e.target.dataset.value = target;

      const offset = 256 * currentSprite;
      const x = offset + parseInt(e.target.dataset.index, 10);
      sprites[x] = parseInt(target, 10);
    }
  }
};

document.body.onkeydown = e => {
  if (e.key >= '1' && e.key <= '6') {
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
};

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
  } catch (e) {}

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
    into.appendChild(makePixel(rgbFromIndex(index), index, i));
  }
}

function makePixel({ r, g, b, a }, index, dataIndex) {
  const d = document.createElement('div');
  // d.style = `background: rgba(${[r, g, b, a].join(', ')})`;
  d.className = 'c-' + index;
  d.title = `${index} 0x${index.toString(16).padStart(2, '0')}`;
  d.dataset.value = index;
  d.dataset.index = dataIndex;
  return d;
}

container.onmousemove = e => {
  const d = e.target.title;
  if (!d) {
    return;
  }

  debug.innerHTML = d;
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
