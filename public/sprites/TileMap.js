// import { rgbFromIndex, transparent, toRGB332 } from './lib/colour.js';
import { xyToIndex } from './SpriteSheet.js';
import { $ } from '../lib/$.js';
import trackDown from '../lib/track-down.js';

const dummySpriteSheet = {
  get() {
    return dummySpriteSheet;
  },

  paint() {},
};

export function getCoords(e, w, size) {
  const rect = e.target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / size) | 0; //x position within the element.
  const y = ((e.clientY - rect.top) / size) | 0; //y position within the element.
  const index = xyToIndex({ x, y, w });
  return { x, y, index };
}

const sizes = new Map([
  [16, { bank: 16 * 12, w: 16, h: 12 }],
  [8, { bank: 32 * 24, w: 32, h: 24 }],
]);

export default class TileMap {
  scale = 2;
  _sprites = null;
  _tmp = null;

  constructor({ size = 16, sprites }) {
    const scale = this.scale;
    this.size = size;
    const { bank, w, h } = sizes.get(size);
    this.width = w;
    this.height = h;

    this.bank = new Uint8Array(bank);
    this.bank.fill(1024 / size - 1);

    this.ctx = document.createElement('canvas').getContext('2d');

    const el = this.ctx.canvas;
    el.style.maxWidth = `${w * size * scale}px`;

    el.width = w * size * scale;
    el.height = h * size * scale;

    const cancel = trackDown(el, {
      handler: (e) => {
        const { index } = getCoords(e, this.width, this.size * this.scale);
        this.set(index);
        this._tmp = null;
        this.paint();
      },
      end: (e) => this.hover(e),
    });

    el.addEventListener('mouseout', () => {
      cancel();
      this.clearHover();
    });

    this.sprites = sprites;
    this.active = true;
  }

  set active(value) {
    $(`.tile-controls input[name="size"][value="${this.size}"]`).checked = true;
    $(`.tile-controls input[name="width"]`).value = this.width;
    $(`.tile-controls input[name="height"]`).value = this.height;
  }

  set sprites(sprites) {
    this._sprites = sprites || dummySpriteSheet;
    if (sprites) sprites.hook(() => this.paint());
    this.paint();
  }

  get sprites() {
    return this._sprites;
  }

  getXY = (i) => {
    const x = i % this.width;
    const y = (i / this.width) | 0;

    return { x, y };
  };

  set(index) {
    this.bank[index] = this.sprites.current;
  }

  clearHover() {
    if (this._tmp !== null) {
      const index = this._tmp;
      const { x, y } = this.getXY(index);
      // if (this.bank[index] === -1) {
      //   this.ctx.clearRect(
      //     x * this.size * this.scale,
      //     y * this.size * this.scale,
      //     this.size * this.scale,
      //     this.size * this.scale
      //   );
      // } else {
      const sprite = this.sprites.get(this.bank[index]);

      sprite.paint(
        this.ctx,
        x * this.size * this.scale,
        y * this.size * this.scale,
        this.size * this.scale,
        false
      );
      // }
      this._tmp = null;
    }
  }

  hover(e) {
    const { index, x, y } = getCoords(e, this.width, this.size * this.scale);

    if (this._tmp === index) {
      return;
    }

    this.clearHover();

    this._tmp = index;
    this.sprites.sprite.paint(
      this.ctx,
      x * this.size * this.scale,
      y * this.size * this.scale,
      this.size * this.scale,
      false
    );
  }

  paint() {
    for (let i = 0; i < this.bank.length; i++) {
      // if (this.bank[i] > -1) {
      const { x, y } = this.getXY(i);
      const sprite = this.sprites.get(this.bank[i]);
      sprite.paint(
        this.ctx,
        x * this.size * this.scale,
        y * this.size * this.scale,
        this.size * this.scale,
        false
      );
      // }
    }
  }
}
