import Sprite from './Sprite.js';
import Hooks from '../lib/Hooks.js';
import { width, pixelLength, getCoords } from './sprite-tools.js';

export default class SpriteSheet extends Hooks {
  sprites = [];
  previewCtx = [];
  history = [];
  ctx = null;
  _undoPtr = 0;
  _current = 0;
  length = 0;
  clipboard = null;
  defaultScale = 16; // 8 = 8x8

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
    this.length = data.length / pixelLength;
    this._current = 0;
    this.scale = scale;
    this.ctx = ctx;
    this.ctx.canvas.dataset.scale = this.scale;
    this.subSprites = subSprites; // used to preview 8x8 sprites

    window.sprites = this;
    this.renderSubSprites();
    this.trigger();
  }

  serialize() {
    return {
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
    sprite.paint(this.previewCtx[i]);
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
      console.log('current not being set', value, this._current);

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

  renderSubSprites() {
    const sprite = this.sprite;
    if (this.defaultScale === 16) return;

    for (let i = 3; i >= 0; i--) {
      sprite.subSprite = i;
      // sprite.render();
      sprite.paint(this.subSprites[i], { scale: 8, subSprite: i });
    }
  }

  setScale(scale) {
    this.defaultScale = scale;
    this.sprite.scale = scale;

    // forces a recalc repaint
    const current = this._current;
    this._current = null;
    this.current = current;

    if (scale === 8) {
      this.renderSubSprites();
    }

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

  paint(i = this._current, allSubSprites = false) {
    const sprite = this.sprites[i];
    sprite.paint(this.ctx, {
      scale: this.defaultScale,
      subSprite: sprite.subSprite,
    }); // paint the preview

    // paint into the sprite sheet
    sprite.paint(this.previewCtx[this._current], { scale: 16 });

    if (this.defaultScale === 8) {
      if (allSubSprites) {
        this.renderSubSprites();
      } else {
        sprite.paint(this.subSprites[sprite.subSprite], {
          scale: 8,
          subSprite: sprite.subSprite,
        });
      }
    }

    this.getPreviewElements().map((_) => _.classList.remove('focus'));
    this.previewCtx[this._current].canvas.classList.add('focus');
  }
}
