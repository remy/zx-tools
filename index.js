/* eslint-env node */

import { Unpack, default as unpacker } from "@remy/unpack";
import { promises } from "fs";
import BASIC from "./codes";
const { readFile } = promises;

async function main() {
  const data = Uint8Array.from(await readFile(__dirname + "/forloop.bas"));

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

  console.log({ ...header, length });

  let next;
  while ((next = unpack.parse("<n$line s$length"))) {
    const { length, line } = next;
    //console.log('A' + line.length + '$data', data, line.__offset);
    const content = unpack.parse(`<C${length}$data`);
    if (!content || !content.data) break;

    let string = line + " ";

    const data = Array.from(content.data);

    while (data.length) {
      let chr = data.shift();
      if (BASIC[chr]) {
        string += BASIC[chr] + " ";
      } else if (chr === 0x0e) {
        // move forward 5 bits
        chr = data.shift();
        let value = null;
        let neg = 1;
        if (chr === 0x00) {
          const n = unpacker("<C$sign s$value x", data.splice(0, 4));
          value = n.value;
          neg = n.sign === 0x00 ? 1 : -1;
        } else if ((chr & 0b0110000) === 0b0110000) {
          // one letter number
          const exp = chr - 128; // 128 float adjust…weird
          let mantissa = unpacker("I$m", data.splice(0, 4)).m; // 32bit
          neg = mantissa > 0x7f000000 ? -1 : 1; // sign mask is on the mantissa

          mantissa = mantissa <<= 1; // now shift it off
          value = mantissa ** exp;
        } else {
          // array
          console.log("TODO");
        }
        value *= neg;
        // console.log({ value });
      } else {
        string += String.fromCharCode(chr);
      }
    }

    console.log(string);
  }
}

main();
