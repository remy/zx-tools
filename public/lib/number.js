const UNKNOWN = null;
const HEX = 16;
const DEC = 10;
const OCT = 8;
const BIN = 2;

/**
 * Parse assembly like numbers
 *
 * @param {string} string The numerical value
 * @returns {number|NaN} Returns NaN if the value can't be parsed
 * @example
 *
 *  12     decimal
 *  12d    decimal
 *  0xc    hexadecimal
 *  $c     hexadecimal
 *  #c     hexadecimal
 *  0b1100 binary
 *  %1100  binary
 *  1100b  binary
 *  0q14   octal
 *  14q    octal
 *  14o    octal
 */
export default function parseToInt(string) {
  const last = string.substring(string.length - 1); // ?
  const first = string.substring(0, 1); // ?
  const prefix = string.substring(0, 2); // ?

  let res = NaN;
  let type = UNKNOWN;

  if (last === 'o' || last === 'q') {
    type = OCT;
    string = string.slice(0, -1);
  }

  if (prefix === '0o' || prefix === '0q') {
    type = OCT;
    string = string.substring(2);
  } else if (first === '0') {
    if (prefix !== '0x' && prefix !== '0q' && prefix != '0b') {
      type = OCT;
      string = string.substring(1);
    }
  }

  if (first === '$' || first === '#') {
    type = HEX;
    string = string.substring(1);
  }

  if (last === 'h') {
    type = HEX;
    string = string.slice(0, -1);
  }

  if (last === 'd') {
    type = DEC;
    string = string.slice(0, -1);
  }

  if (first === '%') {
    type = BIN;
    string = string.substring(1);
  }

  if (last === 'b') {
    type = BIN;
    string = string.slice(0, -1);
  }

  if (type === UNKNOWN) {
    if (prefix === '0x') {
      type = HEX;
      string = string.substring(2);
    }

    if (prefix === '0b') {
      type = BIN;
      string = string.substring(2);
    }
  }

  res = parseInt(string, type);

  return res;
}
