import { Unpack, unpack } from '@remy/unpack';
import { readFileSync } from 'fs';
import { file2txt } from 'txt2bas';
const decode = (d) => new TextDecoder().decode(d);

export class Tzx extends Unpack {
  constructor(data) {
    super(data);
    this.header = this.parse('<A7$sig C$eof C$major C$minor');
    const blocks = [];
    let res = null;
    this.header; // ?

    while ((res = this.parse('C$type'))) {
      if (!blockTypes[res.type]) {
        const str = res.type.toString(16).padStart(2, '0').toUpperCase();
        throw new Error(
          `Not implemented 0x${str} - stopped at ${blocks.length}`
        );
      }
      blocks.push(new blockTypes[res.type](this));
    }

    this.blocks = blocks;
  }
}

export class TapFile {
  blocks = [];

  constructor(data) {
    this.data = data;
    const unpack = new Unpack(data);

    let res = null;
    while ((res = unpack.parse('<S'))) {
      const len = res[0];
      this.blocks.push(new Tap(unpack.parse(`C${len}$data`).data)); // ?
    }
  }
}

export class Tap {
  constructor(data) {
    this.data = data;
    const unpack = new Unpack(data);
    if (data.length === 19 && data[0] === 0x00) {
      this.header = unpack.parse(
        '<C$flagByte C$type A10$filename S$length S$p1 S$p2 C$checksum'
      );
    } else {
      const { bytes, flagByte, checksum } = unpack.parse(
        `<C$flagByte C${data.length - 2}$bytes C$checksum`
      );
      this.header = { flagByte, checksum };
      this.data = bytes;
    }

    this.length = this.data.length;
  }

  get type() {
    if (this.header.flagByte == 0) {
      return 'header';
    } else {
      return 'data';
    }
  }

  toString() {
    if (this.header.flagByte === 0) {
      return `${this.headerType()}: ${this.header.filename}`;
    } else if (this.length === 6912) {
      return `SCREEN$ data`;
    } else if (this.length === 768) {
      return `Font`;
    } else {
      return `${this.length} bytes of data`;
    }
  }

  peek() {
    try {
      const text = file2txt(this.data, { includeHeader: false });
      return text.slice(0, 200) + '...';
    } catch (e) {
      // noop
    }

    return decode(this.data.slice(0, 200));
  }

  headerType() {
    const type = this.header.type;
    if (type === 0) return 'Program';
    else if (type === 1) return 'Number array';
    else if (type === 2) return 'Character array';
    else if (type === 3) return 'Bytes';
  }
}

class TzxbTextDescription {
  id = 0x30;
  type = 'Text description';

  toString() {
    return this.filename;
  }

  constructor(unpack) {
    const length = unpack.parse('<C')[0];
    this.filename = unpack.parse(`<A${length}$filename`).filename;
  }
}

class TzxbData extends Tap {
  id = 0x10;
  type = 'Standard Speed Data Block';
  // https://www.worldofspectrum.org/TZXformat.html#STDSPEED
  constructor(unpack) {
    const len = unpack.parse('<xxS')[0];
    super(unpack.parse(`C${len}$data`).data);
  }
}

class TzxbArchiveInfo {
  id = 0x32;
  type = 'Archive info';
  identifications = [
    'Title',
    'Publisher',
    'Author',
    'Publication',
    'Language',
    'Type',
    'Price',
    'Loader',
    'Origin',
  ];

  constructor(unpack) {
    this.length = unpack.parse('<S')[0];
    this.data = unpack.parse(`C${this.length}$data`).data;
  }

  toString() {
    return this.peek().split('\n')[0].slice(0, 30) + ' ...';
  }

  peek() {
    let result = '';
    let ix = 0x01;
    const length = this.data[0];
    for (let _ in Array.from({ length })) {
      _ = unpack('C$tp C$tl', this.data.slice(ix, ix + 2));
      if (_ === null) {
        break;
      }
      const { tp, tl } = _;
      if (this.identifications[tp]) {
        result += this.identifications[tp];
      } else {
        result += 'Comment';
      }
      result += ': ';
      result += decode(this.data.slice(ix + 2, ix + 2 + tl))
        .replace(/\r/g, '\n')
        .replace(/\n/g, '\n\t')
        .trim();
      result += '\n';
      ix += 2 + tl;
    }
    return result;
  }
}

class TzxbHardwareType {
  id = 0x33;
  type = 'Hardware type';

  constructor(unpack) {
    const len = unpack.parse('<C')[0];
    this.data = unpack.parse(`C${len * 3}`)[0];
    this.length = this.data.length;
  }
}

class TzxbPause {
  id = 0x20;
  type = 'Pause';

  constructor(unpack) {
    this.length = unpack.parse('<S')[0];
  }
}

class TzxbGroupStart {
  id = 0x21;
  type = 'Group start';

  constructor(unpack) {
    const len = unpack.parse('<C')[0];
    this.data = unpack.parse(`C${len}`)[0];
  }

  toString() {
    return decode(this.data.slice(1)).trim();
  }
}

class TzxbPureTone {
  id = 0x12;
  type = 'Pure Tone';

  constructor(unpack) {
    this.data = unpack.parse('C4');
  }

  toString() {
    const { a, b } = unpack('<S$a S$b', this.data);
    return `${a} x ${b} T-states`;
  }
}

class TzxbPulseSequence {
  id = 0x13;
  type = 'Pulse Sequence';

  constructor(unpack) {
    this.data = unpack.parse('C')[0];
    const len = unpack.parse('<S', this.data)[0];
    this.data = unpack.parse(len * 2);
  }

  toString() {
    return `${this.data.length - 1} pulses`;
  }
}

class TzxbLoopStart {
  id = 0x24;
  type = 'Loop start';

  constructor(unpack) {
    this.data = unpack.parse('<s')[0];
  }

  toString() {
    this.data.toString();
  }
}

const blockTypes = {
  0x10: TzxbData,
  // 0x11: TzxbTurboData(),
  0x12: TzxbPureTone,
  0x13: TzxbPulseSequence,
  // 0x14: TzxbPureData(),
  // 0x15: TzxbDirectRecording(),
  // 0x16: TzxbC64Data(),
  // 0x17: TzxbC64TurboData(),
  // 0x18: TzxbCswRecording(),
  // 0x19: TzxbGeneralizedData(),
  0x20: TzxbPause,
  0x21: TzxbGroupStart,
  // 0x22: TzxbGroupEnd(),
  // 0x23: TzxbJumpTo(),
  0x24: TzxbLoopStart,
  // 0x25: TzxbLoopEnd(),
  // 0x26: TzxbCallSequence(),
  // 0x27: TzxbReturn(),
  // 0x28: TzxbSelect(),
  // 0x2a: TzxbStopTape48k(),
  // 0x2b: TzxbSetSignalLevel(),
  0x30: TzxbTextDescription,
  // 0x31: TzxbMessage(),
  0x32: TzxbArchiveInfo,
  0x33: TzxbHardwareType,
  // 0x34: TzxbEmulationInfo(),
  // 0x35: TzxbCustomInfo(),
  // 0x40: TzxbSnapshot(),
  // 0x4b: TzxbKansasCityStandard(),
  // 0x5a: TzxbGlue(),
};

// const data = readFileSync(__dirname + '/../../../assets/batman.tzx');
// const t = new Tzx(data);

// t.blocks[0].toString(); // ?
