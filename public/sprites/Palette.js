import drop from '../lib/dnd';
import track from '../lib/track-down';
import {
  transparent,
  nextLEShortToP,
  rgbFromNext,
  next512FromRGB,
  convertTo9Bit,
  indexToNextLEShort,
  isPriority,
  rgbToHsv,
} from './lib/colour';
import Hooks from '../lib/Hooks';
import { $ } from '../lib/$';
import debounce from 'lodash.debounce';
import SpriteSheet from './SpriteSheet';

const colourTest = document.createElement('div');
document.body.appendChild(colourTest);
const editor = $('#palette-editor');

/**
 * @typedef { import("./lib/colour").RGBA } RGBA
 */

/**
 * @param {number} length
 * @returns {Uint16Array}
 */
function byteArray(length = 256) {
  return Uint16Array.from({ length }, (_, i) => i);
}

/**
 * Sorting function for palettes putting transparent at the front and zeros at the end
 *
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
export function sorter(a, b) {
  if (palette.transparency.includes(a)) return -1;
  if (palette.transparency.includes(b)) return 1;
  if (a === 0) return 1;
  if (b === 0) return -1;
  return a < b ? -1 : 1;
}

/**
 *
 * @param {number} length
 * @returns {Uint16Array}
 */
function defaultPalette(length = 256) {
  const bytes = byteArray(length).map((_) => convertTo9Bit(_));
  return bytes;
}

/**
 * Binds the editor to the live palette
 */
function initEditor() {
  editor.on(
    'input',
    debounce(() => {
      const text = editor.value;
      const values = text
        .trim()
        .split(/\s+/)
        .map((_) => {
          _ = _.trim();
          if (_ === '') return null;
          if (_.startsWith('$')) return parseInt('0x' + _.slice(1), 16);
          const n = parseInt(_, 10);
          if (isNaN(n)) return 0;
          return n;
        })
        .filter((_) => _ !== null);

      palette.restoreFromData(
        Uint16Array.from(values.map((v) => indexToNextLEShort(v)))
      );
    }, 100)
  );
}

/**
 * Represents a Spectrum Next palette
 *
 * @class
 */
export class Palette extends Hooks {
  _transparency = transparent;

  /** @type {Element} */
  _lock = null;

  /** @type {string} */
  filename = 'untitled.pal';
  priority = new Set();

  /**
   * @param {Element} node DOM node to insert picker
   * @param {Uint16Array} [data] initial palette data, defaults to Spectrum Next default
   */
  constructor(node, data = defaultPalette()) {
    super();
    this.data = data;
    this.updateTable();

    /** @type {Element} */
    this.node = node;

    /** @type {Element|null} current selected index node */
    this.lock = null;
  }

  /** @type {Element|null} current selected index node */
  get lock() {
    return this._lock;
  }

  /** @param {Element|null} value selected index node */
  set lock(value) {
    if (value !== null) {
      this.node.parentElement.classList.add('locked');
    } else {
      this.node.parentElement.classList.remove('locked');
    }
    this._lock = value;
  }

  updateCounts() {
    if (!window.sprites.data) return;

    let countMap = this.node.querySelector('.palette-count');

    if (!countMap) {
      countMap = document.createElement('div');
      countMap.className = 'palette-count numeric-map';
      this.node.appendChild(countMap);
    }

    countMap.innerHTML = Array.from(this.data)
      .map(
        (_, i) =>
          `<span>${window.sprites.data.filter((_) => _ === i).length}</span>`
      )
      .join('');
  }

  /**
   * Loads the palette based on file data from a .pal file
   *
   * @param {Uint8Array} data
   */
  restoreFromData(data) {
    this.priority = new Set();
    data = new Uint16Array(data.buffer).map((_, i) => {
      if (isPriority(_)) {
        this.priority.add(i);
      }
      return nextLEShortToP(_);
    });

    this.data = data;
    this.updateTable();
    this.render();
    this.trigger('change');
    this.updateCounts();
  }

  attach() {
    const node = this.node;
    let data = this.data;

    drop(node, (data, file) => {
      this.restoreFromData(data);
      this.filename = file.name;
    });

    const zoom = document.querySelector('#palette .zoom');
    this.zoom = zoom;
    zoom.classList.add(`c2-${nextLEShortToP(data[0])}`);

    const complete = document.querySelector('#complete');
    this.complete = complete;

    const completePalette = new Palette(complete, byteArray(512));
    completePalette.render();

    this.lock = null;
    const p = this;

    this.updateCounts();

    track(complete, {
      move(e) {
        zoom.className = `c2-${e.target.dataset.value} zoom`;
      },
      handler(e) {
        const locked = complete.querySelector('.lock');
        p.clearZoom();
        if (locked === e.target) {
          return;
        }
        e.target.classList.add('lock');
        if (p.lock) {
          const index = parseInt(p.lock.dataset.index, 10);
          p.set(index, parseInt(e.target.dataset.value, 10));
          p.trigger('change');
        }
      },
    });

    track(node, {
      move(e) {
        if (!p.lock) zoom.className = `c2-${e.target.dataset.value} zoom`;
      },
      handler(e) {
        if (e.shiftKey && p.lock) {
          if (p.lock !== e.target) {
            const from = parseInt(p.lock.dataset.index, 10);
            const to = parseInt(e.target.dataset.index, 10);
            p.swap(from, to);
          }
        }
        if (p.lock) {
          p.lock.classList.remove('lock');
        }
        if (p.lock === e.target) {
          p.lock = null;
        } else {
          p.lock = e.target;
        }

        p.trigger('select', p.lock ? e.target.dataset : null);
        if (p.lock) p.lock.classList.add('lock');
      },
    });

    document.querySelector('#find-colour').oninput = (e) => {
      this.find(e.target.value.trim());
    };
  }

  /**
   * Swaps two palette index values
   *
   * @param {number} from
   * @param {number} to
   */
  swap(from, to) {
    /** @type {SpriteSheet} */
    const sprites = window.sprites;

    const prev = this.data[from];
    this.data[from] = this.data[to];
    this.data[to] = prev;

    this.updateTable();
    sprites.swapPalette(from, to); // FIXME this moves from into to, not swap
    this.render();
    this.trigger('change');
    this.updateCounts();
  }

  shift(dir) {
    /** @type {Element} */
    const lock = this.lock;
    if (!lock) {
      alert('Select a palette value first');
      return;
    }

    const i = parseInt(lock.dataset.index, 10);
    if (dir < 0) {
      if (i <= 0) {
        return;
      }
    } else {
      if (i === this.data.length) {
        return;
      }
    }

    lock.classList.remove('lock');
    this.lock = dir > 0 ? lock.nextElementSibling : lock.previousElementSibling;
    this.trigger('select', this.lock.dataset);
    this.lock.classList.add('lock');

    this.swap(i, i + dir);
  }

  shiftLeft() {
    this.shift(-1);
  }

  shiftRight() {
    this.shift(1);
  }

  /**
   * Mutates the palette order
   *
   * @param {string} by comma separated list of rgbhsv
   * @param {number} [offset=0]
   * @param {number} [limit=256]
   */
  sort(by = 'r', offset = null, limit = null) {
    if (offset === null) {
      offset = 0;
      limit = 256;
    }

    if (limit === null) {
      limit = offset;
      offset = 0;
    }

    const original = Uint16Array.from(this.data);
    const data = Uint16Array.from(this.data.slice(offset, limit));
    const sorter = by.split(',');
    data.sort((a, b) => {
      const ai = rgbFromNext(a);
      const ahsv = { ...ai, ...rgbToHsv(ai) };
      const bi = rgbFromNext(b);
      const bhsv = { ...bi, ...rgbToHsv(bi) };

      return sorter.reduce((acc, curr) => {
        let mul = 1;
        if (curr.startsWith('-')) {
          curr = curr.substring(1);
          mul = -1;
        }
        if (acc === 0) {
          if (ahsv[curr] === bhsv[curr]) {
            return 0;
          }
          return ahsv[curr] < bhsv[curr] ? 1 * mul : -1 * mul;
        }
        return acc;
      }, 0);
    });

    this.data.set(data, offset);

    /** @type {SpriteSheet} */
    const sprites = window.sprites;
    sprites.snapshot();

    sprites.data.forEach((from, i) => {
      const og = original[from];
      const to = this.data.indexOf(og);

      sprites.data[i] = to;
    });

    sprites.paintAll();
    sprites.trigger();

    this.priority = new Set();
    this.updateTable();
    this.render();
    this.trigger('change');
    this.updateCounts();
  }

  /**
   * Constructs a standard palette info string: i:index, c:$colour #:$rgb
   *
   * @param {number} index
   * @param {number} [value] value of colour, defaults palette index value
   * @returns {string}
   */
  info(index, value = this.get(index)) {
    if (value === undefined) return ``;

    let hex = this.getHex(index, '#');
    if (this.transparency.includes(value)) {
      hex = 'transparent';
    }
    let extra = '';
    if (this.priority.has(index)) {
      extra = ' Priority';
    }
    return `i:${index} c:${value.toString(16).toUpperCase()} ${hex + extra}`;
  }

  /**
   * Gets an array of colours from a row of the full palette
   *
   * @param {number} [index=0] 0-16 the 16 byte index from the palette
   * @returns {string[]}
   */
  get4Bit(index = 0) {
    index *= 16;
    const p = Array.from({ length: 16 }, (_, i) => {
      return this.get(index + i);
    });
    return p;
  }

  /**
   *
   * @param {number[]} needle Array of palette values (from the 512 set)
   * @returns {boolean|null} The 16 byte index from the current palette
   */
  find4BitIndex(needle) {
    let found = null;
    for (let i = 0; i < 16; i++) {
      const row = palette.get4Bit(i).sort(sorter);

      const count = needle.filter((p) => row.includes(p)).length;
      // const onBoard = row.filter((p) => needle.includes(p)).length;

      if (count === needle.length) {
        found = i;
        break;
      }
    }

    return found;
  }

  /**
   * Creates a palette pixel with dataset assigned
   *
   * @param {number} value The Spectrum Next palette value
   * @param {number} index Index in the source palette
   * @param {string} [prefix=c] className prefix
   * @param {number[]} [transparency=[]]
   * @returns {Element}
   */
  makePixel(value, index, prefix = 'c', transparency = []) {
    const d = document.createElement('div');
    d.className = prefix + '-' + value;
    d.dataset.value = value;
    d.dataset.index = index;

    if (transparency.includes(value)) {
      d.classList.add('transparent');
    }

    if (this.getPriority(index)) {
      d.classList.add('priority');
    }

    d.title = this.info(index);
    return d;
  }

  /**
   * Moves the palette DOM tree to the new .palette selector under the given id
   *
   * @param {string} id CSS id of node
   */
  moveTo(id) {
    const root = document.querySelector(`#${id} .palette`);
    root.appendChild(this.node);
    this.updateCounts();
  }

  /**
   * Resets the "lock" outline on the complete colour palette
   */
  clearZoom() {
    Array.from(this.complete.childNodes).forEach((_) =>
      _.classList.remove('lock')
    );
  }

  /**
   * @returns {number}
   */
  get selectedIndex() {
    if (!this.lock) return null;
    return parseInt(this.lock.dataset.index, 10);
  }

  /**
   * @param {boolean} priority
   */
  setPriority(priority) {
    if (!this.lock) {
      console.log(`Can't call priority without a index selected`);
      return;
    }

    const i = this.selectedIndex;

    if (priority) {
      this.priority.add(i);
      this.node.childNodes[i].classList.add('priority');
    } else {
      if (this.priority.has(i)) {
        this.priority.delete(i);
        this.node.childNodes[i].classList.remove('priority');
      }
    }

    this.trigger('change');
  }

  /**
   * @param {number} [index]
   * @returns {boolean}
   */
  getPriority(index = this.selectedIndex) {
    return index !== null ? this.priority.has(index) : false;
  }

  /**
   * The transparency as 8bit and 9bit values
   *
   * @type {Array<number>}
   */
  get transparency() {
    return [0x1c6, 0x1c7];
  }

  /**
   * Transparency as an 8bit value
   *
   * @type {number}
   */
  get transparent() {
    let index = this.data.indexOf(0x1c6);
    if (index !== -1) {
      return index;
    }
    index = this.data.indexOf(0x1c7);
    return index;
  }

  /**
   * Transparency as an 8bit value
   *
   * @type {number}
   */
  get transparent9Bit() {
    return this.data[this.transparent];
  }

  /**
   * Helper to understand whether the global transparency needs to be changed
   * or not in your code.
   *
   * @type {boolean}
   */
  get transparencyIsDefault() {
    return this.transparent === 227;
  }

  /**
   * Search for the closet matching colour from the complete table based on
   * a given CSS colour.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#colors_table
   * @param {string} value
   */
  find(value) {
    this.clearZoom();

    if (value === '') {
      return;
    }

    let index;

    if (/^(0x[\da-f]{1,3}$)|(\d{1,3}$)/.test(value)) {
      index = parseInt(value, value.includes('0x') ? 16 : 10);
    } else {
      colourTest.style.backgroundColor = value;

      const rgb = window.getComputedStyle(colourTest).backgroundColor;
      const match = rgb.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([0-9.]+))?\)/);

      if (!match || match.length < 4) return;

      const [, r, g, b] = match.map((_) => parseInt(_, 10));
      index = next512FromRGB({ r, g, b });
    }

    if (index >= 512) return;

    this.zoom.className = `c2-${index} zoom`;
    try {
      this.complete.childNodes[index].classList.add('lock');
    } catch (e) {
      // do nothing
    }
  }

  render(sort = false) {
    const into = this.node;
    into.innerHTML = '';
    const lock = this.lock ? parseInt(this.lock.dataset.index, 10) : null;
    let sorted = Array.from(this.table);
    if (sort) sorted.sort((a, b) => (a < b ? -1 : 1));
    for (let i = 0; i < sorted.length; i++) {
      let value = sorted[i];
      into.appendChild(this.makePixel(value, i, 'c2', this.transparency));
    }

    if (lock !== null) {
      this.lock = this.node.childNodes[lock];
      this.lock.classList.add('lock');
    }

    if (document.activeElement === editor[0]) {
      console.log('early exit');

      return;
    }

    this.updateEditor();
  }

  updateEditor() {
    let sorted = Array.from(this.table);
    editor.value = sorted
      .map((index) => ('$' + index.toString(16)).padStart(6, ' '))
      .reduce((acc, curr, i) => {
        acc += curr;
        if ((i + 1) % 16 === 0) {
          acc += '\n';
        }
        return acc;
      }, '')
      .toUpperCase()
      .trimEnd();
  }

  updateTable() {
    this.table = Array.from(this.data); //.map((_) => nextLEShortToP(_));
    this.rgb = Array.from(this.table).map((_) => rgbFromNext(_));
  }

  reset() {
    this.priority = new Set();
    this.data = defaultPalette();
    this.updateTable();
    this.render();
    this.trigger('change');
    this.updateCounts();
  }

  /**
   * Serialises the palette for local storage
   *
   * @returns {object}
   */
  serialize() {
    return {
      filename: this.filename,
      priority: Array.from(this.priority),
      data: Array.from(this.export()),
    };
  }

  exportGPL() {
    let res = `GIMP Palette
#Palette Name: Spectrum Next 256 pal
#Description: Palette created by <a href="https://zx.remysharp.com" target="_blank">zx.remysharp.com</a>.
#Colors: 256
`;
    res += Array.from(this.data)
      .map((_, i) => {
        const { r, g, b } = rgbFromNext(_);
        return `${r}	${g}	${b}	${this.getHex(i, '')}`;
      })
      .join('\n');

    return res;
  }

  /**
   * Exports data for local file save to .pal file
   *
   * @returns {Uint8Array}
   */
  export() {
    return new Uint8Array(
      this.data.map((_, i) =>
        indexToNextLEShort(_, this.priority.has(i))
      ).buffer
    );
  }

  /**
   * Sets the palette index to given colour 8bit value, updating the currently
   * selected palette index if it was selected previously
   *
   * @param {number} index palette index
   * @param {number} value colour value
   */
  set(index, value) {
    this.data[index] = value;
    this.table[index] = value;
    this.rgb[index] = rgbFromNext(this.table[index]);

    // note: .table and .rgb need to set ahead of using this
    const px = this.makePixel(value, index, 'c2');
    if (this.lock === this.node.childNodes[index]) {
      px.classList.add('lock');
      this.lock = px;
    }
    this.node.childNodes[index].replaceWith(px);

    this.trigger('change');
  }

  /**
   * Copies the current selected value from the complete palette across to the
   * current palette and increments the current selected index on both
   */
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

  /**
   * Returns the spectrum next colour value for the given index
   *
   * @param {number} index palette index
   * @returns {number} 9bit spectrum colour value
   */
  get(index) {
    const res = this.table[index];
    if (res === undefined) {
      return this.table[0];
    }
    return res;
  }

  /**
   * Returns the palette index for a given RGB
   *
   * @param {RGBA} rgba object
   * @returns {number} index
   */
  getFromRGB({ r, g, b, a }) {
    if (a === 0) {
      let index = this.table.indexOf(this.transparency[0]);
      if (index === -1) {
        index = this.table.indexOf(this.transparency[1]);
      }
      if (index != -1) {
        return index;
      }
    }

    const index = next512FromRGB({ r, g, b });

    return this.table.indexOf(index);
  }

  /**
   * Returns an RGB object for the given palette index
   *
   * @param {number} index
   * @returns {RGBA} RGB object
   */
  getRGB(index) {
    if (this.transparency.includes(this.table[index])) {
      return { ...this.rgb[index], a: 0 };
    }
    if (this.rgb[index]) {
      return this.rgb[index];
    }

    return this.rgb[0];
  }

  /**
   * Returns an RGB hex string for the given palette index
   *
   * @param {number} index palette index
   * @param {string} [prefix=#] String prefix
   * @returns {string} RGB hex for value at given index
   */
  getHex(index, prefix = '#') {
    const { r, g, b } = this.getRGB(index);
    return (
      prefix +
      [r, g, b]
        .map((_) => _.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  }

  getActiveIndex() {
    if (!this.lock) return null;
    const index = parseInt(this.lock.dataset.index, 10);
    return index;
  }

  /**
   * Increments the current select palette index
   *
   * @returns {boolean} `true` if inc was successful
   */
  next() {
    const index = this.getActiveIndex();
    if (index === null) return false;
    if (index === this.data.length - 1) return;
    this.lock.classList.remove('lock');
    this.lock = this.node.childNodes[index + 1];
    this.lock.classList.add('lock');
    return true;
  }

  /**
   * Decrements the current select palette index
   *
   * @returns {boolean} `true` if dec was successful
   */
  prev() {
    const index = this.getActiveIndex();
    if (!index) return false;
    this.lock.classList.remove('lock');
    this.lock = this.node.childNodes[index - 1];
    this.lock.classList.add('lock');
    return true;
  }
}

const palette = new Palette(document.querySelector('#palette .picker'));
export default palette;
palette.attach();
initEditor();
