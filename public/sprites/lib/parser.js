import PNG from './png.js';
import BMP from './bmp.js';
import { toRGB332 } from './colour.js';

const p = 16; // 16x16 sprite

const pngSig = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];

const bmpSig = [66, 77];

export function decode(file) {
  const { isPNG, isBMP } = detect(file);

  if (isPNG) {
    return png(file);
  }

  if (isBMP) {
    return bmp(file);
  }

  return file;
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

export function bmp(file) {
  const bmp = new BMP(file);
  const pixels = bmp.data;
  return transform({ pixels, width: bmp.width, alphaFirst: true });
}

export function pngNoTransformFile(file) {
  const { isPNG } = detect(file);

  if (!isPNG) {
    throw new Error('not supported (yet)');
    // assume this is a sprite and chunk it to be ordered like a png
    console.log(file.length);

    // const length = 4 * 16;
    const width = 16 * 16;
    const data = new Uint8Array(file.length);
    for (let i = 0; i < file.length; i += 1) {
      // file is the sprite data, arrayed in 16x16 px all in a row

      const x = (i / 16) | 0;

      // 0-15 = sp1, 16-31 = sp2, 32-63 = sp3
      const spriteIndex = (i / 256) | 0;
      const pxOffset = 256 * spriteIndex + (i % 16);

      const spritePx = (i % 16) + 256;

      const ptr =
        (((i % 16) + 256 * ((i / 16) | 0)) % 4096) + 16 * ((i / 256) | 0);

      if (i >= 4096 && i < 4096 + 256) console.log({ ptr, i });

      // data[ptr] = file[i];
      data[i] = file[ptr];
    }
    return {
      data,
      png: { width: 16 * 16, height: 4 * 16 },
    };
  }
  const png = new PNG(file);
  const pixels = png.decode();
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
      res.push(toRGB332(r, g, b));
    }
  }

  return { data: new Uint8Array(res), png };
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
      // transparent
      res.push(0xe3);
    } else {
      res.push(toRGB332(r, g, b));
    }
  }

  return new Uint8Array(res);
}
