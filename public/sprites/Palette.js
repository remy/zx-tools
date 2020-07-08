import dnd from '../lib/dnd';
import track from '../lib/track-down';
import {
  transparent,
  nextLEShortToP,
  rgbFromNext,
  next512FromRGB,
} from './lib/colour';
import Hooks from '../lib/Hooks';

const colourTest = document.createElement('div');
document.body.appendChild(colourTest);

/**
 * Creates a palette pixel with dataset assigned
 * @param {number} value The Spectrum Next palette value
 * @param {number} index Index in the source palette
 * @param {string} [prefix=c] className prefix
 * @returns Element
 */
export function makePixel(value, index, prefix = 'c') {
  const d = document.createElement('div');
  d.className = prefix + '-' + value;
  d.dataset.value = value;
  d.dataset.index = index;
  const { r, g, b } = rgbFromNext(value);
  let hex =
    '#' +
    [r, g, b]
      .map((_) => _.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();

  if (value === transparent) {
    hex = 'transparent';
  }

  d.title = `${value} -- ${hex}`;
  return d;
}

function defaultPalette(length = 256) {
  return Uint16Array.from({ length }, (_, i) => i);
}

export default class Palette extends Hooks {
  /**
   *
   * @param {Object} options
   * @param {Element} options.node DOM node to insert picker
   * @param {Uint16Array} options.data Source Next palette data
   */
  constructor({ node, data = defaultPalette() }) {
    super();
    this.data = data;

    dnd(node, (file) => {
      data = new Uint16Array(file.buffer);
      this.data = data;
      this.render();
    });

    const zoom = document.querySelector('#palette .zoom');
    this.zoom = zoom;
    zoom.classList.add(`c2-${nextLEShortToP(data[0])}`);

    const complete = document.querySelector('#complete');
    this.complete = complete;

    this.render.call({ node: complete, data: defaultPalette(512) }, true);

    this.lock = null;
    const p = this;

    track(complete, {
      move(e) {
        zoom.className = `c2-${e.target.dataset.value} zoom`;
      },
      handler(e) {
        const locked = complete.querySelector('.lock');
        p.clearZoom();
        console.log(locked);

        if (locked === e.target) {
          return;
        }
        e.target.classList.add('lock');
        if (p.lock) {
          const index = parseInt(p.lock.dataset.index, 10);
          p.set(index, parseInt(e.target.dataset.value, 10));
        }
      },
    });

    track(node, {
      move(e) {
        if (!p.lock) zoom.className = `c2-${e.target.dataset.value} zoom`;
      },
      handler(e) {
        if (p.lock) {
          p.lock.classList.remove('lock');
        }
        p.trigger(e.target.dataset);
        if (p.lock === e.target) {
          p.lock = null;
          return;
        }
        p.lock = e.target;
        p.lock.classList.add('lock');
      },
    });

    document.querySelector('#find-colour').oninput = (e) => {
      this.find(e.target.value.trim());
    };

    this.node = node;
  }

  moveTo(id) {
    const root = document.querySelector(`#${id} .palette`);
    root.appendChild(this.node);
    console.log('move to', id);
  }

  clearZoom() {
    Array.from(this.complete.childNodes).forEach((_) =>
      _.classList.remove('lock')
    );
  }

  /**
   *
   * @param {string} value
   */
  find(value) {
    this.clearZoom();

    if (value === '') {
      return;
    }

    let index;

    if (value.length <= 3 && /^\d+$/.test(value)) {
      index = parseInt(value, 10);
    } else {
      colourTest.style.backgroundColor = value;

      const rgb = window.getComputedStyle(colourTest).backgroundColor;
      const match = rgb.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([0-9.]+))?\)/);

      if (!match || match.length < 4) return;

      const [, r, g, b] = match.map((_) => parseInt(_, 10));
      index = next512FromRGB(r, g, b);
    }

    this.zoom.className = `c2-${index} zoom`;
    this.complete.childNodes[index].classList.add('lock');
  }

  sort() {
    this.render(true);
  }

  unsorted() {
    this.render(false);
  }

  render(sort = false) {
    const into = this.node;
    into.innerHTML = '';
    const sorted = Array.from(this.data).map((_) => nextLEShortToP(_));
    if (sort) sorted.sort((a, b) => (a < b ? -1 : 1));
    for (let i = 0; i < sorted.length; i++) {
      let value = sorted[i];
      into.appendChild(makePixel(value, i, 'c2'));
    }
  }

  reset() {
    this.data = defaultPalette();
  }

  set(index, value) {
    this.data[index] = value;
    const px = makePixel(value, index, 'c2');
    this.node.childNodes[index].replaceWith(px);
    px.classList.add('lock');
    this.lock = px;
  }

  setInc() {
    const index = this.getActiveIndex();
    if (index === null) return;
    const target = this.complete.querySelector('.lock');
    this.set(index, parseInt(target.dataset.value, 10));
    target.classList.remove('lock');
    if (this.next()) {
      target.nextElementSibling.classList.add('lock');
    }
  }

  get(index) {
    return nextLEShortToP(this.data[index]);
  }

  getActiveIndex() {
    if (!this.lock) return null;
    const index = parseInt(this.lock.dataset.index, 10);
    return index;
  }

  next() {
    const index = this.getActiveIndex();
    if (index === null) return false;
    if (index === this.data.length - 1) return;
    this.lock.classList.remove('lock');
    this.lock = this.node.childNodes[index + 1];
    this.lock.classList.add('lock');
    return true;
  }

  prev() {
    const index = this.getActiveIndex();
    if (!index) return false;
    this.lock.classList.remove('lock');
    this.lock = this.node.childNodes[index - 1];
    this.lock.classList.add('lock');
    return true;
  }
}
