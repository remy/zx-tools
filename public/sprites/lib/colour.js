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

// 24bit colour to RRRGGGBB - 8bit
export function toRGB332(r, g, b) {
  // via https://www.codeproject.com/Questions/1077234/How-to-convert-a-bit-rgb-to-bit-rgb

  return (
    ((Math.floor(r / 32) << 5) +
      (Math.floor(g / 32) << 2) +
      Math.floor(b / 64)) &
    0xff
  );
}

export function toNext256(r, g, b) {
  r = ((r / 32) | 0) << 6;
  g = ((g / 32) | 0) << 3;
  b = (b / 32) | 0;

  return (r + g + b) & 0xff;
}

export function next512FromRGB(r, g, b) {
  r = ((r / 32) | 0) << 6;
  g = ((g / 32) | 0) << 3;
  b = (b / 32) | 0;

  return r + g + b;
}

export function nextLEShortToP(index) {
  return ((index & 0xff) << 1) + (index >> 8);
}

export function rgbFromNext(index) {
  const r = (index >> 6) & 0x7;
  const g = (index >> 3) & 0x7;
  const b = index & 0x7;

  return {
    r: Math.round((r * 255) / 7),
    g: Math.round((g * 255) / 7),
    b: Math.round((b * 255) / 7),
    a: 255,
  };
}

// 24bit colour to RRRGGGBB - 8bit
export function toRGB333(r, g, b) {
  return (
    (Math.round(r / 32) << 6) + (Math.round(g / 32) << 3) + Math.round(b / 32)
  );
}

export function convertTo9Bit(value) {
  const hb = (value & 0b00000010) >> 1;
  return (value << 1) | hb;
}

export const transparent = 0xe3;

const [r, g, b] = [255, 219, 182];
// expect 247 / 11110111 / 111101111
toRGB332(r, g, b); // ?
const x = toNext256(r, g, b); // ?
rgbFrom8Bit(250); // ?
const y = next512FromRGB(109, 36, 146); // ?
rgbFromNext(y); // ?
