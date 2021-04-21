/**
 * @typedef RGBA
 * @property {number} r 0-255
 * @property {number} g 0-255
 * @property {number} b 0-255
 * @property {number} a 255 - typically defaulted as our values don't have semi-opaque
 */

/**
 * @typedef RGB
 * @property {number} r 0-255
 * @property {number} g 0-255
 * @property {number} b 0-255
 */

/**
 * @typedef HSV
 * @property {number} h 0-1
 * @property {number} s 0-1
 * @property {number} v 0-1
 */

/**
 * @typedef HSL
 * @property {number} h 0-100
 * @property {number} s 0-100
 * @property {number} l 0-100
 */

/**
 * Converts to 24bit hex value
 *
 * @param {RGB} param0
 * @param {string} [prefix=#]
 * @returns {string}
 */
export function rgbToHex({ r, g, b }, prefix = '#') {
  return (
    prefix +
    [r, g, b]
      .map((_) => _.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/**
 * Calculate 8bit RGB332 value as RGB
 *
 * @param {number} index
 * @returns {RGBA} rgba
 */
export function rgbFromIndex(index) {
  if (index === 0xe3) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  let r = (index >> 5) & 0x7;
  let g = (index >> 2) & 0x7;
  let b = (index >> 0) & 0x3;

  //make a pure RGB332 colour
  return {
    r: Math.round((r * 255) / 7),
    g: Math.round((g * 255) / 7),
    b: Math.round((b * 255) / 3),
    a: 255,
  };
}

/**
 * Converts 8bit colour to RGB
 *
 * @param {number} index
 * @returns {RGB} rgb object
 */
export function rgbFrom8Bit(index) {
  index = convertTo9Bit(index);

  let r = (index >> 6) & 0x7;
  let g = (index >> 3) & 0x7;
  let b = (index >> 0) & 0x7;

  //make a pure RGB332 colour
  return {
    r: Math.round((r * 255) / 7),
    g: Math.round((g * 255) / 7),
    b: Math.round((b * 255) / 7),
    // a: 255,
  };
}

/**
 * Convert 24bit RGB to 8bit colour -
 * {@link https://www.codeproject.com/Questions/1077234/How-to-convert-a-bit-rgb-to-bit-rgb Source}
 *
 * @param {RGB} rgb
 * @returns {number} 8bit value
 */
export function toRGB332({ r, g, b } = {}) {
  // 24bit colour to RRRGGGBB - 8bit
  return (
    ((Math.floor(r / 32) << 5) +
      (Math.floor(g / 32) << 2) +
      Math.floor(b / 64)) &
    0xff
  );
}

/**
 * Converts RGB triplet to nearest spectrum next colour value
 *
 * @param {RGB} rgb
 * @returns {number} 9bit spectrum next colour value
 */
export function next512FromRGB({ r, g, b }) {
  r = ((r / 32) | 0) << 6;
  g = ((g / 32) | 0) << 3;
  b = (b / 32) | 0;

  return r + g + b;
}

/**
 * Converts Spectrum Next little endian value to a 16bit/short colour value
 *
 * @param {number} value little endian 16 bit value
 * @returns {number} 16bit colour value (not an index value)
 */
export function nextLEShortToP(value) {
  return ((value & 0xff) << 1) + ((value >> 8) & 0x7f);
}

/**
 * Checks the MSB for priority flag - expected Big Endian
 *
 * @param {number} value
 * @returns {boolean}
 */
export function isPriority(value) {
  return !!(value & 0x8000);
}

/**
 * Converts 512 RGB palette to Next compatible 16bit word
 *
 * @param {number} value
 * @param {boolean} [priority=false]
 * @returns {number} 2 byte value
 */
export function indexToNextLEShort(value, priority = false) {
  let LB = (value & 1) << 8;
  let HB = value >> 1;
  if (priority) HB += 0x8000;
  return LB + HB;
}

/**
 * Reads a 9bit value from the Spectrum Next palette and converts to RGB
 *
 * @param {number} value
 * @returns {RGBA} rgba
 */
export function rgbFromNext(value) {
  const r = (value >> 6) & 0x7;
  const g = (value >> 3) & 0x7;
  const b = value & 0x7;

  return {
    r: Math.round((r * 255) / 7),
    g: Math.round((g * 255) / 7),
    b: Math.round((b * 255) / 7),
    a: 255,
  };
}

/**
 * Converts an 8bit colour to 9bit by using high blue bit and mirroring as the
 * ninth bit (blue LSB)
 *
 * @param {number} value 8bit value
 * @returns {number} 9bit value
 * @example
 * 10110011 (179) becomes 101100111 (359)
 * convertTo9Bit(0b10110011)
 *
 * The standard way of auto conversion of an
 * 8bit value to its 9bit equivalent internally
 * is by performing a logical OR of the high B
 * bit with the low B bit of the 8bit colour
 * and the result becoming the 9th B bit (B LSB)
 * Example: 10110011 → 101100111
 */
export function convertTo9Bit(value) {
  const hb = ((value & 2) >> 1) | (value & 1);
  return (value << 1) | hb;
}

/**
 * The default transparency on the zx spectrum next (in 8bit form)
 */
export const transparent = 0xe3;

/**
 * {@link https://stackoverflow.com/a/17243070/22617 Source}
 *
 * @param {RGB} rgb
 * @returns {HSV}
 */
export function rgbToHsv({ r, g, b }) {
  var max = Math.max(r, g, b),
    min = Math.min(r, g, b),
    d = max - min,
    h,
    s = max === 0 ? 0 : d / max,
    v = max / 255;

  switch (max) {
    case min:
      h = 0;
      break;
    case r:
      h = g - b + d * (g < b ? 6 : 0);
      h /= 6 * d;
      break;
    case g:
      h = b - r + d * 2;
      h /= 6 * d;
      break;
    case b:
      h = r - g + d * 4;
      h /= 6 * d;
      break;
  }

  return { h: (h * 100) | 0, s: (s * 100) | 0, v: (v * 100) | 0 };
}

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param {RGB}  rgb
 * @returns {HSL}
 */
export function rgbToHsl({ r, g, b }) {
  (r /= 255), (g /= 255), (b /= 255);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h;
  let s;
  let l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return { h: (h * 100) | 0, s: (s * 100) | 0, l: (l * 100) | 0 };
}
