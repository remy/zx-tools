import { $ } from '../lib/$.js';
import { getCoords } from './SpriteSheet.js';

export default class Tool {
  types = ['brush', 'fill', 'erase', 'pan'];
  _selected = 'brush';
  state = {
    target: null,
    index: null,
  };

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
    this.state = { index: null, target: null };

    $('#tool-types button').className = '';
    $(`#tool-types button[data-action="${value}"]`).className = 'selected';
    document.documentElement.dataset.tool = value;
  }

  shift(shift) {
    this.state.index = null;
    if (shift) {
      if (this._last !== 'erase') this._last = this.selected;
      this.selected = 'erase';
    } else if (this._last) {
      this.selected = this._last;
      this._last = null;
    }
  }

  pan(coords, sprites) {
    const sprite = sprites.sprite;
    const ctx = sprites.ctx;
    const x = coords.x - this._coords.x;
    const y = coords.y - this._coords.y;

    sprite.render(x, y);
    sprite.paint(ctx);
  }

  fill(sprites, coords, source, target) {
    if (!coords || coords.index === null) return;

    const value = sprites.pget(coords);

    if (value !== source || value === target) {
      return;
    }

    this.paint(sprites, coords, target);

    const { x, y } = coords;

    this.fill(sprites, { x: x - 1, y }, source, target);
    this.fill(sprites, { x: x + 1, y }, source, target);
    this.fill(sprites, { x, y: y - 1 }, source, target);
    this.fill(sprites, { x, y: y + 1 }, source, target);
  }

  paint(sprites, coords, target) {
    return sprites.pset(coords, target);
  }

  start(event) {
    const coords = getCoords(event);
    this._coords = coords;
  }

  end() {
    // this._coords = null;
  }

  apply(event, sprites) {
    const coords = getCoords(event, 32, 32);
    let target = this.colour.value;

    if (this.selected === 'erase') {
      target = this.colour.transparent;
    }

    // if nothing has changed, don't do the work
    if (
      event.type === this.state.event &&
      coords.index === this.state.index &&
      target === this.state.target
    ) {
      return;
    }
    this.state.index = coords.index;
    this.state.target = target;
    this.state.event = event.type;

    if (this.selected === 'pan') {
      if (event.type === 'click' && this._coords.index !== coords.index) {
        // this is a release
        // read from the canvas and put into pixels
        sprites.snapshot();
        sprites.canvasToPixels();
        sprites.rebuild(sprites.current);
        sprites.paint();
        return;
      }

      if (!this._coords) {
        return; // noop
      }

      this.pan(coords, sprites);

      return;
    }

    if (this.selected === 'fill') {
      // now find surrounding pixels of the same colour
      this.fill(sprites, coords, sprites.pget(coords), target);
    } else {
      this.paint(sprites, coords, target);
    }

    // update canvas
    if (event.type === 'click') sprites.snapshot();
    sprites.paint();
  }
}
