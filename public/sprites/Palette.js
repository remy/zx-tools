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
} from './lib/colour';
import Hooks from '../lib/Hooks';

const colourTest = document.createElement('div');
document.body.appendChild(colourTest);

/**
 * @typedef RGBA
 * @property {number} r 0-255
 * @property {number} g 0-255
 * @property {number} b 0-255
 * @property {number} a 255 - typically defaulted as our values don't have semi-opaque
 */

/**
 * @param {number} length
 * @returns {Uint16Array}
 */
function byteArray(length = 256) {
  return Uint16Array.from({ length }, (_, i) => i);
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
 * Represents a Spectrum Next palette
 *
 * @class
 */
export class Palette extends Hooks {
  _transparency = transparent;
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

  attach() {
    const node = this.node;
    let data = this.data;

    drop(node, (file) => {
      this.priority = new Set();
      data = new Uint16Array(file.buffer).map((_, i) => {
        if (i === 1) {
          console.log({
            _,
            _1: Uint16Array.of(_),
            a: isPriority(_),
            b: isPriority(Uint16Array.of(_)[0]),
          });
        }
        if (isPriority(_)) {
          this.priority.add(i);
        }
        return nextLEShortToP(_);
      });

      console.log(data.slice(0, 3));

      this.data = data;
      this.updateTable();
      this.render();
      this.trigger('change');
      this.updateCounts();
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
   * Constructs a standard palette info string: i:index, c:$colour #:$rgb
   *
   * @param {number} index
   * @param {number} [value] value of colour, defaults palette index value
   * @returns {string}
   */
  info(index, value = this.get(index)) {
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
    const t = this._transparency << 1;
    return [t, t + 1];
  }

  /**
   * Transparency as an 8bit value
   *
   * @type {number}
   */
  get transparent() {
    return this._transparency;
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
    this.complete.childNodes[index].classList.add('lock');
  }

  render(sort = false) {
    const into = this.node;
    into.innerHTML = '';
    let sorted = Array.from(this.table);
    if (sort) sorted.sort((a, b) => (a < b ? -1 : 1));
    for (let i = 0; i < sorted.length; i++) {
      let value = sorted[i];
      into.appendChild(this.makePixel(value, i, 'c2', this.transparency));
    }
  }

  updateTable() {
    this.table = Array.from(this.data); //.map((_) => nextLEShortToP(_));
    this.rgb = Array.from(this.table).map((_) => rgbFromNext(_));
  }

  reset() {
    this.data = defaultPalette();
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
      data: Array.from(
        new Uint8Array(this.data.map((_) => indexToNextLEShort(_)).buffer)
      ),
    };
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
    return this.table[index];
  }

  /**
   * Returns an RGB object for the given palette index
   *
   * @param {number} index
   * @returns {RGBA} RGB object
   */
  getRGB(index) {
    if (this.transparency.includes(this.table[index])) {
      return { r: 0, g: 0, b: 0, a: 0 };
    }
    return this.rgb[index];
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
