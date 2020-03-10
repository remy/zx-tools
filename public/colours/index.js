import drop from './lib/dnd.js';
import { rgbFromIndex } from './lib/colour.js';
import save from './lib/save.js';
import { decode } from './lib/parser.js';

const container = document.querySelector('#container');
const spritesContainer = document.querySelector('#sprites');
const debug = document.querySelector('#debug');

let sprites = Array.from({ length: 256 }, (_, i) => i);
let currentSprite = 0;
let totalSprites = 1;

document.body.onkeydown = e => {
  console.log(e.key);

  if (e.key === 'D') {
    const filename = prompt('Filename:', 'untitled.spr');
    if (filename) {
      save(sprites, filename);
    }
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
    try {
      spritesContainer.querySelector('.focus').classList.remove('focus');
    } catch (e) {
      // noop
    }
    document
      .querySelector(`#sprites > :nth-child(${currentSprite + 1})`)
      .classList.add('focus');
    renderCurrentSprite();
  }
};

function renderCurrentSprite() {
  const offset = 256 * currentSprite;
  render(new Uint8Array(sprites.slice(offset, offset + 256)));
}

function fileHandler(file) {
  file = decode(file);

  totalSprites = file.byteLength / 256;
  currentSprite = 0;
  sprites = file;

  spritesContainer.innerHTML = '';

  Array.from({ length: totalSprites }, (_, offset) => {
    const div = document.createElement('div');
    render(
      new Uint8Array(sprites.slice(offset * 256, offset * 256 + 256)),
      div
    );
    spritesContainer.appendChild(div);
  });

  renderCurrentSprite();
}

function render(data, into = container) {
  into.innerHTML = '';
  for (let i = 0; i < data.length; i++) {
    let index = data[i];
    into.appendChild(makePixel(rgbFromIndex(index), index));
  }
}

function makePixel({ r, g, b, a }, index) {
  const d = document.createElement('div');
  d.style = `background: rgba(${[r, g, b, a].join(', ')})`;
  d.title = `${index} 0x${index.toString(16).padStart(2, '0')}`;
  return d;
}

container.onmousemove = e => {
  const d = e.target.title;
  if (!d) {
    return;
  }

  debug.innerHTML = d;
};

drop(document.body, fileHandler);
// fetch('/grid.bmp')
//   .then(res => res.arrayBuffer())
//   .then(res => fileHandler(new Uint8Array(res)));
renderCurrentSprite();
