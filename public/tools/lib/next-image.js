import { rgbFromIndex, rgbFromNext } from '../../sprites/lib/colour';
import { Palette } from '../../sprites/Palette';

/**
 * @param {File} file
 * @param {Uint8Array} data
 * @param {Palette} pal
 * @param {HTMLElement} container
 */
export function renderImageFromNextFormat(file, data, pal, container) {
  const ext = file.name.split('.').pop().toLowerCase();

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  let w = 0;
  let h = 0;

  if (ext === 'slr') {
    if (data.length === 12288 + 128) {
      // includes +3dos header - drop it
      data.splice(0, 128);
    }

    if (data.length === 12288) {
      w = 128;
      h = 96;
    }
  }

  if (ext === 'sl2') {
    if (data.length === 49152 + 128) {
      // includes +3dos header - drop it
      data.splice(0, 128);
    }

    if (data.length === 49152) {
      w = 256;
      h = 192;
    }
  }

  if (ext === 'nxi' || ext === 'bin') {
    // check file length

    if (data.length === 49664) {
      // we have the palette at the front
      pal.import({ name: 'untitled.pal' }, data.slice(0, 512));
      w = 256;
      h = 192;
    } else if (data.length === 49152) {
      w = 256;
      h = 192;
    } else {
      const width = prompt('Width of image data (in pixels)', '256');
      if (!width) return;
      w = parseInt(width, 10);
      h = data.length / w;
    }
  }

  if (!w) return;

  canvas.width = w;
  canvas.height = h;

  const imageData = ctx.getImageData(0, 0, w, h);

  for (let i = 0; i < data.length; i++) {
    const p = pal.get(data[i]);
    const rgba = rgbFromNext(p);

    imageData.data[i * 4] = rgba.r;
    imageData.data[i * 4 + 1] = rgba.g;
    imageData.data[i * 4 + 2] = rgba.b;
    imageData.data[i * 4 + 3] = rgba.a;

    if (pal.transparency.includes(p)) {
      imageData.data[i * 4 + 3] = 0;
    }
  }

  ctx.putImageData(imageData, 0, 0);

  container.appendChild(canvas);
}
