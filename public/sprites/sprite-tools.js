import { rgbFromIndex } from './lib/colour.js';

export const width = 16;
export const pixelLength = 256;

export const colourTable = Array.from({ length: pixelLength }, (_, i) => {
  return rgbFromIndex(i);
});

export function xyToIndex({ x, y, w = width, h = w }) {
  if (x < 0) {
    return null;
  }

  if (x >= w) {
    return null;
  }

  if (y >= h) {
    return null;
  }

  return w * y + x;
}

export function getCoords(e, w = width, h = w) {
  const rect = e.target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / w) | 0; //x position within the element.
  const y = ((e.clientY - rect.top) / h) | 0; //y position within the element.
  const index = xyToIndex({ x, y, w: 16, h });
  return { x, y, index };
}

export function emptyCanvas(ctx) {
  const blankData = new Uint8ClampedArray(
    ctx.canvas.width * ctx.canvas.height * 4
  );
  // blankData.fill(transparent);
  for (let i = 0; i < blankData.length; i += 4) {
    blankData[i + 0] = 0;
    blankData[i + 1] = 0;
    blankData[i + 2] = 0;
    blankData[i + 3] = 0;
  }

  const blank = new ImageData(blankData, ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(blank, 0, 0);
}
