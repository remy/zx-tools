import { $ } from '../lib/$.js';
import { colourTable, emptyCanvas, getCoords } from './sprite-tools.js';
import trackDown from '../lib/track-down.js';
import { toRGB332 } from './lib/colour.js';

/**
 * @class
 */
export default class ImageWindow {
  zoomFactor = 0;
  x = 0;
  y = 0;

  constructor(data, ctx, width, height) {
    this.ctx = ctx;
    this.__ctx = document.createElement('canvas').getContext('2d');
    this.__ctx.canvas.width = width;
    this.__ctx.canvas.height = height;
    this.parent = ctx.canvas.parentNode;
    this.status = $('#png-status');

    this.dimensions = 16;

    trackDown(ctx.canvas, {
      start: (e) => this.start(e),
      handler: (e) => this.pan(e),
      end: (e) => this.end(e),
    });

    this.render(this.__ctx, data);
    // this.zoom = 0;
    this.zoom = 2;
    this.y = this.x = 0;
    this.paint();
  }

  get zoom() {
    return this.zoomFactor;
  }

  set zoom(value) {
    const preZoomDelta = this.zoomDelta;
    this.zoomFactor = value;
    if (this.zoomFactor > 4) {
      this.zoomFactor = 4;
    }

    if (this.zoomFactor < -3) {
      this.zoomFactor = -3;
    }

    this.parent.dataset.zoom = this.zoomFactor;

    const delta = this.zoomDelta - preZoomDelta;
    this.x += delta;
    this.y += delta;

    this.paint();
  }

  /**
   * @param {number} size
   */
  set dimensions(size) {
    this._dimensions = size;
    this.parent.dataset.dimensions = size;
  }

  get dimensions() {
    return this._dimensions;
  }

  get pxScale() {
    if (this.zoomFactor >= 3) {
      return 1;
    }
    return 16 / (this.zoomFactor + 1) / 2;
  }

  get zoomDelta() {
    return (0xff >> (this.zoomFactor + 3)) << 3;
  }

  coords(x = this.x, y = this.y) {
    const delta = this.zoomDelta;
    return {
      x: Math.abs(x - delta),
      y: Math.abs(y - delta),
    };
  }

  start(event) {
    const coords = getCoords(event, this.pxScale);
    this.parent.dataset.dragging = true;
    this._coords = {
      x: coords.x,
      y: coords.y,
      curX: this.x,
      curY: this.y,
    };
  }

  end(event) {
    this.parent.dataset.dragging = false;
    const scale = this.pxScale;
    const coords = getCoords(event, scale);
    this.x = (this._coords.curX + (coords.x - this._coords.x) * scale) | 0;
    this.y = (this._coords.curY + (coords.y - this._coords.y) * scale) | 0;

    this.paint();
  }

  shiftX(neg = false, n = 1) {
    this.x += neg ? -n : n;
    this.paint();
  }

  shiftY(neg = false, n = 1) {
    this.y += neg ? -n : n;
    this.paint();
  }

  pan(event) {
    if (event.type === 'click') {
      return;
    }
    const scale = this.pxScale;
    const coords = getCoords(event, scale);
    const x = this.x + (coords.x - this._coords.x) * scale;
    const y = this.y + (coords.y - this._coords.y) * scale;
    this.paint(x | 0, y | 0);
  }

  /**
   * @param {boolean} [as8x8=false]
   * @param {boolean|Uint8Array} [over=false]
   */
  copy(as8x8 = false, over = false) {
    const dim = this.dimensions;
    const ctx = this.__ctx;

    const ittr = (dim / 16) ** 2;
    const a = dim / 16;

    let { x, y } = this.coords();

    const adjust = (dim - 16) / 2;
    x -= adjust;
    y -= adjust;

    for (let j = 0; j < ittr; j++) {
      const data = over || new Uint8Array(16 * 16);
      const xa = (j % a) * 16;
      const ya = ((j / a) | 0) * 16;

      console.log({ x, y, xa, ya });

      const imageData = ctx.getImageData(x + xa, y + ya, 16, 16);

      for (let i = 0; i < data.length; i++) {
        let j = i;
        if (as8x8) {
          j =
            112 * Math.floor(i / 128) +
            16 * Math.floor((i % 64) / 8) +
            8 * Math.floor(i / 64) +
            (i % 8);
        }
        const [r, g, b, a] = imageData.data.slice(j * 4, j * 4 + 4);
        const index = toRGB332({ r, g, b });

        if (index === 0xe3 || a === 0) {
          if (!over) data[i] = 0xe3;
        } else {
          data[i] = index;
        }
      }

      if (this.oncopy) this.oncopy(data, j);
    }
  }

  paint(x = this.x, y = this.y) {
    const zoom =
      this.zoomFactor < 0
        ? 512 << (this.zoomFactor * -1)
        : 512 >> this.zoomFactor;

    const localCords = this.coords(x, y);
    this.status.innerHTML = `Zoom: ${5 - this.zoomFactor}:1<br>X/Y: ${
      localCords.x
    }/${localCords.y}`;
    const ctx = this.ctx;
    emptyCanvas(ctx);
    const w = ctx.canvas.width;
    ctx.clearRect(0, 0, w, w);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.__ctx.canvas, -x, -y, zoom, zoom, 0, 0, w, w);
  }

  render(ctx = this.ctx, pixels) {
    const imageData = ctx.getImageData(
      0,
      0,
      ctx.canvas.width,
      ctx.canvas.height
    );

    for (let i = 0; i < imageData.data.length / 4; i++) {
      let index = pixels[i];
      const { r, g, b, a } = colourTable[index];

      imageData.data[i * 4 + 0] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = a * 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }
}
