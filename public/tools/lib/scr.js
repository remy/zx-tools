import {
  brightColours,
  normalColours,
  normalColoursLookup,
  brightColoursLookup,
} from './zx-colour.js';

import Zoom from './Zoom.js';

let toBlink = [];
let blinkOn = false;

function block(
  x = 0,
  y = 0,
  buffer, // expected to be 6912 long (2048 * 3 + 768)
  attribute = buffer.subarray(2048 * 3)[y * 32 + x]
) {
  const start = ((y / 8) | 0) * 2048;
  const pixels = buffer.subarray(start, start + 2048);

  // reminder: paper is binary 0, ink is 1
  const { ink, paper } = readAttributes(attribute);
  const pixel = new Uint8ClampedArray(4 * 8 * 8);
  y = y % 8;

  for (let i = 0; i < 8; i++) {
    const ptr = x + 256 * i + y * 32;
    const byte = pixels[ptr];

    // imageData rgba 8x1
    for (let j = 0; j < 8; j++) {
      // determines bit for i, based on MSb as left most pixel
      const colour = (byte & (1 << (7 - j))) === 0 ? paper : ink;

      const offset = j * 4 + 4 * 8 * i;
      pixel[offset + 0] = colour[0];
      pixel[offset + 1] = colour[1];
      pixel[offset + 2] = colour[2];
      pixel[offset + 3] = 255;
    }
  }

  return pixel;
}

export async function load(url) {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}

async function sleep(ms) {
  // return;
  if (!ms) return;
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function put(ctx, imageData, x, y) {
  ctx.putImageData(imageData, x, y);
  await sleep(0);
}

async function draw(ctx, third, data) {
  const imageData = new Uint8ClampedArray(4 * 8);
  let ctr = 0;
  for (let offset = 0; offset < 8; offset++) {
    for (let line = 0; line < 8; line++) {
      for (let i = 0; i < 32; i++) {
        let j = 0;
        const ptr = ctr++;
        const byte = data[ptr];

        // imageData rgba 8x1
        for (; j < 8; j++) {
          // determines bit for i, based on MSb
          const bit = (byte & (1 << (7 - j))) === 0 ? 0 : 255;

          const offset = j * 4;
          imageData[offset + 0] = bit;
          imageData[offset + 1] = bit;
          imageData[offset + 2] = bit;
          imageData[offset + 3] = 255; // - bit; // alpha
        }
        const x = i * 8;
        const y = (ctx.canvas.height / 3) * third + line * 8 + offset;
        await put(ctx, new ImageData(imageData, 8, 1), x, y);
      }
    }
  }
}

// stream individual whole bytes into the canvas
export async function stream(ctx, byte, index) {
  const third = index >> 11; // 0..2047, 2048..4095, 4096..6143

  if (third === 3) {
    // colour
    const attribs = readAttributes(byte);
    const x = (index % 32) * 8;
    const y = ((index >> 5) % 64) * 8;

    const block = ctx.getImageData(x, y, 8, 8);
    for (let i = 0; i < 8 * 8; i++) {
      const type = block.data[i * 4] === 255 ? 'ink' : 'paper';
      block.data.set(attribs[type], i * 4);
    }

    if (attribs.blink && attribs.ink !== attribs.paper) {
      toBlink.push({
        attribute: byte,
        x: x / 8,
        y: y / 8,
      });
    }

    await put(ctx, block, x, y);

    return;
  }

  const imageData = new Uint8ClampedArray(4 * 8); // 1x8 pixel array

  for (let j = 7; j >= 0; j--) {
    // determines bit for i, based on MSb
    const bit = (byte & (1 << j)) === 0 ? 0 : 255;
    imageData.set([bit, bit, bit, 255], (7 - j) * 4); // place the bits forward
  }

  // build the line based on the 8bit byte
  // for (let j = 0; j < 8; j++) {
  //   // determines bit for i, based on MSb
  //   const bit = (byte & (1 << (7 - j))) === 0 ? 0 : 255;
  //   imageData.set([bit, bit, bit, 255], j * 4);
  // }

  const x = index % 32;
  const y = (((index >> 5) * 8) % 64) + third * 56; // this is the y coord
  const offset = index >> 8;

  // await
  put(ctx, new ImageData(imageData, 8, 1), x * 8, y + offset);
}

export function pixelsForSCR(buffer, ctx) {
  const w = 256;
  const h = 192;
  const pixels = new Uint8ClampedArray(w * h * 4); // 196,608
  for (let y = 0; y < h / 8; y++) {
    for (let x = 0; x < w / 8; x++) {
      const pixel = block(x, y, buffer); // returns 8x8
      ctx.putImageData(new ImageData(pixel, 8, 8), x * 8, y * 8);
    }
  }

  return pixels;
}

export function loadBlinkAttributes(buffer, ctx) {
  toBlink = [];

  // 768
  for (let i = 6144; i <= 6912; i++) {
    const attribute = buffer[i];
    const { ink, paper, blink } = readAttributes(attribute);
    if (blink && ink.join('') !== paper.join('')) {
      const x = i % 32;
      const y = (i >> 5) % 64;

      toBlink.push({
        attribute,
        i,
        x,
        y,
      });
    }
  }

  let timer = null;

  const blink = {
    start: () => {
      timer = setInterval(() => doBlink(ctx, buffer), 333);
    },
    stop: () => {
      return clearInterval(timer);
    },
  };

  return blink;
}

async function colour(ctx, buffer) {
  const attribs = buffer.subarray(2048 * 3);

  for (let i = 0; i < attribs.length; i++) {
    const attribute = attribs[i];
    const { ink, paper, blink } = readAttributes(attribute);

    const x = i % (ctx.canvas.width / 8);
    const y = (i / (ctx.canvas.width / 8)) | 0;

    const pixel = new ImageData(block(x, y, buffer), 8, 8);

    if (blink && ink.join('') !== paper.join('')) {
      toBlink.push({
        attribute,
        x,
        y,
      });
    }

    await put(ctx, pixel, x * 8, y * 8); // replace the whole shebang
  }
}

function doBlink(ctx, buffer) {
  blinkOn = !blinkOn;

  toBlink.forEach(item => {
    const { x, y } = item;
    let attribute = item.attribute;
    if (blinkOn) {
      // swap the paper and ink
      attribute =
        (attribute & 192) + // bright + blink
        ((attribute & 7) << 3) + // ink moved to paper
        ((attribute & 56) >> 3); // paper moved to ink
    }
    const pixel = new ImageData(block(x, y, buffer, attribute), 8, 8);
    put(ctx, pixel, x * 8, y * 8);
  });
}

export default async function main(url) {
  const buffer = await load(url || './screens/remy.scr');

  const canvas = document.createElement('canvas');
  const log = document.createElement('pre');

  document.body.appendChild(canvas);
  const zoom = new Zoom(buffer);
  document.body.appendChild(log);
  const ctx = canvas.getContext('2d');

  window.ctx = ctx;

  const scale = 2;
  const w = (canvas.width = 256);
  const h = (canvas.height = 192);
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, 0, w, h);

  await draw(ctx, 0, buffer.subarray(0, 2048));
  await draw(ctx, 1, buffer.subarray(2048, 2048 * 2));
  await draw(ctx, 2, buffer.subarray(2048 * 2, 2048 * 3));

  const attribs = buffer.subarray(2048 * 3);

  await colour(ctx, buffer);
  zoom.seeXY(0, 0);

  // setInterval(() => zoom.seeXY(), 1000);

  canvas.onmousemove = e => {
    const { ptr, x, y, byte, bright, blink, ink, paper } = readFromPoint({
      attribs,
      scale,
      x: e.pageX,
      y: e.pageY,
    });

    zoom.seeXY(x / 8, y / 8);

    log.innerHTML = `ptr: ${ptr}
x: ${x} (${x / 8})
y: ${y} (${y / 8})
byte: ${byte}
ink: <span style="color: white; text-shadow: 1px 1px 0 #000; background: rgb(${ink.join(
      ','
    )})">${(byte & 7).toString(2).padStart(3, '0')}</span>
paper: <span style="color: white; text-shadow: 1px 1px 0 #000; background: rgb(${paper.join(
      ','
    )})">${((byte & 56) >> 3).toString(2).padStart(3, '0')}</span>
bright: ${bright}
blink: ${blink}
`;
  };

  canvas.onclick = e => {
    const { x, y, ink, paper } = readFromPoint({
      attribs,
      scale,
      x: e.pageX,
      y: e.pageY,
    });

    toBlink.push({
      x,
      y,
      ink,
      paper,
    });
  };

  setInterval(() => doBlink(ctx, buffer), 333);
}

export function blink(ctx, buffer) {
  return setInterval(() => doBlink(ctx, buffer), 333);
}

export function readAttributes(byte) {
  const bright = !!(byte & 64);
  const source = bright ? brightColours : normalColours;

  const values = {
    ink: byte & 7,
    paper: (byte & 56) >> 3,
  };

  const ink = source[values.ink]; // 0b00000111
  const paper = source[values.paper]; // 0b00111000
  const blink = !!(byte & 128);

  return {
    values,
    bright,
    ink,
    paper,
    blink,
  };
}

function readFromPoint({ x, y, scale = 1, attribs = [] }) {
  x = (((x / scale) | 0) / 8) | 0;
  y = (((y / scale) | 0) / 8) | 0;
  const ptr = y * 32 + x;
  const byte = attribs[ptr];

  const { ink, paper, bright, blink } = readAttributes(byte);

  return {
    ptr,
    x: x * 8,
    y: y * 8,
    byte,
    ink,
    paper,
    blink,
    bright,
  };
}

function getIndexForXY(width, x, y) {
  return width * y + x;
}

/**
 * Converts canvas image data to SCR binary format
 * @param {Number} third 0-2: the thirds of the screen data
 * @param {Uint8Array} arrayBuffer expected to be 3 * 2048 + 768 (empty)
 * @param {Uint8ClampedArray} canvasImageData canvas pixel data (expects to be filled)
 */
export function pixelsToBytes(third, arrayBuffer, canvasImageData) {
  const data = arrayBuffer.subarray(third * 2048, (third + 1) * 2048);
  const pixels = canvasImageData.subarray(
    third * (canvasImageData.length / 3),
    (third + 1) * (canvasImageData.length / 3)
  );

  let ptr = 0;

  for (let offset = 0; offset < 8; offset++) {
    for (let y = 0; y < 8; y++) {
      const row = y * 8 + offset;

      for (let x = 0; x < 32; x++) {
        let byte = 0;

        for (let j = 0; j < 8; j++) {
          const index = getIndexForXY(256, x * 8 + j, row) * 4;
          byte += (pixels[index] === 0 ? 1 : 0) << (7 - j);
        }

        data[ptr] = byte;
        ptr++;
      }
    }
  }
}

/**
 * Converts canvas image data to SCR binary format
 * @param {Number} third 0-2: the thirds of the screen data
 * @param {Uint8Array} allPixels expected to be 3 * 2048 + 768
 * @param {Uint8ClampedArray} allData canvas pixel data
 */
export function putPixels(third, allPixels, allData) {
  const pixels = allPixels.subarray(third * 2048, (third + 1) * 2048);
  const data = allData.subarray(
    third * (allData.length / 3),
    (third + 1) * (allData.length / 3)
  );

  let ptr = 0;

  for (let offset = 0; offset < 8; offset++) {
    for (let y = 0; y < 8; y++) {
      const row = y * 8 + offset;

      for (let x = 0; x < 32; x++) {
        let bit = 0;

        for (let j = 0; j < 8; j++) {
          const index = getIndexForXY(256, x * 8 + j, row) * 4;
          bit += (data[index] === 0 ? 1 : 0) << (7 - j);
        }

        pixels[ptr] = bit;
        ptr++;
      }
    }
  }
}

export function getInkFromPixel(rgb, shiftBright = false) {
  rgb = `${rgb[0]},${rgb[1]},${rgb[2]}`;
  let ink = brightColoursLookup.get(rgb);

  if (!ink) {
    ink = normalColoursLookup.get(rgb);
    if (shiftBright) ink <<= 3;
  }

  return ink;
}

export function attributesForBlock(block, print) {
  let attribute = 0;
  const inks = new Uint8Array((0b111 << 3) + 1).fill(0); // container array

  for (let i = 0; i < block.length / 4; i++) {
    const ink = getInkFromPixel([...block.slice(i * 4, i * 4 + 3)], true);
    inks[ink]++;
  }

  if (print) {
    Object.keys(inks).forEach(
      (ink, count) =>
        inks[count] && console.log('ink %s (%s)', ink, inks[count])
    );
  }

  let [{ ink: paper }, { ink } = { ink: 0 }] = Array.from(inks)
    .map((count, ink) => ({ ink, count }))
    .filter(({ count }) => count)
    .sort((a, b) => a.count - b.count)
    .slice(-2);

  if (paper === null) {
    paper = ink;
  }

  // this helps massage the colours into a better position
  if (ink === 7 && paper !== 7) {
    [ink, paper] = [paper, ink];
  }

  // work out the brightness based on the majority ink
  if (ink >> 3 === 0 || paper >> 3 === 0) {
    // if ink or paper is black, then take the brightness from the other colour
    if (ink === 0 || paper === 0) {
      const colour = ink === 0 ? paper : ink;
      if (colour >>> 3 === 0) {
        // colour is bright
        attribute += 64;
      } else {
        // not bright
      }
    } else {
      // we're dealing with bright
      if (print) console.log('dealing with bright');
      if (ink >> 3 === 0 && inks[ink] > inks[paper]) {
        if (print) console.log('ink > paper', ink, paper);
        attribute += 64;
      } else if (paper >> 3 === 0 && inks[paper] > inks[ink]) {
        if (print) console.log('paper > ink');
        attribute += 64;
      }
    }
  }

  if (ink >> 3 !== 0) {
    ink = ink >> 3;
  }

  if (paper >> 3 !== 0) {
    paper = paper >> 3;
  }

  attribute += paper << 3;
  attribute += ink;

  return attribute;
}

export function putAttributes(pixels, inkData) {
  let ptr = 0;
  const zoom = new Zoom(inkData);
  for (let y = 0; y < 192 / 8; y++) {
    for (let x = 0; x < 256 / 8; x++) {
      const block = zoom.pixel(x, y);
      const print = false; // x === 28 && y === 19;

      pixels[2048 * 3 + ptr] = attributesForBlock(block, print);

      ptr++;
    }
  }
}

export function download(data, filename = 'image.png', type = 'image/png') {
  const click = function(node) {
    var event = new MouseEvent('click');
    node.dispatchEvent(event);
  };

  const a = document.createElement('a');
  a.download = filename;
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  a.href = url;
  click(a);
  URL.revokeObjectURL(url);
}
