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

// https://www.facebook.com/groups/ZXNextBasic/permalink/792585537934454/?comment_id=792727721253569
// by Daniel A. Nagy originally in C, bless his socks
export const floatToZX = input => {
  const sign = input < 0;
  const out = new Uint8Array(5);

  if (sign) input = -input;

  out[0] = 0x80;
  while (input < 0.5) {
    input *= 2;
    out[0]--;
  }

  while (input >= 1) {
    input *= 0.5;
    out[0]++;
  }

  input *= 0x100000000;
  input += 0.5;

  let mantissa = input;

  out[1] = mantissa >> 24;
  mantissa &= 0xffffff;
  out[2] = mantissa >> 16;
  mantissa &= 0xffff;
  out[3] = mantissa >> 8;
  mantissa &= 0xff;
  out[4] = mantissa;
  if (!sign) out[1] &= 0x7f;

  return out;
};

export const zxToFloat = source => {
  const view = new DataView(source.buffer);
  const exp = view.getUint8(0) - 128;
  let mantissa = view.getUint32(1, false);
  let sign = mantissa >>> 31 ? -1 : 1;

  mantissa = mantissa | 0x80000000;
  let frac = 0;
  for (let i = 0; i < 32; i++) {
    if ((mantissa >> i) & 1) {
      const v = Math.pow(2, -(32 - i));
      frac += v;
    }
  }

  frac = frac.toFixed(8);

  const value = frac * Math.pow(2, exp);
  return value * sign;
};
