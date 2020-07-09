import palette from './Palette';

export default class ColourPicker {
  _index = 0;
  _history = [];

  /**
   * @param {Object} options
   * @param {number} [options.size=8] Size of history
   * @param {Element} options.node
   */
  constructor({ size = 8, node }) {
    this.size = size;

    const html = Array.from({ length: size }, (_, i) => {
      return `<div title="Key ${i + 1}" data-id=${i} id="picker-${i}"></div>`;
    }).join('');
    node.innerHTML = html;

    palette.hook((type, dataset) => {
      if (type === 'change') this.history = this._history.slice(0, this.size);

      if (type === 'select' && dataset.index) {
        this.value = dataset.index;
      }
    });

    node.addEventListener('mousedown', (e) => {
      const dataset = e.target.dataset;
      if (dataset.id) {
        this.index = dataset.id;
      }
    });

    this.container = node;
    this.history = [0, 255, palette.transparent];
    this.index = 0;
  }

  set value(index) {
    const colour = parseInt(index, 10);

    const prev = this._history.indexOf(colour);

    if (prev != -1) {
      this._history.splice(prev, 1);
    }

    if (colour === this._history[0]) {
      this.index = 0;
      return;
    }

    this._history.unshift(colour);
    this.history = this._history.slice(0, this.size);
    this.index = 0;
  }

  /**
   * returns the palette index that's currently selected (not a colour)
   */
  get value() {
    return this._history[this._index];
  }

  set history(values) {
    this._history = values;
    values.forEach((index, i) => {
      const el = document.querySelector('#picker-' + i);
      el.title = `Key ${i} - ${palette.info(index)}`;
      el.className = 'c2-' + palette.get(index);
      el.dataset.value = palette.get(index);
      el.dataset.hex = palette.get(index).toString(16).toUpperCase();
    });
  }

  set index(value) {
    value = parseInt(value, 10);
    this._index = value;
    this.container.dataset.selected = value + 1;
  }
}
