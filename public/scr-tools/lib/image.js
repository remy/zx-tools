import Zoom from './Zoom.js';

export default function main(image) {
  return imageToBlob(image).then(fileToBinary);
}

export function contrast(imageData, contrast = 50) {
  const data = imageData.data;
  contrast = contrast / 100 + 1; //convert to decimal & shift range: [0..2]
  const intercept = 128 * (1 - contrast);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * contrast + intercept;
    data[i + 1] = data[i + 1] * contrast + intercept;
    data[i + 2] = data[i + 2] * contrast + intercept;
  }
  return imageData;
}

export function threshold(data, _, threshold = _) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const test = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    const v = test >= threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = v;
  }

  invertPotentialInk(data);

  return data;
}

export function invertPotentialInk(imageData) {
  const zoom = new Zoom(imageData);
  for (let y = 0; y < 192 / 8; y++) {
    for (let x = 0; x < 256 / 8; x++) {
      const block = zoom.pixel(x, y);

      let inkCount = 0;
      for (let i = 0; i < 8 * 8 * 4; i += 4) {
        if (block[i] === 0) {
          // black = ink
          inkCount = inkCount + 1;
        }
      }

      if (inkCount < 32) {
        // flip
        for (let i = 0; i < 8 * 8 * 4; i += 4) {
          const c = block[i] === 0 ? 255 : 0;
          block[i] = block[i + 1] = block[i + 2] = c;
        }
      }
    }
  }
  return imageData;
}

function crop(
  source = { width: 0, height: 0 },
  destination = { width: 0, height: 0 }
) {
  // result:
  let x = 0;
  let y = 0;

  // which is longest side
  let longest = 'width';
  let shortest = 'height';
  if (destination.width < destination.height) {
    [longest, shortest] = [shortest, longest];
  }

  // get divisor
  const d = source[longest] / destination[longest]; // FIXME does this work for scaling up?

  const width = (destination.width * d) | 0;
  const height = (destination.height * d) | 0;

  if (longest === 'height') {
    x = (source[shortest] - width) / 2;
  } else {
    y = (source[shortest] - height) / 2;
  }

  return { x, y, width, height };
}

export function imageToCanvas(
  img,
  scale = { width: img.width, height: img.height }
) {
  const canvas = document.createElement('canvas');
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  canvas.width = scale.width;
  canvas.height = scale.height;

  const { x, y, height, width } = crop(img, canvas);

  ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);

  return ctx;
}

export function imageToPixels(img, scale) {
  const ctx = imageToCanvas(img, scale);
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}

export async function imageToBlob(img, ctx = imageToCanvas(img)) {
  return new Promise(resolve => {
    const canvas = ctx.canvas;
    canvas.toBlob(file => resolve(file));
  });
}

export function fileToBinary(file) {
  return new Promise(resolve => {
    const reader = new window.FileReader();
    reader.onloadend = () => resolve(new Uint8Array(reader.result));
    reader.readAsArrayBuffer(file);
  });
}
