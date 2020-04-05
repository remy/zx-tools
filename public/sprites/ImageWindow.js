import { $ } from '../lib/$.js';
import { colourTable, emptyCanvas, getCoords } from './SpriteSheet.js';
import trackDown from '../lib/track-down.js';
import { toRGB332 } from './lib/colour.js';

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

    trackDown(ctx.canvas, {
      start: (e) => this.start(e),
      handler: (e) => this.pan(e),
      end: (e) => this.end(e),
    });

    this.render(this.__ctx, data);
    // this.zoom = 10;
  }

  get zoom() {
    return this.zoomFactor;
  }

  set zoom(value) {
    this.zoomFactor = value;
    if (this.zoomFactor > 15) {
      this.zoomFactor = 15;
    }
    this.parent.dataset.zoom = this.zoomFactor;
    this.paint();
  }

  get pxScale() {
    if (this.zoomFactor >= 10) {
      return 1;
    }
    return 16 / (this.zoomFactor + 1) / 2;
  }

  start(event) {
    const coords = getCoords(event, this.pxScale);
    this._coords = {
      x: coords.x,
      y: coords.y,
      curX: this.x,
      curY: this.y,
    };
  }

  end(event) {
    const scale = this.pxScale;
    const coords = getCoords(event, scale);
    this.x = (this._coords.curX + (coords.x - this._coords.x) * scale) | 0;
    this.y = (this._coords.curY + (coords.y - this._coords.y) * scale) | 0;
    console.log('end', this.x, this.y);

    this.paint();
  }

  shiftX(neg = false) {
    this.x += neg ? -1 : 1;
    this.paint();
  }
  shiftY(neg = false) {
    this.y += neg ? -1 : 1;
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

  copy() {
    const data = new Uint8Array(16 * 16);
    const ctx = this.__ctx;
    const { width, height } = ctx.canvas;
    const scale = this.pxScale;

    const x = this.x - scale * 8;
    const y = this.y - scale * 8;
    console.log({ x, y, xo: this.x, yo: this.y });

    const imageData = ctx.getImageData(
      // (width - 16) / 2 + this.x,
      // (height - 16) / 2 + this.y,
      -x,
      -y,
      16,
      16
    );

    for (let i = 0; i < data.length; i++) {
      const [r, g, b, a] = imageData.data.slice(i * 4, i * 4 + 4);
      const index = toRGB332(r, g, b);
      if (index === 0xe3 || a === 0) {
        data[i] = 0xe3;
      } else {
        data[i] = index;
      }
    }

    if (this.oncopy) this.oncopy(data);
  }

  paint(x = this.x, y = this.y) {
    const scale = this.pxScale;
    const zoom = this.zoomFactor * 16;
    this.status.innerHTML = `Zoom: ${this.zoomFactor}<br>X/Y: ${
      x - scale * 8
    }/${y - scale * 8}`;
    const ctx = this.ctx;
    emptyCanvas(ctx);
    const w = ctx.canvas.width;
    ctx.clearRect(0, 0, w, w);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.__ctx.canvas,
      -x,
      -y,
      512 / (this.zoomFactor + 1),
      512 / (this.zoomFactor + 1),
      0,
      0,
      w,
      w
    );
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
