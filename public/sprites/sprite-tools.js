import { rgbFromIndex } from './lib/colour.js';

export const width = 16;
export const pixelLength = 256;

export const colourTable = Array.from({ length: pixelLength }, (_, i) => {
  return rgbFromIndex(i);
});

export function xyToIndex({ x, y, w = width }) {
  if (x < 0) {
    return null;
  }

  if (x >= w) {
    return null;
  }

  if (y >= w) {
    return null;
  }

  return w * y + x;
}

export function getCoords(e, w = width, h = w) {
  const rect = e.target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / w) | 0; //x position within the element.
  const y = ((e.clientY - rect.top) / h) | 0; //y position within the element.
  const index = xyToIndex({ x, y, w: 16 });
  return { x, y, index };
}
