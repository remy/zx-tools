export const SAMPLE_RATE = 44100;
export const T = 1 / 3500000; // pulse width (half a wave cycle) in ms @ 3.5Mhz

/**
 * notes
 * 440Hz = 1 tick every 2.2727ms
 * 855 * 2 * T = 1710 * T = ZERO bit sound = 0.489ms
 * 1.19047619ms ~ the 840Hz which should be equal to 2168 T (.619428571ms)
 * Pilot is 2168 T for a length of 8063, therefore: (8063 * 2168) * (1/3500000) = ~5 (5 seconds)
 */

export const asHz = pulse => 1 / (T * pulse);
export const toAngularFrequency = hz => hz * 2 * Math.PI;

// these are how high and low the pulse value goes in the audio buffer
// 1 and -1 being the extreme max
export const HIGH = 1; // 0.15;
export const LOW = -1; //-0.15;

// pulse lengths defined by ZX ROM documentation
export const PILOT = 2168;
export const PILOT_COUNT = 8063;
export const PILOT_DATA_COUNT = 3223;
export const ZERO = 855;
export const ONE = 2 * ZERO;
export const SYN_ON = 667;
export const SYN_OFF = 735;

/*
  This is bytecode for:
  10 PAPER 1: INK 7: CLS
  20 LOAD "" SCREEN$

  compiled with:
  ./bas2tap -a10 -s"tap dot js" loader.bas # autostart line 10
*/
export const LOADER = [
  0x00,
  0x0a,
  0x03,
  0x00,
  0x20,
  0xfb,
  0x0d,
  0x00,
  0x14,
  0x07,
  0x00,
  0x20,
  0xef,
  0x22,
  0x22,
  0x20,
  0xaa,
  0x0d,
  0x00,
  0x1e,
  0x0a,
  0x00,
  0x20,
  0xf2,
  0x30,
  0x0e,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00,
  0x0d,
];

/**
 * Returns string
 * @param {Uint8Array} a
 */
export const decode = a => new TextDecoder().decode(a);

/**
 * Encodes to hex
 * @param {String} a
 * @returns Uint8Array
 */
export const encode = a => new TextEncoder().encode(a);

/**
 * Returns XOR checksum for array
 * @param {Uint8Array} array
 */
export const calculateXORChecksum = array =>
  array.reduce((checksum, item) => checksum ^ item, 0);

// words in ZX81 are LSb / little endian
export function byteAsWord(byte) {
  return [
    byte & 0xff, // LSb
    byte >> 8,
  ];
}

/**
 * converts to little endian
 * @param {TypedArray} byte
 */
function toLittle(bytes) {
  const size = 8 * bytes.length;
  const dv = new DataView(bytes.buffer);

  const little = dv[`getUint${size}`](0, /* little endian data */ true);

  return new Uint8Array(
    little
      .toString(16)
      .padStart(bytes.length * 2, '0')
      .match(/(..?)/g)
      .map(b => parseInt(b, 16))
  );
}
