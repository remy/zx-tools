import { encode, pattern, typeMap } from './lib.js';

export default function pack(template, data, offset = 0) {
  if (ArrayBuffer.isView(data)) {
    data = data.buffer;
  }

  const re = new RegExp(pattern, 'g');
  let m = [];
  let bytePtr = 0;
  let little = false;

  const firstChr = template[0];
  const defaultLittle = firstChr === '<' ? true : false;

  let templateCounter = -1;

  let dataLength = 0;

  while ((m = re.exec(template))) {
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

    const size = type.length;
    let end = c === 'b' ? length / 8 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    dataLength += end; // ?
  }

  const result = new DataView(new ArrayBuffer(dataLength));

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

    // forced endianness
    if (type.little !== undefined) {
      little = type.little;
    }

    const size = type.length;
    let end = c === 'b' ? 1 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    if (offset + end > data.byteLength) {
      // return result;
      break;
    }

    if (c !== 'b') {
      // reset the byte counter
      bytePtr = 0;
    }

    switch (c) {
      case 'b':
        result.setUint8(
          offset,
          result.getUint8(offset) | (data[index] << (8 - bytePtr - length))
        );

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
        result.setUint8(offset, 0x00);
        break;
      case 'a':
      case 'A':
        new Uint8Array(result.buffer, offset, end).set(encode(data[index]));
        offset += end;
        break;
      default:
        if (length > 1) {
          for (let i = index; i < index + length; i++) {
            result[`set${type.fn}`](offset, data[i], little);
            templateCounter++;
            offset += type.length;
          }
        } else {
          result[`set${type.fn}`](offset, data[index], little);
        }
        offset += end;
        break;
    }
  }

  return new Uint8Array(result.buffer);
}
