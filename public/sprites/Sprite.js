import { width, xyToIndex, emptyCanvas } from './sprite-tools.js';
import { transparent } from './lib/colour.js';
import palette from './Palette';

/**
 * @class
 */
export default class Sprite {
  scale = width;
  _lastIndex = null;
  cachedSource = [];

  /**
   * @param {Uint8Array} pixels
   */
  constructor(pixels) {
    this.pixels = pixels;
    this.ctx = document.createElement('canvas').getContext('2d');
    this.ctx.canvas.width = this.ctx.canvas.height = width;
    this.render();
    this.subSprite = 0;
  }

  /** @type {number} */
  set subSprite(value) {
    this._subSprite = value;
    document.body.dataset.subSprite = value;
  }

  /** @type {number} */
  get subSprite() {
    return this._subSprite;
  }

  /** @type {HTMLCanvasElement} */
  get canvas() {
    return this.ctx.canvas;
  }

  /**
   * Gets the pixel at given X/Y (or index)
   *
   * @param {object} options
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} [options.index]
   * @param {number} [options.scale=this.scale]
   * @returns {number} Pixel value at given position
   */
  pget({ index = null, x = null, y, scale = this.scale }) {
    index = xyToIndex({ x, y, w: scale });

    if (scale === 8) {
      index += this.subSprite * 64;
    }

    return this.pixels[index];
  }

  /**
   * Sets the pixel at given X/Y (or index) to `value`
   *
   * @param {object} options
   * @param {number} options.value
   * @param {number} options.x
   * @param {number} options.y
   * @param {number} [options.index]
   * @param {number} [options.scale=this.scale]
   */
  pset({ index = null, x = null, y, value, scale = this.scale }) {
    index = xyToIndex({ x, y, w: scale });

    const key = index + ':' + value;
    if (key === this._lastIndex) return;
    this._lastIndex = key;

    if (scale === 8) {
      index += this.subSprite * 64;
    }

    this.pixels[index] = value;
    this.render();
  }

  clear() {
    if (this.scale === 16) {
      this.pixels.fill(transparent);
    } else {
      const empty = new Uint8Array(64);
      empty.fill(transparent);
      this.pixels.set(empty, 64 * this.subSprite);
    }
    this.render();
  }

  /**
   *
   * @param {boolean} fourBit
   * @returns {Uint8Array}
   */
  getData(fourBit = false) {
    if (!fourBit) {
      return this.pixels;
    }

    const data = new Uint8Array(16 * 8);
    this.pixels.forEach((byte, ptr) => {
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

  mirror(horizontal = true) {
    return new Promise((resolve) => {
      this.render();
      const i = new Image();
      const url = this.canvas.toDataURL(); // needed over a blob because blob is apparently a reference
      i.src = url;
      i.onload = () => {
        this.ctx.clearRect(0, 0, width, width);
        this.ctx.save();
        if (horizontal) {
          this.ctx.scale(-1, 1);
          this.ctx.drawImage(i, 0, 0, -width, width); //, -width, 0);
        } else {
          this.ctx.scale(1, -1);
          this.ctx.drawImage(i, 0, 0, width, -width);
        }
        this.ctx.restore();
        this.canvasToPixels();
        resolve();
      };
    });
  }

  rotate() {
    return new Promise((resolve) => {
      this.render();
      const i = new Image();
      const url = this.canvas.toDataURL(); // needed over a blob because blob is apparently a reference
      i.src = url;
      document.body.appendChild(i);
      i.onload = () => {
        this.ctx.clearRect(0, 0, width, width);
        this.ctx.translate(width / 2, width / 2);
        this.ctx.rotate((90 * Math.PI) / 180); // 90deg
        this.ctx.drawImage(i, -width / 2, -width / 2);
        this.ctx.rotate((-90 * Math.PI) / 180);
        this.ctx.translate(-width / 2, -width / 2);
        this.canvasToPixels();
        resolve();
      };
    });
  }

  canvasToPixels() {
    this.cachedSource = [];
    const imageData = this.ctx.getImageData(0, 0, width, width);
    for (let i = 0; i < imageData.data.length / 4; i++) {
      const [r, g, b, a] = imageData.data.slice(i * 4, i * 4 + 4);

      if (a === 0) {
        this.pixels[i] = transparent;
      } else {
        this.pixels[i] = palette.getFromRGB({ r, g, b });
      }
    }
  }

  render({
    x = 0,
    y = 0,
    subSprite = this.subSprite,
    scale = this.scale,
    ctx = this.ctx,
  } = {}) {
    const pixels = this.pixels;

    // imageData is the internal copy
    const width = scale;
    const imageData = this.ctx.getImageData(0, 0, width, width);

    let i = 0;
    let j = pixels.length;
    if (scale === 8) {
      i = subSprite * 64;
      j = i + 64;
    }

    let ptr = 0;

    for (i; i < j; i++) {
      let index = pixels[i];

      const { r, g, b, a } = palette.getRGB(index);
      imageData.data[ptr * 4 + 0] = r;
      imageData.data[ptr * 4 + 1] = g;
      imageData.data[ptr * 4 + 2] = b;
      imageData.data[ptr * 4 + 3] = a * 255;
      ptr++;
    }

    if (x !== 0 || y !== 0) {
      emptyCanvas(ctx);
    }

    ctx.putImageData(imageData, x, y, 0, 0, imageData.width, imageData.height);
    this.cachedSource = [];
  }

  // we always paint square…
  paint(ctx, { x = 0, y = 0, w = null, scale = null, subSprite = null } = {}) {
    if (w === null) {
      w = ctx.canvas.width;
    }

    // clear, set to jaggy and scale to canvas
    ctx.clearRect(x, y, w, w);
    ctx.imageSmoothingEnabled = false;

    let source = this.ctx.canvas;

    if (this.cachedSource[subSprite]) {
      source = this.cachedSource[subSprite];
    } else if (scale) {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = scale;
      ctx.canvas.height = scale;
      this.render({ ctx, scale, subSprite });
      source = ctx.canvas;
      this.cachedSource[subSprite] = source;
    }

    ctx.drawImage(source, 0, 0, source.width, source.height, x, y, w, w);
  }
}
