import effectToWave from './ayplay';
import { encode } from '../lib/encode';

const maxEffectLength = 0x1000;

/**
 * @class
 * @type {Effect}
 */
export class Effect {
  /** @type {Map<EffectFrame>} */
  frames = new Map();

  /** @type {string} */
  name = '';

  /**
   * @param {Uint8Array} [data]
   * @param {number} [length]
   */
  constructor(data = null, length) {
    if (data) this.load(data, length);
  }

  /** @type {number} */
  get length() {
    return this.frames.size;
  }

  /** @type {EffectFrame} */
  get last() {
    return this.frames.get(this.frames.size - 1);
  }

  /**
   * Gets the specific frame, also creating it if it doesn't exist
   *
   * @param {number} index
   * @param {boolean} [getEmpty=false] by default get will make a new frame, this disables that
   * @returns {EffectFrame}
   */
  get(index, getEmpty = false) {
    if (this.frames.has(index)) {
      return this.frames.get(index);
    }

    const frame = new EffectFrame();

    if (getEmpty) {
      return frame;
    }
    this.frames.set(index, frame);

    return frame;
  }

  export() {
    const data = new Uint8Array(maxEffectLength * 4);
    const length = this.length;
    let tone = 0;
    let noise = 0;
    let ptr = 0;
    let it;

    for (let i = 0; i < length; i++) {
      const frame = this.get(i);
      it = frame.volume & 0x0f;
      it |= frame.t ? 0 : 1 << 4;
      it |= frame.n ? 0 : 1 << 7;
      if (frame.tone != tone) {
        tone = frame.tone;
        it |= 1 << 5;
      }
      if (frame.noise != noise) {
        noise = frame.noise;
        it |= 1 << 6;
      }
      data[ptr++] = it;
      if (it & (1 << 5)) {
        data[ptr] = tone & 0xfff;
        data[ptr + 1] = (tone & 0xfff) >> 8;
        ptr += 2;
      }
      if (it & (1 << 6)) {
        data[ptr++] = noise & 0x1f;
      }
    }

    data[ptr++] = 0xd0; // effect group end marker
    data[ptr++] = 0x20;

    return new Uint8Array(data.slice(0, ptr));
  }

  /**
   * @param {EffectFrame} frame
   * @returns {number} - length of frames
   */
  push(frame) {
    return this.frames.set(this.frames.size, frame);
  }

  /**
   * @returns {Uint8Array} WAV encoded data
   */
  play() {
    return effectToWave(this);
  }

  /**
   * @param {Uint8Array} data
   * @param {number} length Length of bytes
   * @returns {number} number of bytes used
   */
  load(data, length) {
    const view = new DataView(data.buffer);
    let offset = 0;
    for (; offset < length; ) {
      const frame = new EffectFrame();
      const byte = view.getUint8(offset++);

      let tone = 0;
      let noise = 0;

      if (byte & (1 << 5)) {
        tone = view.getUint16(offset, true) & 0xfff;
        offset += 2;
      }

      if (byte & (1 << 6)) {
        noise = view.getUint8(offset++);
        if (byte === 0xd0 && noise >= 0x20) {
          break;
        }
        noise &= 0x1f;
      }

      frame.tone = tone;
      frame.noise = noise;
      frame.volume = byte & 0x0f;
      frame.t = !(byte & (1 << 4));
      frame.n = !(byte & (1 << 7));
      this.push(frame);
    }

    return offset;
  }
}

/**
 * @class
 * @type {EffectFrame}
 */
class EffectFrame {
  /** @type {boolean} t Tone flag */
  t = false;

  /** @type {boolean} n Noise flag */
  n = false;

  /** @type {number} volume 0-15 volume */
  volume = 0;

  /** @type {number} tone 16 bit tone period */
  tone = -1;

  /** @type {number} noise 8 bit noise period */
  noise = -1;
}

/**
 * @class
 */
export class Bank {
  /** @type {Effect[]} */
  effects = [];

  /** @private */
  _selected = 0;

  /**
   * @param {Uint8Array} data source data from a .afb file
   */
  constructor(data) {
    this.data = data;
    if (data) this.loadBank(data);
    else {
      this.effects.push(new Effect());
    }
  }

  /** @type {number} Current selected bank */
  get selected() {
    return this._selected;
  }

  /** @type {number} Current selected bank */
  set selected(value) {
    if (value < 0) {
      this._selected = 0;
    } else if (value >= this.effects.length) {
      this._selected = this.effects.length - 1;
    } else {
      this._selected = value;
    }

    return this._selected;
  }

  /** @type {Effect} */
  get effect() {
    return this.effects[this._selected];
  }

  /**
   * @returns {Uint8Array} afb bank compatible data
   */
  save() {
    const length = this.effects.length;
    const data = new Uint8Array(maxEffectLength * length + 260 * length);

    data[0] = length & 0xff;
    let pp = 2 * length + 1;
    let i, offset;

    for (i = 0; i < length; i++) {
      offset = pp - i * 2 - 2;
      data[1 + i * 2] = offset;
      data[1 + i * 2 + 1] = offset >> 8;
      const effect = this.effects[i];
      const effectData = effect.export();
      data.set(effectData, pp);
      pp += effectData.length;

      if (effect.name.length) {
        data.set(encode(effect.name), pp);
        pp += effect.name.length;
        data[pp++] = 0;
      }
    }

    return data.slice(0, pp);
  }

  /**
   * Loads a new effect, sets the current point to it, and returns it
   *
   * @param {Uint8Array} data
   * @param {string} [name]
   * @param {boolean} [select=true]
   * @returns {Effect}
   */
  addEffect(data, name = 'noname', select = true) {
    const effect = new Effect(data, data.length);
    effect.name = name;

    this.effects.push(effect);
    if (select) {
      this._selected = this.effects.length - 1;
    }

    return effect;
  }

  /**
   * Create a new empty effect
   *
   * @returns {Effect}
   */
  add() {
    const effect = new Effect();
    this.effects.push(effect);
    this._selected = this.effects.length - 1;

    return effect;
  }

  /**
   * Removes and effect from the bank
   *
   * @param {number} index index of effect
   * @returns {Effect}
   */
  delete(index = this._selected) {
    const effect = this.effects[index];
    this.effects.splice(index, 1);
    return effect;
  }

  /**
   * Load the file as bank of effects
   *
   * @param {Uint8Array} data afb bank data from AYFX Editor
   */
  loadBank(data) {
    const view = new DataView(data.buffer);
    const total = view.getUint8(0);
    const effects = [];

    /*
   *  +1 (2 bytes per effect) Table of offsets to data of every effect. Offset value is given relative to the second byte of the offset itself, this allows to calculate absolute address very fast:

   hl=offset in the effects table
   ld c,(hl)
   inc hl
   ld b,(hl)
   add hl,bc
   hl=absolute address of effect data

   // effect
    bit0..3  Volume
    bit4     Disable T
    bit5     Change Tone
    bit6     Change Noise
    bit7     Disable N

     When the bit5 set, two bytes with tone period will follow; when the bit6 set, a single byte with noise period will follow; when both bits are set, first two bytes of tone period, then single byte with noise period will follow. When none of the bits are set, next flags byte will follow.

    End of the effect is marked with byte sequence #D0, #20. Player should detect it before outputting it to the AY registers, by checking noise period value to be equal #20. The editor considers last non-zero volume value as the last frame of an effect, other parameters aren't matter.
  */

    const offsets = [];
    for (let i = 0; i < total; i++) {
      let offset = view.getUint16(1 + i * 2, true) + 2 + i * 2;
      offsets.push(offset);
    }

    for (let i = 0; i < total; i++) {
      let offset = offsets[i];
      let length = 0;

      // length is worked out by getting the position of the next offset
      if (i < total - 1) {
        length = offsets[i + 1] - offset;
      } else {
        length = view.byteLength - offset;
      }

      const end = offset + length;

      const effect = new Effect();
      const endPos = effect.load(
        new Uint8Array(view.buffer.slice(offset, end)),
        length
      );

      if (offset + endPos < end) {
        effect.name = new TextDecoder().decode(
          data.slice(offset + endPos, end - 1)
        );
      }

      effects.push(effect);
    }

    this.effects = effects;
  }
}
