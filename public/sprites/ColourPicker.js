import { transparent } from './lib/colour.js';

export default class ColourPicker {
  transparent = transparent;
  _index = 0;
  _history = [];

  constructor(size, target) {
    this.size = size;

    const html = Array.from({ length: size }, (_, i) => {
      return `<div title="Key ${i + 1}" data-id=${i} id="picker-${i}"></div>`;
    }).join('');
    target.innerHTML = html;

    target.addEventListener('mousedown', (e) => {
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
      const el = document.querySelector('#picker-' + i);
      el.title = `Key ${i} - ${value} -- 0x${value
        .toString(16)
        .padStart(2, '0')}`;
      el.className = 'c-' + value;
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
