/** @typedef {number} Type */

/**
 * @enum {Type}
 */
const types = {
  UNKNOWN: null,
  HEX: 16,
  DEC: 10,
  OCT: 8,
  BIN: 2,
};

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
  let res = NaN;

  let { type, modified } = parse(string);
  res = parseInt(modified, type);

  return res;
}

/**
 * Tries to recognise the number based on common numerical prefixes and suffixes
 *
 * @param {string} string
 * @returns {boolean}
 */
export function recognised(string) {
  const { type } = parse(string);
  return type !== types.UNKNOWN;
}

/**
 *
 * @param {string} string
 * @returns {{ type: Type, modified: string }}
 */
function parse(string) {
  const last = string.substring(string.length - 1); // ?
  const first = string.substring(0, 1); // ?
  const prefix = string.substring(0, 2); // ?

  const { UNKNOWN, OCT, HEX, BIN, DEC } = types;

  let modified = string;

  let type = UNKNOWN;

  if (last === 'o' || last === 'q') {
    type = OCT;
    string = string.slice(0, -1);
  }

  if (prefix === '0o' || prefix === '0q') {
    type = OCT;
    modified = string.substring(2);
  } else if (first === '0') {
    if (prefix !== '0x' && prefix !== '0q' && prefix != '0b') {
      type = OCT;
      modified = string.substring(1);
    }
  }

  if (first === '$' || first === '#') {
    type = HEX;
    modified = string.substring(1);
  }

  if (last === 'h') {
    type = HEX;
    modified = string.slice(0, -1);
  }

  if (last === 'd') {
    type = DEC;
    modified = string.slice(0, -1);
  }

  if (first === '%') {
    type = BIN;
    modified = string.substring(1);
  }

  if (last === 'b') {
    type = BIN;
    modified = string.slice(0, -1);
  }

  if (type === UNKNOWN) {
    if (prefix === '0x') {
      type = HEX;
      modified = string.substring(2);
    }

    if (prefix === '0b') {
      type = BIN;
      modified = string.substring(2);
    }
  }

  if (type === UNKNOWN) {
    if (allNumbers(string)) {
      type = DEC;
    }
  } else {
    // final check
    if (!allNumbers(modified)) {
      type = UNKNOWN;
      modified = string;
    }
  }

  return { type, modified };
}

/**
 *
 * @param {string} string
 * @returns {boolean}
 */
function allNumbers(string) {
  return /^\d+$/.test(string);
}
