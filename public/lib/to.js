export const toBinary = (n, size = 8) => {
  if (n < 0) {
    return Array.from({ length: size }, (_, i) => {
      return ((n >> i) & 1) === 1 ? 1 : 0;
    })
      .reverse()
      .join('');
  }
  return n.toString(2).padStart(size, 0);
};

export const toHex = (n, size = 8) => {
  if (n < 0) {
    n = parseInt(toBinary(n, size), 2);
  }
  return n
    .toString(16)
    .padStart(size / (8 / 2), 0)
    .toUpperCase();
};

// via https://stackoverflow.com/questions/37471158/converting-ieee-754-from-bit-stream-into-float-in-javascript#37471222
export const zxFloat = source => {
  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, source, false); // allows us to force big endian
  const bytes = new Uint8Array(view.buffer); // ?

  const bits = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const sign = bits >>> 31 == 0 ? 1.0 : -1.0; // ?
  const e = (bits >>> 23) & 0xff; // ?
  const m = e == 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000; // ?
  const f = sign * m * Math.pow(2, e - 150); //?

  const res = {
    e: e - 150 + 128,
    sign: sign ? 0 : 1,
    m,
  };

  const v2 = new DataView(new ArrayBuffer(6));
  v2.setUint16(2, (m >>> 9) | (sign ? 0x0000 : 0x8000), false); // ? [(m >>> 9) | (sign ? 0x0000 : 0x8000)]
  v2.setUint8(1, e - 150 + 128);
  v2.setUint8(0, 0x0e);

  res.value = new Uint8Array(v2.buffer);

  return res;
};

// zxFloat(0.5); // ?
