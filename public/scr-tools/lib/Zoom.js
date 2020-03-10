function getIndexForXY(width, x, y) {
  return width * y + x;
}

let order = 1;

export default class Zoom {
  constructor(buffer, target = document.body, id) {
    this.target = target;
    this.order = order++;
    this.id = id || `zoom-${this.order}`;
    if (buffer instanceof HTMLImageElement) {
      const img = buffer;
      const canvas = document.createElement('canvas');
      target.appendChild(canvas);
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = (buffer = canvas.getContext('2d'));
      ctx.drawImage(img, 0, 0);
      img.parentNode.replaceChild(canvas, img);
    }

    if (buffer instanceof CanvasRenderingContext2D) {
      const ctx = (this.sourceCtx = buffer);
      this.buffer = buffer.getImageData(
        0,
        0,
        buffer.canvas.width,
        buffer.canvas.height
      ).data;
      ctx.canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        ctx.canvas.style.background = `url(${url}) no-repeat`;
        ctx.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height);
      });
    } else {
      this.buffer = buffer instanceof ImageData ? buffer.data : buffer;
    }
    this.isVisible = false;
    this._last = null;
  }

  makeVisible(target = this.target) {
    const canvas = document.createElement('canvas');
    canvas.className = 'zoom';
    canvas.id = this.id;
    target.appendChild(canvas);
    this.ctx = canvas.getContext('2d');

    const scale = 20;
    const w = (canvas.width = 8);
    const h = (canvas.height = 8);
    canvas.style.imageRendering = 'pixelated';
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    canvas.style.setProperty('--order', this.order);
    this.isVisible = true;

    return this;
  }

  put(imageData) {
    const ctx = this.ctx;
    ctx.putImageData(imageData, 0, 0);
  }

  seeXY(x, y) {
    const key = `${x}x${y}`;
    if (key === this._last) return;
    this._last = key;
    if (!this.isVisible) this.makeVisible();
    const imageData = new ImageData(this.pixel(x, y), 8, 8);
    this.ctx.putImageData(imageData, 0, 0);

    if (this.sourceCtx) {
      const ctx = this.sourceCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(x * 8 + 0.5, y * 8 + 0.5, 8, 8);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(x * 8 - 0.5, y * 8 - 0.5, 8, 8);
    }
  }

  pixel(x = 0, y = 0) {
    const sourceWidth = 256;
    const width = 8;
    const height = 8;
    const source = this.buffer;

    const data = new Uint8ClampedArray(width * height * 4);

    const print = false; //x === 31 && y === 23;

    for (let i = 0; i < height; i++) {
      const j = getIndexForXY(sourceWidth, x * 8, y * 8 + i);
      const index = j * 4;
      const end = index + width * 4;
      const offset = i * width * 4;
      if (print) {
        console.log(
          'j: %s, index: %s, end: %s',
          j,
          index,
          end,
          x * 8,
          i,
          source.subarray(index, end)
        );
      }
      data.set(source.slice(index, end), offset);
    }

    return data;
  }
}
