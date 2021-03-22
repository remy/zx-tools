import {
  SAMPLE_RATE,
  T,
  HIGH,
  LOW,
  PILOT,
  LOADER,
  PILOT_COUNT,
  PILOT_DATA_COUNT,
  encode,
  byteAsWord,
  ZERO,
  ONE,
  SYN_ON,
  SYN_OFF,
} from './audio-consts.js';

const calculateXORChecksum = (array) =>
  Uint8Array.of(array.reduce((checksum, item) => checksum ^ item, 0))[0];

const zeroBit = generateBit(ZERO);
const oneBit = generateBit(ONE);

const FILE_TYPE = new Map([
  ['PROGRAM', 0],
  ['CODE', 0x03],
]);

/**
 * Generates AudioContext buffer compatible values into options.output
 * @param {Object} options - options to generate samples
 * @param {Float32Array} options.output - array buffer to mutate
 * @param {Number} options.i - offset to insert samples into output
 * @param {Number} options.pulse - pulse length in t-states
 * @param {Number=HIGH} options.value - value to use for sample
 * @returns {Number} Updated offset
 */
export function generateFlatSamples({ output, offset, pulse, value = HIGH }) {
  pulse = pulse * T * SAMPLE_RATE;
  // round values to integers
  offset = (offset + 0.5) | 0;
  pulse = (offset + pulse + 0.5) | 0;
  for (; offset < pulse; offset++) {
    const noise = 0; //Math.random() * 0.01 * (value < 0 ? -1 : 1);
    output[offset] = value + noise;
  }

  return pulse;
}

function generateBit(pulse) {
  const output = new Float32Array((pulse * 2 * T * SAMPLE_RATE + 0.5) | 0);
  generateFlatSamples({
    output,
    offset: 0,
    pulse,
    value: HIGH,
  });

  const offset = pulse * T * SAMPLE_RATE;
  generateFlatSamples({
    output,
    offset,
    pulse,
    value: LOW,
  });

  return output;
}

function generateSilence({ output, offset = 0, count = PILOT_DATA_COUNT }) {
  const pulse = PILOT;

  // small bug in my own logic, this produces 8064 half pulses
  // this is because the immediately next pulse is a syn on, which
  // is also high, so it doesn't offer any edge detection.
  for (let i = 0; i < count; i++) {
    offset = generateFlatSamples({
      output,
      offset,
      pulse,
      value: 0,
    });
  }

  return offset;
}

function generatePilot({ output, offset = 0, count = PILOT_COUNT }) {
  const pulse = PILOT;

  // small bug in my own logic, this produces 8064 half pulses
  // this is because the immediately next pulse is a syn on, which
  // is also high, so it doesn't offer any edge detection.
  for (let i = 0; i < count; i++) {
    offset = generateFlatSamples({
      output,
      offset,
      pulse,
      value: i % 2 === 0 ? LOW : HIGH,
    });
  }

  return offset;
}

export function generateByte({ offset = 0, output, byte }) {
  for (let i = 0; i < 8; i++) {
    // IMPORTANT: this is specifically a left shift AND 128 so that
    // the bits are collected in the correct order to build up a byte.
    // using a left shift reads from left to right through the byte,
    // and using logical AND to 128 (0b10000000) it allows me to test
    // for the most significant bit, and correctly build the byte,
    // bit by bit (as it were).
    const bit = ((byte << i) & 128) === 128 ? ONE : ZERO;
    const buffer = bit === ONE ? oneBit : zeroBit;
    output.set(buffer, offset);
    offset += buffer.length;
  }
  return offset;
}

export function generateBytes({
  offset = 0,
  data,
  output,
  addChecksum = false,
  dataType,
}) {
  offset = generateByte({ offset, output, byte: dataType }); // data block

  for (let j = 0; j < data.length; j++) {
    const byte = data[j];
    offset = generateByte({ offset, output, byte });
  }

  if (addChecksum) {
    offset = generateByte({
      offset,
      output,
      byte: calculateXORChecksum([dataType, ...data]),
    });
  }

  // always append a single pulse so that the edge detection works
  // otherwise the last bit is /""\__ and no final (upward) edge
  offset = generateFlatSamples({
    output,
    offset,
    pulse: ZERO,
    value: HIGH,
  });

  return offset;
}

export function calculateSampleSize(...pulses) {
  return (
    (pulses.reduce((acc, curr) => (acc += curr), 0) * T * SAMPLE_RATE + 0.5) | 0
  );
}

/**
 * @param {object} block
 * @param {AudioContext} block.ctx Audio context
 * @param {Uint8Array} block.data Fully formed binary data
 * @param {string} block.filename 10 chr filename
 * @param {number} block.param1 Autostart line (0x4000 for screen data)
 * @param {number} block.param2 Memory start for vars (optional)
 * @param {number} block.type type lookup
 * @returns {AudioBuffer}
 */
export function generateBlock({
  ctx,
  data,
  param1,
  param2 = null,
  filename,
  type = 'PROGRAM',
}) {
  const filetype = FILE_TYPE.get(type);

  if (param2 === null) {
    if (param1 === 0x4000) param2 = 0x8000;
    else param2 = data.length;
  }

  // pre-calculate the count of samples required
  const SILENCE = PILOT_DATA_COUNT * PILOT;
  const length = calculateSampleSize(
    PILOT_COUNT * PILOT,
    SYN_ON * 2,
    SYN_OFF * 2,
    SILENCE * 2,
    PILOT_DATA_COUNT * PILOT,
    ONE * 2, // closing pulses
    19 * 8 * (ONE * 2), // flag + file type + header (16) + parity
    data.length * 8 * (ONE * 2),
    (1 + 1) * 8 * (ONE * 2) // length, file type, parity
  );

  // the +0.5 is just a little "wiggle" room
  const buffer = ctx.createBuffer(1, (length + 0.5) | 0, SAMPLE_RATE);
  const output = buffer.getChannelData(0);

  // pilot tone
  // eslint-disable-next-line no-unused-vars
  let offset = generatePilot({ output });

  // syn on
  offset = generateFlatSamples({
    output,
    offset,
    pulse: SYN_ON,
    value: HIGH,
  });

  // syn off
  offset = generateFlatSamples({
    output,
    offset,
    pulse: SYN_OFF,
    value: LOW,
  });

  // header block type: 0x00
  offset = generateBytes({
    output,
    offset,
    dataType: 0x00,
    addChecksum: true,
    data: headerAsBytes({
      filetype,
      filename,
      length: data.length,
      param1,
      param2,
    }),
  });

  offset = generateSilence({
    output,
    offset,
  });

  offset = generatePilot({ offset, output, count: PILOT_DATA_COUNT });

  // syn on
  offset = generateFlatSamples({
    output,
    offset,
    pulse: SYN_ON,
    value: HIGH,
  });

  // syn off
  offset = generateFlatSamples({
    output,
    offset,
    pulse: SYN_OFF,
    value: LOW,
  });

  offset = generateBytes({
    offset,
    output,
    data,
    addChecksum: true,
    dataType: 0xff,
  });

  offset = generateSilence({
    output,
    offset,
  });

  return buffer;
}

export function generateAutoLoaderForScreen({ ctx }) {
  return generateBlock({
    ctx,
    data: LOADER,
    filename: 'tap dot js',
    param1: 10, // Autostart LINE Number
    param2: LOADER.length, // Size of the PROG area aka start of the VARS area
    type: 'PROGRAM',
  });
}

export function generateScreenBlock({ ctx, data, filename = 'image.scr' }) {
  return generateBlock({
    ctx,
    data,
    filename,
    param1: 0x4000, // 0x4000 for SCREEN$
    param2: 0x8000,
    type: 'CODE',
  });
}

export function combineTapImages(ctx, ...taps) {
  let length = 0;
  const buffers = taps.map((tap) => {
    const buffer = tap.getChannelData(0);
    length += buffer.length;
    return buffer;
  });

  const buffer = ctx.createBuffer(1, (length + 0.5) | 0, SAMPLE_RATE);
  const output = buffer.getChannelData(0);

  let offset = 0;

  buffers.forEach((buffer) => {
    output.set(buffer, offset);
    offset += buffer.length;
  });

  return buffer;
}

export function generateROMImage({ ctx, data, filename }) {
  const loader = generateAutoLoaderForScreen({ ctx });
  const screen = generateScreenBlock({ ctx, data, filename });

  return combineTapImages(ctx, loader, screen);
}

export function generateROMImageAsTap({ ctx, data }) {
  const loader = generateBlock({
    ctx,
    data: LOADER,
    filename: 'tap dot js',
    param1: 10, // Autostart LINE Number
    param2: LOADER.length, // Size of the PROG area aka start of the VARS area
    type: 'PROGRAM',
  });

  const screen = generateBlock({
    ctx,
    data,
    filename: 'image.scr',
    param1: 0x4000, // 0x4000 for SCREEN$
    param2: 0x8000,
    type: 'CODE',
  });

  return combineTapImages(ctx, loader, screen);
}

export function headerAsBytes({
  filename = 'ZX Spectrum',
  filetype = 0x03, // or 0xff
  length,
  param1 = 0x4000,
  param2 = 0x8000,
}) {
  return new Uint8Array([
    filetype,
    ...encode(filename.padEnd(10, ' ').slice(0, 10)), // Name (filename 10 chars padded with white space)
    ...byteAsWord(length),
    ...byteAsWord(param1),
    ...byteAsWord(param2),
  ]);
}
