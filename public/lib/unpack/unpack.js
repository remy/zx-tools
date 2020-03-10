import './dataview-64.js';

import { encode, decode, pattern, typeMap } from './lib.js';

function binarySlice(value, ptr, length) {
  if (!length || isNaN(length)) {
    length = 8 - ptr;
  }
  const mask = 2 ** length - 1;
  const shift = 8 - (ptr + length);
  const res = (value >> shift) & mask;
  return res;
}

export class Unpack {
  constructor(data) {
    this.data = data;
    this.offset = 0;
  }

  parse(template) {
    const res = unpack(template, this.data, this.offset);
    this.last = res;
    if (!res) {
      return res;
    }
    this.offset = res.__offset;
    delete res.__offset;
    return res;
  }
}

function unpack(template, data, offset = 0) {
  const result = {}; // return an object

  if (Array.isArray(data)) {
    data = Uint8Array.from(data);
  }

  if (typeof data === 'string') {
    data = encode(data).buffer; // ?
  } else if (typeof data === 'number') {
    if ((data | 0) !== data) {
      // float
      data = Float64Array.from([data]).buffer;
    } else {
      data = Int32Array.from([data]).buffer;
    }
  } else if (ArrayBuffer.isView(data)) {
    data = data.buffer;
  }

  if (offset >= data.byteLength) {
    return null;
  }

  const re = new RegExp(pattern, 'g');
  let m = [];
  let bytePtr = 0;

  const firstChr = template[0];
  const defaultLittle = firstChr === '<' ? true : false;

  let templateCounter = -1;

  while ((m = re.exec(template))) {
    templateCounter++;
    const index = m[4] || templateCounter;
    let little = defaultLittle;
    let length = null;
    if (typeMap[m[2]]) {
      length = typeMap[m[2]].length;
    } else {
      length = parseInt(m[2] || 1);
    }

    let c = m[1];

    if (c.length === 2) {
      little = c[1] === '<';
      c = c[0];
    }

    const type = typeMap[c];

    if (!type) {
      throw new Error(`unsupported type "${c}"`);
    }

    if (type.little !== undefined) {
      little = type.little;
    }

    const size = type.length; // ?
    let end = c === 'b' ? 1 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    if (offset + end > data.byteLength) {
      // return result;
      break;
    }

    const view = new DataView(data, offset, end);

    if (c !== 'b') {
      // reset the byte counter
      bytePtr = 0;
    }

    switch (c) {
      case 'b':
        c = view.getUint8(0, little);
        result[index] = binarySlice(c, bytePtr, length);
        result[index]; // ? [index,result[index],c, bytePtr, length]

        bytePtr += length;
        if (bytePtr > 7) {
          offset++;
          bytePtr = 0;
        }

        break;
      case 'x':
        // x is skipped null bytes
        templateCounter--;
        offset += end;
        break;
      case 'a':
      case 'A':
        result[index] = decode(view).padEnd(length, c === 'A' ? ' ' : '\0');
        if (c === 'a' && result[index].indexOf('\0') !== -1) {
          result[index] = result[index].substring(
            0,
            result[index].indexOf('\0')
          );
        }

        offset += end;
        break;
      default:
        if (length > 1) {
          result[index] = new type.array(
            view.buffer.slice(offset, offset + end)
          );
        } else {
          result[index] = view[`get${type.fn}`](0, little);
        }
        offset += end;
        break;
    }
  }

  result.__offset = offset;

  return result;
}

export default unpack;
// unpack('<I$length', Uint8Array.from([0xe7, 0x00, 0x00, 0x00])); // ?
