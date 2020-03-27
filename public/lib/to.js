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

function getNumberParts(x) {
  var float = new Float64Array(1),
    bytes = new Uint8Array(float.buffer);

  float[0] = x;

  var sign = bytes[7] >> 7,
    exponent = (((bytes[7] & 0x7f) << 4) | (bytes[6] >> 4)) - 0x3ff;

  bytes[7] = 0x3f;
  bytes[6] |= 0xf0;

  return {
    sign: sign,
    exponent: exponent,
    mantissa: float[0],
  };
}
export const zxFloat = value => {
  const sign = value < 0 ? 1 : 0;
  if (sign) {
    value = 0 - value; // abs
  }

  let int = value | 0; // ?
  let frac = value - int; // ?

  let e = 0;
  if (int === 0) {
    // search the fraction for steps
    let frac = 0;
    for (let i = 0; i < 32; i++) {
      const res = frac >> i;
      if (res) {
        // ?
        const v = Math.pow(2, -(32 - i));
        frac += v;
      }
    }
  } else {
  }

  return [];

  const v2 = new DataView(new ArrayBuffer(6));
  v2.setUint8(0, 0x0e);
  v2.setUint8(1, res.exponent + 128);
  // v2.setUint32(2, (m >>> 1) | (sign === -1 ? 0x80000000 : 0), false); // ? v2.getUint32(2)
  v2.setFloat32(2, res.mantissa - 1, false); // ? v2.getUint32(2)
  if (res.sign < 0) {
    const m1 = v2.getUint8(2);
    v2.setUint8(2, m1 | 0x80);
  }

  return new Uint8Array(v2.buffer);
};

// via https://stackoverflow.com/questions/37471158/converting-ieee-754-from-bit-stream-into-float-in-javascript#37471222

export const _zxFloat2 = source => {
  // const view = new DataView(new ArrayBuffer(4));
  // view.setFloat64(0, source << 1, false);
  // const bits = view.getFloat64(0, false);

  // const sign = source < 0 ? 1.0 : -1.0; // ?
  // const e = view.getUint8(0);

  const view = new DataView(new ArrayBuffer(4));
  view.setFloat32(0, source, false);

  // var bytes = [0x40, 0x33, 0xc3, 0x85];
  // var bytes = new Uint8Array(view.buffer) // ?
  // var bits = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
  const bits = view.getUint32(0, false); //?
  const sign = bits >>> 31 == 0 ? 1.0 : -1.0; // ?
  let e = (bits >>> 23) & 0xff; // ?
  // e = e - 150; // ?
  // let m = e == 0 ? (bits & 0x7fffff) << 1 : (bits & 0x7fffff) | 0x800000; // ?

  // FIXME doesn't hand negative
  var f1 = source / Math.pow(2, e - 1023);
  let m = Math.floor((f1 - 1) * Math.pow(2, 52)); // ?
  const f = Float32Array.of(sign * m * Math.pow(2, e))[0]; // ?

  // m = m | (sign === -1 ? 0x80000000 : 0); // ?

  const v2 = new DataView(new ArrayBuffer(6));
  v2.setUint8(0, 0x0e);
  v2.setUint8(1, e + 128);
  // v2.setUint32(2, (m >>> 1) | (sign === -1 ? 0x80000000 : 0), false); // ? v2.getUint32(2)
  v2.setUint32(2, m, false); // ? v2.getUint32(2)
  if (sign < 0) {
    const m1 = v2.getUint8(2);
    v2.setUint8(2, m1 | 0x80);
  }

  return new Uint8Array(v2.buffer);
};

export const _zxFloat = source => {
  const view = new DataView(new ArrayBuffer(4)); //Float32Array.of(source).buffer);
  view.setFloat32(0, source); // use little endian consistently
  const bits = view.getUint32(0); // ?

  const sign = bits >>> 31 == 1 ? -1 : 1; // ?
  let e = (bits >>> 23) & 0xff; // ?
  // e -= 127 // ?

  const m = e == 0 ? (bits & 0x7fffffff) << 1 : (bits & 0x7fffffff) | 0x800000; // ?
  const proof = sign * m * Math.pow(2, e - 150); // ?

  const v2 = new DataView(new ArrayBuffer(6));
  v2.setUint8(0, 0x0e);
  v2.setUint8(1, e + 128); // ? e + 128
  v2.setUint16(2, (m >>> 9) | (sign === -1 ? 0x0000 : 0x8000), false); // ? [(m >>> 9) | (sign === -1 ? 0x0000 : 0x8000)]

  return new Uint8Array(v2.buffer);
};

export const zxFloatToVal = source => {
  const view = new DataView(source.buffer);
  const exp = view.getUint8(0) - 128; // ?
  let mantissa = view.getUint32(1, false); // ? $ // 32bit
  let sign = mantissa >>> 31 ? -1 : 1; // ?

  mantissa = mantissa | 0x80000000;
  let frac = 0;
  for (let i = 0; i < 32; i++) {
    // FIXME
    if ((mantissa >> i) & (1 === 1)) {
      const v = Math.pow(2, -(32 - i));
      frac += v;
    }
  }

  frac = frac.toFixed(8); // ?

  const value = frac * Math.pow(2, exp);
  return value * sign; // ?
};

// 2.34e-1 => 0E 7E 6F 9D B2 2C = 0.234

// Array.from(zxFloat(-2.34e-1)).map(_ => toHex(_)); // ?
// const res = zxFloat(2.34e-1);
// Array.from(res).map(_ => toHex(_)); // ?

// 0E 7B 3F B1 5B 57 = 0.234
const res = zxFloat(2.34e-1);
// Array.from(res).map(_ => toHex(_)); // ?
// zxFloatToVal(res.slice(1)); // ?
// zxFloatToVal(new Uint8Array([0x7e, 0x6f, 0x9d, 0xb2, 0x2c])); // ?

// zxFloatToVal(new Uint8Array([0x7d, 0x1f, 0xbe, 0x76, 0xc8])); // ?
