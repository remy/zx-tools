// import { rgbFromIndex, transparent, toRGB332 } from './lib/colour.js';
import { xyToIndex } from './SpriteSheet.js';
import { $ } from '../lib/$.js';
import trackDown from '../lib/track-down.js';

const dummySpriteSheet = {
  get() {
    return dummySpriteSheet;
  },

  setScale() {},

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

  constructor({ size = 8, sprites }) {
    const scale = this.scale;
    this.size = size;
    const { bank, w, h } = sizes.get(size);
    // max bank size: 16k
    this.bank = new Uint8Array(bank);
    this.bank.fill(1024 / size - 1);

    this.ctx = document.createElement('canvas').getContext('2d');

    const el = this.ctx.canvas;

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

    $(`.tile-controls input[name="size"][value="${this.size}"]`).checked = true;
    this.elements = {
      width: $(`.tile-controls input[name="width"]`),
      height: $(`.tile-controls input[name="height"]`),
      scale: $(`.tile-controls input[name="size"]`),
    };

    $(`.tile-controls input[name="size"]`).on('change', (e) => {
      this.sprites.setScale(parseInt(e.target.value, 10));
    });

    // this.elements.scale.filter(
    //   (_) => parseInt(_.value, 10) === this.size
    // )[0].checked = true;

    $('.tile-controls input').on('change', () => {
      this.size = parseInt(
        this.elements.scale.filter((_) => _.checked)[0].value,
        10
      );
      this.resize(
        parseInt(this.elements.width.value, 10),
        parseInt(this.elements.height.value, 10)
      );
    });

    // triggers dom changes
    this.setDimensions(w, h);
  }

  serialize() {
    return {
      bank: Array.from(this.bank),
      scale: this.scale,
      width: this.width,
      height: this.height,
      size: this.size,
    };
  }

  setDimensions(width, height) {
    this.elements.width.value = width;
    this.elements.height.value = height;
    this.width = width;
    this.height = height;

    const { size, scale } = this;
    const el = this.ctx.canvas;
    el.width = width * size * scale;
    el.height = height * size * scale;
  }

  resize(w, h) {
    const { width, height } = this;
    this.width = w;
    this.height = h;
    const size = this.size;
    const el = this.ctx.canvas;

    // max bank size: 16k
    const bank = new Uint8Array(w * h);
    bank.fill(this.size === 16 ? 63 : 255); // fill with the last sprite value

    if (w !== width) {
      const adjust = w > width ? width : w;
      for (let i = 0; i < height; i++) {
        // note: i * w = row length
        bank.set(this.bank.slice(i * width, i * width + adjust), i * w);
      }
    } else {
      bank.set(this.bank.slice(0, bank.length));
    }

    this.bank = bank;

    el.width = w * size * this.scale;
    el.height = h * size * this.scale;
    this.paint();
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
      const { x, y } = this.getXY(i);
      let bankIndex = this.bank[i];
      if (this.size === 8) {
        bankIndex = (i / 4) | 0;
      }

      const sprite = this.sprites.get(bankIndex);

      // if (this.size === 8) {
      //   sprite.setScale(8, i % 4);
      // }

      sprite.paint(
        this.ctx,
        x * this.size * this.scale,
        y * this.size * this.scale,
        this.size * this.scale,
        false
      );
    }
  }
}
