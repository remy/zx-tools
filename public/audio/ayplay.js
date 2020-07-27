import { encode } from '../lib/encode';
/**
 * @typedef { import("./afx").Effect } Effect
 */

const AY_CLOCK = 1773400;
const MIX_RATE = 44100;
const max_fx_len = 0x1000;

const volTab = Int32Array.from([
  0,
  836 / 3,
  1212 / 3,
  1773 / 3,
  2619 / 3,
  3875 / 3,
  5397 / 3,
  8823 / 3,
  10392 / 3,
  16706 / 3,
  23339 / 3,
  29292 / 3,
  36969 / 3,
  46421 / 3,
  55195 / 3,
  65535 / 3,
]);

/**
 * @class
 */
class Tone {
  /** @type {number} */
  count = 0;
  /** @type {number} */
  state = 0;
}

/**
 * @class
 */
class Noise {
  /** @type {number} */
  count = 0;
  /** @type {number} */
  reg = 0;
  /** @type {number} */
  qcc = 0;
  /** @type {number} */
  state = 0;
}

/**
 * @class
 */
class Chip {
  /** @type {Tone[]} */
  tone = [new Tone()];

  /** @type {Noise}*/
  noise = new Noise();

  /** @type {number[]}*/
  reg = new Int32Array(16);

  /** @type {number[]}*/
  dac = new Uint8Array(1);

  /** @type {number} */
  out = 0;

  /** @type {number} */
  freqDiv = 0;
}

/**
 * @param {Chip} ay
 */
function ayInit(ay) {
  ay.noise.reg = 0x0ffff;
  ay.noise.qcc = 0;
  ay.noise.state = 0;
}

/**
 * @param {Chip} ay
 * @param {number} ticks
 */
function ayTick(ay, ticks) {
  let noise_di;
  let aa, ta, na;

  ay.out = 0;

  for (aa = 0; aa < ticks; ++aa) {
    //�������� �������� �������

    ay.freqDiv ^= 1;

    //���������
    if (ay.tone[0].count >= (ay.reg[0] | (ay.reg[1] << 8))) {
      ay.tone[0].count = 0;
      ay.tone[0].state ^= 1;
    }

    ++ay.tone[0].count;

    if (ay.freqDiv) {
      //��� (�������� ��������, (C)HackerKAY)

      if (ay.noise.count == 0) {
        noise_di = ay.noise.qcc ^ ((ay.noise.reg >> 13) & 1) ^ 1;
        ay.noise.qcc = (ay.noise.reg >> 15) & 1;
        ay.noise.state = ay.noise.qcc;
        ay.noise.reg = (ay.noise.reg << 1) | noise_di;
      }

      ay.noise.count = (ay.noise.count + 1) & 31;

      if (ay.noise.count >= ay.reg[6]) ay.noise.count = 0;
    }

    //������

    ta = ay.tone[0].state | ((ay.reg[7] >> 0) & 1);
    na = ay.noise.state | ((ay.reg[7] >> 3) & 1);

    if (ta & na) ay.dac[0] = ay.reg[8];
    else ay.dac[0] = 0;

    ay.out += volTab[ay.dac[0]];
  }
}

/**
 *
 * @param {Chip} ay
 * @param {number} reg
 * @param {number} value
 */
function ayOut(ay, reg, value) {
  switch (reg) {
    case 1:
      value &= 15;
      break;
    case 0:
    case 7:
      break;
    case 8:
    case 6:
      value &= 31;
      break;
    default:
      return;
  }

  ay.reg[reg] = value;
}

/**
 * Convert an effect to a wave file buffer
 *
 * @param {Effect} effect
 * @returns {Uint8Array} WAV binary data
 */
export default function effectToWave(effect) {
  let ay = new Chip();
  window.ay = ay;
  let ifrq = MIX_RATE / 50;

  let frameCount = effect.length + 3;
  let slen = ifrq * frameCount;
  let flen = slen * 2 + 44;
  let waveSize = flen;
  const data = new Uint8Array(waveSize);
  const view = new DataView(data.buffer);

  // header
  data.set(encode('RIFF'), 0);
  view.setUint32(4, flen - 8, true);
  data.set(encode('WAVEfmt '), 8);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, MIX_RATE, true);
  view.setUint32(28, MIX_RATE * 2, true);
  view.setUint32(32, 2, true);
  view.setUint32(34, 16, true); // this seems like a mistake…
  data.set(encode('data'), 36);
  view.setUint32(40, slen * 2, true);

  let pp = 44;
  let icnt = 0;
  ayInit(ay);
  // pp = off;

  let i = 0;
  let printed = false;

  let tick = (AY_CLOCK / 8 / MIX_RATE) | 0;

  const waveData = new Uint8Array(slen * 2);

  for (let aa = 0; aa < slen; aa++) {
    ayTick(ay, tick);

    if (icnt++ >= ifrq) {
      icnt = 0;

      if (i < max_fx_len) {
        const frame = effect.get(i, true);
        ayOut(ay, 0, frame.tone & 255);
        ayOut(ay, 1, frame.tone >> 8);
        ayOut(ay, 6, frame.noise);
        ayOut(ay, 7, 0xf6 | (frame.t ? 0 : 1) | (frame.n ? 0 : 8));
        ayOut(ay, 8, frame.volume);
      }

      i++;
    }

    const point = ay.out / tick;

    waveData[aa * 2] = point;
    waveData[aa * 2 + 1] = point >> 8;
  }

  data.set(waveData, pp);

  return data;
}
