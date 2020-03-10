export function rgbFromIndex(index) {
  if (index === 0xe3) {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  let r = (index >> 5) & 0x7;
  let g = (index >> 2) & 0x7;
  let b = (index >> 0) & 0x3;

  //make a pure RGB332 colour
  return {
    r: (r * 255.0) / 7.0,
    g: (g * 255.0) / 7.0,
    b: (b * 255.0) / 3.0,
    a: 1
  };
}

export function toRGB332(r, g, b) {
  return (
    (Math.floor(r / 32) << 5) + (Math.floor(g / 32) << 2) + Math.floor(b / 64)
  );
}
