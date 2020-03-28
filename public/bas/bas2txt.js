import BASIC from './codes.js';
import { Unpack, default as unpacker } from '../lib/unpack/unpack.js';

export function bas2txt(data) {
  const unpack = new Unpack(data);

  let { length, ...header } = unpack.parse(
    `<A8$sig
    C$marker
    C$issue
    C$version
    I$length
    C$hType
    S$hFileLength
    n$hLine
    S$hOffset
    x
    x104
    C$checksum`
  );

  return bas2txtLines(data.slice(unpack.offset));
}

export function bas2txtLines(data) {
  const unpack = new Unpack(data);
  let next;

  const lines = [];

  console.log(data);

  while ((next = unpack.parse('<n$line s$length'))) {
    const { length, line: lineNumber } = next;
    if (lineNumber > 9999) {
      break;
    }
    const content = unpack.parse(`<C${length}$data`);
    if (!content || !content.data) break;

    let string = lineNumber + ' ';

    let lastChr = null;

    const data = Array.from(content.data);

    while (data.length) {
      let chr = data.shift();
      if (chr === 0x0d) {
        break;
      }
      if (BASIC[chr]) {
        if (lastChr !== null && !BASIC[lastChr]) {
          string += ' ' + BASIC[chr] + ' ';
        } else {
          string += BASIC[chr] + ' ';
        }
      } else if (chr === 0x0e) {
        // move forward 5 bits - this contains the encoded numerical value
        // which, since we're porting to text, we don't care about on the way in
        data.splice(0, 5);
      } else {
        string += String.fromCharCode(chr);
      }

      lastChr = chr;
    }

    console.log(string);

    lines.push(string);
  }

  // note that the 0x0d (13) is dropped in the line, so we're putting it back here
  return lines.join('\n');
}

const res = bas2txtLines(
  `00 0A 0F 00 F5 32 2E 33 34 65 2D 32 0E 7B 3F B1 5B 57 0D`
    .split(' ')
    .map(_ => eval(`0x${_.trim()}`))
); // ?

console.log(res);
