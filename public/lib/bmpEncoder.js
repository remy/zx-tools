/**
 * @author shaozilee
 * Modified by Remy Sharp for the browser
 *
 * BMP format encoder,encode 24bit BMP
 * Not support quality compression
 *
 */

import { toRGB332, rgbFrom8Bit } from '../sprites/lib/colour';

const sizes = {
  Uint8: 1,
  Int8: 1,
  Uint16: 2,
  Int16: 2,
  Uint32: 4,
  Int32: 4,
};

export default class BmpEncoder {
  /**
   * Encodes RGBA array bytes into a BMP via the encode method
   * @param {object} options
   * @param {Uint8Array} options.data byte array order by RGBA
   * @param {number} options.width
   * @param {number} options.height
   */
  constructor({ data, width, height }) {
    this.data = data;
    this.width = width;
    this.height = height;
    this.extraBytes = this.width % 4;
    this.rgbSize = width * height;
    this.headerInfoSize = 40; // DIB header length (excludes the 16 bytes for the bitmap header)

    /******************header***********************/
    this.flag = 'BM';
    this.reserved = 0;
    // 14 = header size
    // headerinfo should be 40
    // palette is 256 * 4 (starting at byte 54)
    this.offset = 14 + this.headerInfoSize + (1 << 8) * 4;
    this.fileSize = this.rgbSize + this.offset;

    this.planes = 1;
    this.bitPP = 8; // NOTE - this is expected to be an 8bit image
    this.compress = 0;
    this.vr = this.hr = 0xb12;
    this.colors = 0;
    this.importantColors = 0;

    this.createPalette();
  }

  createPalette() {
    const p = new Set();
    const pixels = [];
    for (let i = 0; i < this.data.length; i += 4) {
      const r = this.data[i];
      const g = this.data[i + 1];
      const b = this.data[i + 2];
      const a = this.data[i + 3];

      let value = toRGB332({ r, g, b });

      if (a === 0) {
        p.add(227);
        pixels.push(227);
      } else {
        p.add(value);
        pixels.push(value);
      }
    }

    const pData = Uint8Array.from(p);
    const length = this.width * this.height;
    const palette = new Uint8Array((1 << 8) * 4);
    palette.fill(0);
    palette.set(
      pData.reduce((acc, curr) => {
        const { r, g, b } = rgbFrom8Bit(curr);
        return acc.concat(b, g, r, 0);
      }, []),
      0
    );

    const index = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      index[i] = pData.indexOf(pixels[i]);
    }

    this.pixels = pixels;
    this.index = index;
    this.palette = palette;

    const bytes = new Uint8Array(palette.length + index.length);
    bytes.set(palette, 0);
    bytes.set(index, palette.length);

    this.bytes = bytes;
  }

  write(type, value, little = true) {
    this.view[`set${type}`](this.pos, value, little);
    const inc = sizes[type];
    this.pos += inc;
  }

  encode() {
    this.view = new DataView(new ArrayBuffer(this.offset + this.rgbSize));
    this.pos = 0;

    this.write('Uint8', this.flag.charCodeAt(0));
    this.write('Uint8', this.flag.charCodeAt(1));
    this.write('Uint32', this.fileSize);
    this.write('Uint32', this.reserved);
    this.write('Uint32', this.offset);
    this.write('Uint32', this.headerInfoSize);
    this.write('Uint32', this.width);
    this.write('Int32', -this.height);
    this.write('Uint16', this.planes);
    this.write('Uint16', this.bitPP);
    this.write('Uint32', this.compress);
    this.write('Uint32', this.rgbSize); // rawSize
    this.write('Uint32', this.hr);
    this.write('Uint32', this.vr);
    this.write('Uint32', this.colors);
    this.write('Uint32', this.importantColors);

    const data = new Uint8Array(this.view.buffer);

    console.log('writing data @ ' + this.pos);

    for (let i = 0; i < this.bytes.length; i++) {
      data[this.pos + i] = this.bytes[i];
    }

    return data;
  }
}

export function encode(imgData) {
  var encoder = new BmpEncoder(imgData);
  var data = encoder.encode();
  return {
    data: data,
    width: imgData.width,
    height: imgData.height,
  };
}
