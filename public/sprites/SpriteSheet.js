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
  _undoPtr = 0;
  _current = 0;
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

  constructor(data, { ctx, scale = 2, subSprites } = {}) {
    super();

    this.data = new Uint8Array(pixelLength * 4 * 16);
    this.data.set(data.slice(0, pixelLength * 4 * 16), 0);

    for (let i = 0; i < this.data.length; i += pixelLength) {
      const spriteData = this.data.subarray(i, i + pixelLength);
      const sprite = new Sprite(spriteData);
      this.sprites.push(sprite);

      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = ctx.canvas.height = width * scale;
      this.previewCtx.push(ctx);
      sprite.paint(ctx);
    }

    this.snapshot();
    this.scale = scale;
    this.length = data.length / pixelLength;
    this._current = 0;
    this.ctx = ctx;
    this.ctx.canvas.dataset.scale = this.scale;
    this.subSprites = subSprites; // used to preview 8x8 sprites

    window.sprites = this;
    palette.updateCounts();
    this.renderSubSprites(0);
    this.trigger();
  }

  serialize() {
    return {
      filename: this.filename,
      data: Array.from(this.data),
    };
  }

  getCoords(e) {
    return getCoords(e, 512 / this.defaultScale);
  }

  copy() {
    // FIXME support partial copy/clip //{ x = 0, y = 0, w = width, h = width }
    this.clipboard = new Sprite(new Uint8Array(this.sprite.pixels));
    this.clipboard.subSprite = this.sprite.subSprite;
  }

  paste() {
    if (this.clipboard.pixels) {
      // debugger;
      let pixels = this.clipboard.pixels;
      let offset = this._current * pixelLength;
      if (this.defaultScale === 8) {
        const i = this.clipboard.subSprite * 64;
        pixels = new Uint8Array(pixels.slice(i, i + 64));
        offset = this._current * pixelLength + this.sprite.subSprite * 64;
      }
      this.set(pixels, offset);
      if (this.defaultScale === 8) {
        // this.renderSubSprites();
      }
    }
  }

  set(data, offset = this._current * pixelLength) {
    // FIXME support partial paste
    this.snapshot();
    this.data.set(data, offset);
    this.rebuild(this._current);
    this.paint();
  }

  snapshot() {
    this.history.splice(this._undoPtr + 1);
    this.history.push(new Uint8Array(this.data));
    this._undoPtr = this.history.length - 1;
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

  undo() {
    const data = this.history[this._undoPtr];

    if (!data) {
      return;
    }
    this._undoPtr--;

    this.data = data;
    const subSprite = this.sprite.subSprite;
    const toggle = this.sprite.scale === 8;

    for (let i = 0; i < this.length; i++) {
      this.rebuild(i);
    }
    this.sprite.subSprite = subSprite;
    if (toggle) this.sprite.toggleScale();

    this.trigger();
    this.paint();
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
      sprite.paint(this.previewCtx[i]);
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
    return this.sprites[this._current].pget({
      ...args,
      scale: this.defaultScale,
    });
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

    this.trigger();
    this.paint(value, true);
  }

  setSubSprite(index) {
    this.sprite.subSprite = index;
    this.sprite.render();
    this.trigger();
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
    });
    const w = 16;
    const [x, y] = this.miniCoords[subSprite];

    sprite.paint(this.previewCtx[i], {
      scale: 8,
      subSprite,
      w,
      x,
      y,
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

  toggleScale(paintSubSprites = true) {
    this.setScale(this.defaultScale === 8 ? 16 : 8, paintSubSprites);
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
      this.paint(i);
    }
    this.paint(current); // crappy but works
  }

  paint(i = this._current, allSubSprites = false) {
    const sprite = this.sprites[i];
    sprite.paint(this.ctx, {
      scale: this.defaultScale,
      subSprite: sprite.subSprite,
    }); // paint the preview

    if (this.defaultScale === 8) {
      if (allSubSprites) {
        this.renderSubSprites(i);
      } else {
        this.renderSubSprite(sprite.subSprite, i);
      }
    } else {
      // paint into the sprite sheet
      sprite.paint(this.previewCtx[i], { scale: 16 });
    }

    this.getPreviewElements().map((_) => _.classList.remove('focus'));
    this.previewCtx[i].canvas.classList.add('focus');
  }
}
