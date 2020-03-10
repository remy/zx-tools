export const pattern =
  '([aAZbBhHcCWqQnNvVuUx@]|[sSlLiI][\\!><]?)(?:([\\d*]+)|(?:\\[(.*)\\]))?(?:\\$([a-zA-Z0-9_]+)\\b)?';
export const typeMap = {
  x: { length: 1 },
  b: { length: 1 },
  //B: { length: 1, fn: 'Uint8', little: true }, // bit
  // h: { length: 2, fn: 'Uint16' },
  // H: { length: 2, fn: 'Uint16', little: true }, // nibble
  c: { length: 1, fn: 'Int8', array: Int8Array }, // char == byte
  C: { length: 1, fn: 'Uint8', array: Uint8Array },
  a: { length: 1, fn: 'Uint8' }, // string with arbitrary, null padded
  A: { length: 1, fn: 'Uint8' }, // string with arbitrary, space padded
  s: { length: 2, fn: 'Int16', array: Int16Array },
  S: { length: 2, fn: 'Uint16', array: Uint16Array },
  i: { length: 4, fn: 'Int32', array: Int32Array },
  I: { length: 4, fn: 'Uint32', array: Uint32Array },
  l: { length: 8, fn: 'Int64' },
  L: { length: 8, fn: 'Uint64' },
  n: { length: 2, fn: 'Uint16', little: false },
  N: { length: 4, fn: 'Uint32', little: false },
  f: { length: 4, fn: 'Float32', array: Float32Array },
  d: { length: 8, fn: 'Float64', array: Float64Array },
};

export const decode = a => new TextDecoder().decode(a);
export const encode = a => new TextEncoder().encode(a);
