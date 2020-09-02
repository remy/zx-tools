import PNG from './png.js';
import BMP from '../../lib/bmp.js';
import { toRGB332, transparent } from './colour.js';
import { toBinary } from '../../lib/to';

const p = 16; // 16x16 sprite
const encode = (s) => new TextEncoder().encode(s);
const pngSig = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
const bmpSig = [66, 77];
const gifSig = encode('GIF89a');

export function decode(file) {
  const { isPNG, isBMP } = detect(file);

  if (file.length === 768 || file.length === 768 + 128) {
    if (confirm('Is this a binary font file?')) {
      if (file.length > 768) {
        file = file.slice(128);
      }
      return font(file);
    }
  }

  if (isPNG) {
    return png(file);
  }

  if (isBMP) {
    return bmp(file);
  }

  return file;
}

export function pixelsFromFile(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = img.width;
      ctx.canvas.height = img.height;

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imageData = ctx.getImageData(
        0,
        0,
        ctx.canvas.width,
        ctx.canvas.height
      );
      const pixels = imageData.data;
      const res = [];
      for (let i = 0; i < pixels.length; i += 4) {
        const [r, g, b, a] = [
          pixels[i + 0],
          pixels[i + 1],
          pixels[i + 2],
          pixels[i + 3],
        ];

        if (a === 0 || r === undefined) {
          // transparent
          res.push(0xe3);
        } else {
          res.push(toRGB332({ r, g, b }));
        }
      }

      resolve({
        data: new Uint8Array(res),
        width: ctx.canvas.width,
        height: ctx.canvas.height,
      });
    };

    img.onerror = reject;
    img.src = url;
  });
}

export function importable(data) {
  let known = [pngSig, gifSig, bmpSig];
  const length = Math.max(...known.map((_) => _.length));

  for (let i = 0; i < length; i++) {
    known = known.filter((sig) => data[i] === sig[i]);
    if (known.length === 0) {
      break;
    }
  }

  return known.length;
}

export function detect(file) {
  let isPNG = true;
  let isBMP = true;
  for (let i = 0; i < Math.max(pngSig.length, bmpSig.length); i++) {
    if (file[i] !== bmpSig[i]) {
      isBMP = false;
    }
    if (file[i] !== pngSig[i]) {
      isPNG = false;
      break;
    }
  }

  return { isPNG, isBMP };
}

function font(file) {
  const res = new Uint8Array(256 * 4 * 16);
  res.fill(transparent);
  for (let i = 0; i < file.length; i++) {
    const binary = toBinary(file[i]).split('');
    for (let j = 0; j < 8; j++) {
      if (binary[j] === '1') {
        res[i * 8 + j] = 0;
      } else {
        // res.push(transparent);
      }
    }
  }

  return res;
}

export function bmp(file) {
  const bmp = new BMP(file);
  const pixels = bmp.data;

  return transform({ pixels, width: bmp.width, alphaFirst: true });
}

const fn = (i) => {
  const COLS = 8;
  const x = i % COLS;
  const y = (i / COLS) | 0;

  return 8 * y + x;
};

const fn8 = (i) => {
  return (((i % 16) + 256 * ((i / 16) | 0)) % 4096) + 16 * ((i / 256) | 0);
};

/**
 *
 * @param {Uint8Array} data
 * @param {File} file
 * @returns {Uint8Array}
 */
export function parseNoTransformFile(data, file) {
  const known = importable(data);

  if (known || file.type.includes('image/')) {
    return pixelsFromFile(file);
  }

  // alert('spr import has limited support');

  // const type = confirm(
  //   'How are the sprites arranged? OK = 16x16, Cancel = 8x8'
  // );

  let type = true;

  let res = null;
  let width = 16 * 16;
  let height = 4 * 16;
  if (!type) {
    // rearrange the pixels
    width = 8;
    height = 256 * 8;
    res = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      res[i] = data[fn(i)];
    }
  } else {
    res = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      res[i] = data[fn8(i)];
    }
  }

  return {
    data: res,
    width,
    height,
  };
}

export function png(file) {
  const png = new PNG(file);
  const pixels = png.decode();
  return transform({ pixels, width: png.width });
}

export function transform({ pixels, width, alphaFirst = false }) {
  // let tmp = null;

  const res = [];

  let [ri, gi, bi, ai] = [0, 1, 2, 3];
  if (alphaFirst) {
    [ai, bi, gi, ri] = [0, 1, 2, 3];
  }

  let n = 1;

  if (width / 16 === ((width / 16) | 0)) {
    n = width / 16;
  } else {
    // throw new Error('unsupported dimension');
    const d = width % 16;
    n = (width + (16 - d)) / 16;
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const row = ((i / 4 / p) | 0) % p;
    const offset = (i / 4) % p;
    const spriteIndex = (i / 4 / (p * p)) | 0;

    const spriteRow = ((spriteIndex / n) | 0) * (p * p * n);
    let dataIndex = spriteRow;
    dataIndex += spriteIndex * p;
    dataIndex += row * width;
    dataIndex += offset;
    dataIndex *= 4;

    // NOTE I don't fully understand how this works, but it does after
    // lots of testing...
    dataIndex -= p * 4 * ((spriteIndex / n) | 0) * n;

    const [r, g, b, a] = [
      pixels[dataIndex + ri],
      pixels[dataIndex + gi],
      pixels[dataIndex + bi],
      pixels[dataIndex + ai],
    ];

    if (a === 0 || r === undefined) {
      res.push(transparent);
    } else {
      res.push(toRGB332({ r, g, b }));
    }
  }

  return new Uint8Array(res);
}
