const PROGRAM = 0;
const DATA = 3;
const BASIC = 0;
const CODE = 1;
const BANK = 2;
const SCREEN = 3;

class Block {
  _filename = '';
  _type = PROGRAM;
  _dataType = BASIC;
  _p1 = 0;
  _p2 = 0;
  data = null;

  constructor({ filename, data, order }) {
    this.data = checkForHeader(data);
    this.filename = filename;
    this.type = PROGRAM;
    this.order = order;
  }

  set p1(p1) {
    this._p1 = p1;
  }

  get p1() {
    return this._p1;
  }

  set p2(p2) {
    this._p2 = p2;
  }

  get p2() {
    return this._p2;
  }

  set type(value) {
    value = parseInt(value, 10);
    this._type = value;
    if (value === 0) {
      this.p1 = 10;
      this.p2 = this.data.length;
      this._dataType = BASIC;
    } else {
      this.p1 = 10;
    }
  }

  get type() {
    return this._type;
  }

  set dataType(value) {
    value = parseInt(value, 10);
    if (value === BASIC) {
      this._type = PROGRAM;
      this.p2 = this.data.length;
      return;
    } else {
      this._type = DATA;
    }
    this._dataType = value;
    this.p2 = 0x8000;
    if (value === SCREEN) {
      this.p1 = 0x4000;
    }

    if (value === BANK) {
      this.p1 = 0xc000;
    }

    if (value === CODE) {
      this.p1 = 0;
    }
  }

  get dataType() {
    return this._dataType;
  }

  set filename(value) {
    this._filename = value.slice(0, 10).padEnd(' ', 10);
  }

  get filename() {
    return this._filename;
  }
}

export class Tapper extends Array {
  add({ file, data }) {
    const filename = file.name;
    const block = new Block({ filename, data, order: this.length + 1 });
    if (filename.toUpperCase().endsWith('.SCR')) {
      block.type = DATA;
      block.dataType = SCREEN;
    }
    this.push(block);
    return block;
  }

  setType(type) {
    const curr = this[this.length - 1];
    curr.type = type;
  }

  setDataType(type) {
    const curr = this[this.length - 1];
    curr.dataType = type;
  }

  generate() {
    return tapper(this);
  }
}

const encode = (a) => {
  a = a.toString();
  const res = [];
  for (let i = 0; i < a.length; i++) {
    res.push(a.charCodeAt(i));
  }
  return Uint8Array.from(res);
};

const calculateXORChecksum = (array) => {
  const byte = new DataView(Uint8Array.of(0).buffer);
  for (let i = 0; i < array.length; i++) {
    byte.setUint8(0, byte.getUint8(0) ^ array[i]);
  }

  return byte.getUint8(0);
};

const tapHeader = (
  code,
  { filename = 'BASIC', autostart = 0, type = 0, p2 = null } = {}
) => {
  const header = new Uint8Array(21);
  const dataView = new DataView(header.buffer);

  let p1 = autostart;
  if (type === 0 && p2 === null) {
    p2 = code.length;
  }
  if (type === 3) {
    if (p2 === null) p2 = 32768;
    p1 = autostart || 0;
  }

  dataView.setUint16(0, 19, true); // header length
  dataView.setUint8(2, 0); // flag byte
  dataView.setUint8(3, type); // [Program, Number array, Character array, Code file]
  header.set(encode(filename.padEnd(10, ' ').slice(0, 10)), 4);
  dataView.setUint16(14, code.length, true);
  dataView.setUint16(16, p1, true);
  dataView.setUint16(18, p2, true);
  const checksum = calculateXORChecksum(header.slice(2, 20), true);
  dataView.setUint8(20, checksum);

  return header;
};

// const param2 = [0, 12 << 12, 0xfa00, 12 << 12];

function basename(path) {
  return path.split('/').pop();
}

export default function tapper(files) {
  const length = files.reduce((acc, curr) => {
    return acc + 21 + curr.data.length + 4;
  }, 0);

  const tap = new Uint8Array(length);
  const dataView = new DataView(tap.buffer);
  let offset = 0;

  files
    .sort((a, b) => {
      return a.order - b.order;
    })
    .forEach((block) => {
      const filename = basename(block.filename);
      const data = block.data;

      // let type = i === 0 ? 0 : 3;
      // let autostart = 10;
      // let p2 = null;

      // if (filename.toLowerCase().endsWith('.scr')) {
      //   autostart = 0x4000;
      //   type = 3;
      // } else if (filename.toLowerCase().endsWith('.bas')) {
      //   type = 0;
      //   autostart = 10;
      // } else {
      //   autostart = 0xc000; // 0xC000 for a bank
      //   p2 = 0x8000;
      // }

      const header = tapHeader(data, {
        filename,
        autostart: block.p1,
        type: block.type,
        p2: block.p2,
      });

      tap.set(header, offset);
      offset += header.length;
      dataView.setUint16(offset, data.length + 2, true);
      offset += 2;
      dataView.setUint8(offset, 0xff);
      offset += 1;
      tap.set(data, offset);
      const checksum = calculateXORChecksum(
        tap.slice(offset - 1, offset + data.length)
      );
      offset += data.length;
      dataView.setUint8(offset, checksum, true);
      offset += 1;
    });

  return tap;
}

function checkForHeader(code) {
  const sig = code.slice(0, 8);
  if (new TextDecoder().decode(sig) === 'PLUS3DOS') {
    return code.slice(128);
  }
  return code;
}
