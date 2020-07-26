import effectToWave from './ayplay';

/**
 * @class
 * @type {Effect}
 */
export class Effect {
  /** @type {EffectFrame[]} */
  frames = [];

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
    return this.frames.length;
  }

  /** @type {EffectFrame} */
  get last() {
    return this.frames[this.frames.length - 1];
  }

  /**
   * @param {EffectFrame} frame
   * @returns {number} - length of frames
   */
  push(frame) {
    return this.frames.push(frame);
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
      this.frames.push(frame);
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
  tone = 0;

  /** @type {number} noise 8 bit noise period */
  noise = 0;
}

/**
 * @class
 */
export class Bank {
  /** @type {Effect[]} */
  effects = [];

  /** @private */
  _selected = 0;

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

  /**
   *
   * @param {Uint8Array} data source data from a .afb file
   */
  constructor(data) {
    this.data = data;
    this.loadBank();
  }

  /** @type {Effect} */
  get effect() {
    console.log('returning ' + this._selected);

    return this.effects[this._selected];
  }

  /**
   * Loads a new effect, sets the current point to it, and returns it
   *
   * @param {Uint8Array} data
   * @returns {Effect}
   */
  addEffect(data) {
    const effect = new Effect(data, data.length);

    this.effects.push(effect);
    this._selected = this.effects.length - 1;

    return effect;
  }

  loadBank() {
    const data = this.data;
    const view = new DataView(data);
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
