import Sprite from './Sprite.js';
import Hooks from '../lib/Hooks.js';
import { width, pixelLength, getCoords } from './sprite-tools.js';
import palette from './Palette.js';

/**
 * @class
 */
export default class SpriteSheet extends Hooks {
  /** @type {Sprite[]} */
  sprites = [];
  previewCtx = [];
  history = [];
  ctx = null;
  _current = 0;
  _fourBit = false;
  length = 0;
  clipboard = null;
  defaultScale = 16; // 8 = 8x8
  miniCoords = [
    // note that 16 = 8x8 just scaled @ 2
    [0, 0],
    [16, 0],
    [0, 16],
    [16, 16],
  ];
  /** @type {string} */
  filename = 'untitled.spr';

  constructor(data, { ctx, scale = 2, subSprites, fourBit = false } = {}) {
    super();

    this.data = new Uint8Array(pixelLength * 4 * 16);

    if (fourBit) {
      data.forEach((byte, ptr) => {
        this.data[ptr * 2] = byte >> 4;
        this.data[ptr * 2 + 1] = byte & 0x0f;
      });
    } else {
      this.data.set(data.slice(0, pixelLength * 4 * 16), 0);
    }

    for (let i = 0; i < this.data.length; i += pixelLength) {
      const spriteData = this.data.subarray(i, i + pixelLength);
      const sprite = new Sprite(spriteData);
      this.sprites.push(sprite);

      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = ctx.canvas.height = width * scale;
      this.previewCtx.push(ctx);
      sprite.paint(ctx, { fourBit: this.fourBit });
    }

    this.snapshot();
    this.scale = scale;
    this.length = this.data.length / pixelLength;
    this._current = 0;
    this.ctx = ctx;
    this.ctx.canvas.dataset.scale = this.scale;
    this.subSprites = subSprites; // used to preview 8x8 sprites

    window.sprites = this;
    palette.updateCounts();
    this.renderSubSprites(0);
    this.fourBit = fourBit;

    this.trigger();
  }

  serialize() {
    return {
      filename: this.filename,
      fourBit: this.fourBit,
      data: Array.from(this.getData()),
    };
  }

  /**
   * @returns {boolean}
   */
  get fourBit() {
    return this._fourBit;
  }

  set fourBit(value) {
    this._fourBit = !!value;
    this.paintAll();
  }

  exportAsFont() {
    const chars = 96;
    const data = new Uint8Array(8 * chars);
    let curr = 0;
    let i = 0;
    this.data.slice(0, chars * 8 * 8).forEach((byte, ptr) => {
      const shift = 7 - (ptr % 8);
      curr += (byte === palette.transparent ? 0 : 1) << shift;

      if (shift === 0) {
        data[i] = curr;
        i++;
        curr = 0;
      }
    });

    return data;
  }

  getData() {
    if (!this.fourBit) {
      return this.data;
    }

    const data = new Uint8Array(pixelLength * 4 * 16);
    this.data.forEach((byte, ptr) => {
      const delta = ptr % 2;
      const i = (ptr / 2) | 0;
      if (delta === 0) {
        data[i] = byte << 4;
      } else {
        data[i] += byte & 0x0f;
      }
    });

    return data;
  }

  getCoords(e) {
    return getCoords(e, 512 / this.defaultScale);
  }

  copy() {
    // FIXME support partial copy/clip //{ x = 0, y = 0, w = width, h = width }
    this.clipboard = new Sprite(new Uint8Array(this.sprite.pixels));
    this.clipboard.subSprite = this.sprite.subSprite;
  }

  paste(over = false) {
    if (this.clipboard.pixels) {
      const subSprite = this.sprite.subSprite;
      let pixels = this.clipboard.pixels;
      let offset = this._current * pixelLength;
      if (this.defaultScale === 8) {
        const i = this.clipboard.subSprite * 64;
        pixels = new Uint8Array(pixels.slice(i, i + 64));
        offset = this._current * pixelLength + this.sprite.subSprite * 64;
      }

      if (over) {
        const data = this.data.slice(offset, offset + pixelLength);

        for (let i = 0; i < data.length; i++) {
          if (pixels[i] !== palette.transparent) {
            data[i] = pixels[i];
          }
        }
        pixels = data;
      }

      this.set(pixels, offset);
      if (this.defaultScale === 8) {
        this.sprite.subSprite = subSprite;
        this.paint();
      }
    }
  }

  set(data, offset = this._current * pixelLength) {
    // note: does not support partial paste
    this.snapshot();
    this.data.set(data, offset);
    this.rebuild(this._current);
    this.paint();
  }

  movePalette(from, to) {
    this.snapshot();

    this.data.forEach((value, i) => {
      if (value === from) {
        this.data[i] = to;
      }
    });

    this.paintAll();
    this.trigger();
  }

  swapPalette(from, to) {
    this.snapshot();

    this.data.forEach((value, i) => {
      if (value === from) {
        this.data[i] = to;
      } else if (value === to) {
        this.data[i] = from;
      }
    });

    this.paintAll();
    this.trigger();
  }

  async rotate() {
    this.snapshot();
    await this.sprite.rotate();
    this.trigger();
    this.paint();
  }

  async mirror(horizontal = true) {
    this.snapshot();
    await this.sprite.mirror(horizontal);
    this.trigger();
    this.paint();
  }

  snapshot() {
    // this.history.splice(this._undoPtr + 1);
    // this._undoPtr = this.history.length - 1;
    this.history.push(new Uint8Array(this.data));
    this.trigger();
  }

  undo() {
    const data = this.history.pop();

    if (!data) {
      console.log('undo: no data');

      return;
    }
    // this._undoPtr--;
    // if (this._undoPtr < 0) this._undoPtr = -1;

    this.data = data;
    const subSprite = this.sprite.subSprite;

    for (let i = 0; i < this.length; i++) {
      this.rebuild(i);
    }

    this.sprite.subSprite = subSprite;
    this.trigger();
    this.paint(this._current, true);
    this.sprite.subSprite = subSprite;
  }

  rebuild(i) {
    if (i < 0 || i > this.length) {
      return; // noop
    }
    const subSprite = this.sprite.subSprite;
    const sprite = new Sprite(
      this.data.subarray(i * pixelLength, i * pixelLength + pixelLength)
    );
    this.sprites[i] = sprite;
    this.sprites[i].subSprite = subSprite;
    if (this.defaultScale === 8) {
      this.renderSubSprites(i);
    } else {
      sprite.paint(this.previewCtx[i], { fourBit: this.fourBit });
    }
    this.trigger();
  }

  getPreviewElements() {
    return this.previewCtx.map((_) => _.canvas);
  }

  canvasToPixels() {
    this.sprites[this._current].canvasToPixels();
  }

  pset(coords, value) {
    this.sprites[this._current].pset({
      ...coords,
      value,
      scale: this.defaultScale,
    });
    this.trigger();
    return true;
  }

  pget(args) {
    const pixel = this.sprites[this._current].pget({
      ...args,
      scale: this.defaultScale,
    });

    if (this.fourBit) {
      return pixel % 16;
    }
    return pixel;
  }

  get current() {
    return this._current;
  }

  get sprite() {
    return this.sprites[this._current];
  }

  spriteIndex(scale = this.defaultScale) {
    const i = this._current;
    if (scale === 16) return i;

    return i * 4 + this.sprite.subSprite;
  }

  set current(value) {
    if (value === this._current) {
      return;
    }
    this._current = value;
    if (this.defaultScale === 8) {
      this.sprites[value].subSprite = 0;
      this.sprites[value].scale = 8;
    } else {
      this.sprites[value].scale = 16;
    }

    this.trigger('select');
    this.paint(value, true);
  }

  setSubSprite(index) {
    this.sprite.subSprite = index;
    this.sprite.render({ fourBit: this.fourBit });
    this.trigger('select');
    this.paint();
  }

  get(index) {
    return this.sprites[index];
  }

  renderSubSprite(subSprite, i = this._current) {
    const sprite = this.sprites[i];
    sprite.paint(this.subSprites[sprite.subSprite], {
      scale: 8,
      subSprite,
      fourBit: this.fourBit,
    });
    const w = 16;
    const [x, y] = this.miniCoords[subSprite];

    sprite.paint(this.previewCtx[i], {
      scale: 8,
      subSprite,
      w,
      x,
      y,
      fourBit: this.fourBit,
    });
  }

  renderSubSprites(spriteIndex = this._current) {
    const sprite = this.sprites[spriteIndex];
    if (this.defaultScale === 16) return;

    for (let i = 3; i >= 0; i--) {
      sprite.subSprite = i;
      this.renderSubSprite(i, spriteIndex);
    }
  }

  setScale(scale) {
    if (scale === this.defaultScale) return;

    this.defaultScale = scale;
    this.sprite.scale = scale;

    // re-renders the entire preview sheet
    for (let i = 0; i < this.sprites.length; i++) {
      if (scale === 8) {
        this.renderSubSprites(i);
      } else {
        this.sprites[i].paint(this.previewCtx[i], { scale: 16 });
      }
    }

    // forces a recalc repaint
    const current = this._current;
    this._current = null;
    this.current = current;

    document.body.dataset.scale = this.defaultScale;
  }

  toggleScale() {
    this.setScale(this.defaultScale === 8 ? 16 : 8);
  }

  clear() {
    this.snapshot();
    this.sprites[this._current].clear();
    this.trigger();
    this.paint();
  }

  // paintPreview(i = this._current, allSubSprites = false) {}

  paintAll() {
    const current = this._current;
    for (let i = 0; i < this.sprites.length; i++) {
      this.paint(i, true);
    }
    this.paint(current, true); // crappy but works
  }

  paint(i = this._current, allSubSprites = false) {
    const sprite = this.sprites[i];
    sprite.paint(this.ctx, {
      scale: this.defaultScale,
      subSprite: sprite.subSprite,
      fourBit: this.fourBit,
    }); // paint the preview

    if (this.defaultScale === 8) {
      if (allSubSprites) {
        this.renderSubSprites(i);
      } else {
        this.renderSubSprite(sprite.subSprite, i);
      }
    } else {
      // paint into the sprite sheet
      sprite.paint(this.previewCtx[i], { scale: 16, fourBit: this.fourBit });
    }

    this.getPreviewElements().map((_) => _.classList.remove('focus'));
    this.previewCtx[i].canvas.classList.add('focus');
  }
}
