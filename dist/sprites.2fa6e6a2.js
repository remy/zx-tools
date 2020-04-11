// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"lib/dnd.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = drop;

function drop(root, callback) {
  root.ondragover = () => false;

  root.ondragend = () => false;

  root.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    console.log('on ', root);
    const droppedFile = e.dataTransfer.files[0];
    const reader = new FileReader();

    reader.onload = event => {
      callback(new Uint8Array(event.target.result));
    };

    reader.readAsArrayBuffer(droppedFile);
  }, false);
}
},{}],"sprites/lib/colour.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rgbFromIndex = rgbFromIndex;
exports.toRGB332 = toRGB332;
exports.transparent = void 0;

function rgbFromIndex(index) {
  if (index === 0xe3) {
    return {
      r: 0,
      g: 0,
      b: 0,
      a: 0
    };
  }

  let r = index >> 5 & 0x7;
  let g = index >> 2 & 0x7;
  let b = index >> 0 & 0x3; //make a pure RGB332 colour

  return {
    r: r * 255.0 / 7.0,
    g: g * 255.0 / 7.0,
    b: b * 255.0 / 3.0,
    a: 255
  };
}

function toRGB332(r, g, b) {
  return (Math.floor(r / 32) << 5) + (Math.floor(g / 32) << 2) + Math.floor(b / 64);
}

const transparent = 0xe3;
exports.transparent = transparent;
},{}],"lib/save.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _default = function () {
  var a = document.createElement('a');
  document.body.appendChild(a);
  a.style = 'display: none';
  return function (data, fileName) {
    let blob = null;

    if (data instanceof Blob) {
      blob = data;
    } else {
      if (!Array.isArray(data)) {
        data = [data];
      }

      blob = new Blob(data, {
        type: 'octet/stream'
      });
    }

    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };
}();

exports.default = _default;
},{}],"sprites/lib/zlib.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.FlateStream = exports.DecodeStream = void 0;

/*
 * Extracted from pdf.js
 * https://github.com/andreasgal/pdf.js
 *
 * Copyright (c) 2011 Mozilla Foundation
 *
 * Contributors: Andreas Gal <gal@mozilla.com>
 *               Chris G Jones <cjones@mozilla.com>
 *               Shaon Barman <shaon.barman@gmail.com>
 *               Vivien Nicolas <21@vingtetun.org>
 *               Justin D'Arcangelo <justindarc@gmail.com>
 *               Yury Delendik
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
const DecodeStream = function () {
  function constructor() {
    this.pos = 0;
    this.bufferLength = 0;
    this.eof = false;
    this.buffer = null;
  }

  constructor.prototype = {
    ensureBuffer: function decodestream_ensureBuffer(requested) {
      var buffer = this.buffer;
      var current = buffer ? buffer.byteLength : 0;
      if (requested < current) return buffer;
      var size = 512;

      while (size < requested) size <<= 1;

      var buffer2 = new Uint8Array(size);

      for (var i = 0; i < current; ++i) buffer2[i] = buffer[i];

      return this.buffer = buffer2;
    },
    getByte: function decodestream_getByte() {
      var pos = this.pos;

      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }

      return this.buffer[this.pos++];
    },
    getBytes: function decodestream_getBytes(length) {
      var pos = this.pos;

      if (length) {
        this.ensureBuffer(pos + length);
        var end = pos + length;

        while (!this.eof && this.bufferLength < end) this.readBlock();

        var bufEnd = this.bufferLength;
        if (end > bufEnd) end = bufEnd;
      } else {
        while (!this.eof) this.readBlock();

        var end = this.bufferLength;
      }

      this.pos = end;
      return this.buffer.subarray(pos, end);
    },
    lookChar: function decodestream_lookChar() {
      var pos = this.pos;

      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }

      return String.fromCharCode(this.buffer[this.pos]);
    },
    getChar: function decodestream_getChar() {
      var pos = this.pos;

      while (this.bufferLength <= pos) {
        if (this.eof) return null;
        this.readBlock();
      }

      return String.fromCharCode(this.buffer[this.pos++]);
    },
    makeSubStream: function decodestream_makeSubstream(start, length, dict) {
      var end = start + length;

      while (this.bufferLength <= end && !this.eof) this.readBlock();

      return new Stream(this.buffer, start, length, dict);
    },
    skip: function decodestream_skip(n) {
      if (!n) n = 1;
      this.pos += n;
    },
    reset: function decodestream_reset() {
      this.pos = 0;
    }
  };
  return constructor;
}();

exports.DecodeStream = DecodeStream;

const FlateStream = function () {
  var codeLenCodeMap = new Uint32Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
  var lengthDecode = new Uint32Array([0x00003, 0x00004, 0x00005, 0x00006, 0x00007, 0x00008, 0x00009, 0x0000a, 0x1000b, 0x1000d, 0x1000f, 0x10011, 0x20013, 0x20017, 0x2001b, 0x2001f, 0x30023, 0x3002b, 0x30033, 0x3003b, 0x40043, 0x40053, 0x40063, 0x40073, 0x50083, 0x500a3, 0x500c3, 0x500e3, 0x00102, 0x00102, 0x00102]);
  var distDecode = new Uint32Array([0x00001, 0x00002, 0x00003, 0x00004, 0x10005, 0x10007, 0x20009, 0x2000d, 0x30011, 0x30019, 0x40021, 0x40031, 0x50041, 0x50061, 0x60081, 0x600c1, 0x70101, 0x70181, 0x80201, 0x80301, 0x90401, 0x90601, 0xa0801, 0xa0c01, 0xb1001, 0xb1801, 0xc2001, 0xc3001, 0xd4001, 0xd6001]);
  var fixedLitCodeTab = [new Uint32Array([0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c0, 0x70108, 0x80060, 0x80020, 0x900a0, 0x80000, 0x80080, 0x80040, 0x900e0, 0x70104, 0x80058, 0x80018, 0x90090, 0x70114, 0x80078, 0x80038, 0x900d0, 0x7010c, 0x80068, 0x80028, 0x900b0, 0x80008, 0x80088, 0x80048, 0x900f0, 0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c8, 0x7010a, 0x80064, 0x80024, 0x900a8, 0x80004, 0x80084, 0x80044, 0x900e8, 0x70106, 0x8005c, 0x8001c, 0x90098, 0x70116, 0x8007c, 0x8003c, 0x900d8, 0x7010e, 0x8006c, 0x8002c, 0x900b8, 0x8000c, 0x8008c, 0x8004c, 0x900f8, 0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c4, 0x70109, 0x80062, 0x80022, 0x900a4, 0x80002, 0x80082, 0x80042, 0x900e4, 0x70105, 0x8005a, 0x8001a, 0x90094, 0x70115, 0x8007a, 0x8003a, 0x900d4, 0x7010d, 0x8006a, 0x8002a, 0x900b4, 0x8000a, 0x8008a, 0x8004a, 0x900f4, 0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cc, 0x7010b, 0x80066, 0x80026, 0x900ac, 0x80006, 0x80086, 0x80046, 0x900ec, 0x70107, 0x8005e, 0x8001e, 0x9009c, 0x70117, 0x8007e, 0x8003e, 0x900dc, 0x7010f, 0x8006e, 0x8002e, 0x900bc, 0x8000e, 0x8008e, 0x8004e, 0x900fc, 0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c2, 0x70108, 0x80061, 0x80021, 0x900a2, 0x80001, 0x80081, 0x80041, 0x900e2, 0x70104, 0x80059, 0x80019, 0x90092, 0x70114, 0x80079, 0x80039, 0x900d2, 0x7010c, 0x80069, 0x80029, 0x900b2, 0x80009, 0x80089, 0x80049, 0x900f2, 0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900ca, 0x7010a, 0x80065, 0x80025, 0x900aa, 0x80005, 0x80085, 0x80045, 0x900ea, 0x70106, 0x8005d, 0x8001d, 0x9009a, 0x70116, 0x8007d, 0x8003d, 0x900da, 0x7010e, 0x8006d, 0x8002d, 0x900ba, 0x8000d, 0x8008d, 0x8004d, 0x900fa, 0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c6, 0x70109, 0x80063, 0x80023, 0x900a6, 0x80003, 0x80083, 0x80043, 0x900e6, 0x70105, 0x8005b, 0x8001b, 0x90096, 0x70115, 0x8007b, 0x8003b, 0x900d6, 0x7010d, 0x8006b, 0x8002b, 0x900b6, 0x8000b, 0x8008b, 0x8004b, 0x900f6, 0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900ce, 0x7010b, 0x80067, 0x80027, 0x900ae, 0x80007, 0x80087, 0x80047, 0x900ee, 0x70107, 0x8005f, 0x8001f, 0x9009e, 0x70117, 0x8007f, 0x8003f, 0x900de, 0x7010f, 0x8006f, 0x8002f, 0x900be, 0x8000f, 0x8008f, 0x8004f, 0x900fe, 0x70100, 0x80050, 0x80010, 0x80118, 0x70110, 0x80070, 0x80030, 0x900c1, 0x70108, 0x80060, 0x80020, 0x900a1, 0x80000, 0x80080, 0x80040, 0x900e1, 0x70104, 0x80058, 0x80018, 0x90091, 0x70114, 0x80078, 0x80038, 0x900d1, 0x7010c, 0x80068, 0x80028, 0x900b1, 0x80008, 0x80088, 0x80048, 0x900f1, 0x70102, 0x80054, 0x80014, 0x8011c, 0x70112, 0x80074, 0x80034, 0x900c9, 0x7010a, 0x80064, 0x80024, 0x900a9, 0x80004, 0x80084, 0x80044, 0x900e9, 0x70106, 0x8005c, 0x8001c, 0x90099, 0x70116, 0x8007c, 0x8003c, 0x900d9, 0x7010e, 0x8006c, 0x8002c, 0x900b9, 0x8000c, 0x8008c, 0x8004c, 0x900f9, 0x70101, 0x80052, 0x80012, 0x8011a, 0x70111, 0x80072, 0x80032, 0x900c5, 0x70109, 0x80062, 0x80022, 0x900a5, 0x80002, 0x80082, 0x80042, 0x900e5, 0x70105, 0x8005a, 0x8001a, 0x90095, 0x70115, 0x8007a, 0x8003a, 0x900d5, 0x7010d, 0x8006a, 0x8002a, 0x900b5, 0x8000a, 0x8008a, 0x8004a, 0x900f5, 0x70103, 0x80056, 0x80016, 0x8011e, 0x70113, 0x80076, 0x80036, 0x900cd, 0x7010b, 0x80066, 0x80026, 0x900ad, 0x80006, 0x80086, 0x80046, 0x900ed, 0x70107, 0x8005e, 0x8001e, 0x9009d, 0x70117, 0x8007e, 0x8003e, 0x900dd, 0x7010f, 0x8006e, 0x8002e, 0x900bd, 0x8000e, 0x8008e, 0x8004e, 0x900fd, 0x70100, 0x80051, 0x80011, 0x80119, 0x70110, 0x80071, 0x80031, 0x900c3, 0x70108, 0x80061, 0x80021, 0x900a3, 0x80001, 0x80081, 0x80041, 0x900e3, 0x70104, 0x80059, 0x80019, 0x90093, 0x70114, 0x80079, 0x80039, 0x900d3, 0x7010c, 0x80069, 0x80029, 0x900b3, 0x80009, 0x80089, 0x80049, 0x900f3, 0x70102, 0x80055, 0x80015, 0x8011d, 0x70112, 0x80075, 0x80035, 0x900cb, 0x7010a, 0x80065, 0x80025, 0x900ab, 0x80005, 0x80085, 0x80045, 0x900eb, 0x70106, 0x8005d, 0x8001d, 0x9009b, 0x70116, 0x8007d, 0x8003d, 0x900db, 0x7010e, 0x8006d, 0x8002d, 0x900bb, 0x8000d, 0x8008d, 0x8004d, 0x900fb, 0x70101, 0x80053, 0x80013, 0x8011b, 0x70111, 0x80073, 0x80033, 0x900c7, 0x70109, 0x80063, 0x80023, 0x900a7, 0x80003, 0x80083, 0x80043, 0x900e7, 0x70105, 0x8005b, 0x8001b, 0x90097, 0x70115, 0x8007b, 0x8003b, 0x900d7, 0x7010d, 0x8006b, 0x8002b, 0x900b7, 0x8000b, 0x8008b, 0x8004b, 0x900f7, 0x70103, 0x80057, 0x80017, 0x8011f, 0x70113, 0x80077, 0x80037, 0x900cf, 0x7010b, 0x80067, 0x80027, 0x900af, 0x80007, 0x80087, 0x80047, 0x900ef, 0x70107, 0x8005f, 0x8001f, 0x9009f, 0x70117, 0x8007f, 0x8003f, 0x900df, 0x7010f, 0x8006f, 0x8002f, 0x900bf, 0x8000f, 0x8008f, 0x8004f, 0x900ff]), 9];
  var fixedDistCodeTab = [new Uint32Array([0x50000, 0x50010, 0x50008, 0x50018, 0x50004, 0x50014, 0x5000c, 0x5001c, 0x50002, 0x50012, 0x5000a, 0x5001a, 0x50006, 0x50016, 0x5000e, 0x00000, 0x50001, 0x50011, 0x50009, 0x50019, 0x50005, 0x50015, 0x5000d, 0x5001d, 0x50003, 0x50013, 0x5000b, 0x5001b, 0x50007, 0x50017, 0x5000f, 0x00000]), 5];

  function error(e) {
    throw new Error(e);
  }

  function constructor(bytes) {
    //var bytes = stream.getBytes();
    var bytesPos = 0;
    var cmf = bytes[bytesPos++];
    var flg = bytes[bytesPos++];
    if (cmf == -1 || flg == -1) error("Invalid header in flate stream");
    if ((cmf & 0x0f) != 0x08) error("Unknown compression method in flate stream");
    if (((cmf << 8) + flg) % 31 != 0) error("Bad FCHECK in flate stream");
    if (flg & 0x20) error("FDICT bit set in flate stream");
    this.bytes = bytes;
    this.bytesPos = bytesPos;
    this.codeSize = 0;
    this.codeBuf = 0;
    DecodeStream.call(this);
  }

  constructor.prototype = Object.create(DecodeStream.prototype);

  constructor.prototype.getBits = function (bits) {
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;
    var b;

    while (codeSize < bits) {
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad encoding in flate stream");
      codeBuf |= b << codeSize;
      codeSize += 8;
    }

    b = codeBuf & (1 << bits) - 1;
    this.codeBuf = codeBuf >> bits;
    this.codeSize = codeSize -= bits;
    this.bytesPos = bytesPos;
    return b;
  };

  constructor.prototype.getCode = function (table) {
    var codes = table[0];
    var maxLen = table[1];
    var codeSize = this.codeSize;
    var codeBuf = this.codeBuf;
    var bytes = this.bytes;
    var bytesPos = this.bytesPos;

    while (codeSize < maxLen) {
      var b;
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad encoding in flate stream");
      codeBuf |= b << codeSize;
      codeSize += 8;
    }

    var code = codes[codeBuf & (1 << maxLen) - 1];
    var codeLen = code >> 16;
    var codeVal = code & 0xffff;
    if (codeSize == 0 || codeSize < codeLen || codeLen == 0) error("Bad encoding in flate stream");
    this.codeBuf = codeBuf >> codeLen;
    this.codeSize = codeSize - codeLen;
    this.bytesPos = bytesPos;
    return codeVal;
  };

  constructor.prototype.generateHuffmanTable = function (lengths) {
    var n = lengths.length; // find max code length

    var maxLen = 0;

    for (var i = 0; i < n; ++i) {
      if (lengths[i] > maxLen) maxLen = lengths[i];
    } // build the table


    var size = 1 << maxLen;
    var codes = new Uint32Array(size);

    for (var len = 1, code = 0, skip = 2; len <= maxLen; ++len, code <<= 1, skip <<= 1) {
      for (var val = 0; val < n; ++val) {
        if (lengths[val] == len) {
          // bit-reverse the code
          var code2 = 0;
          var t = code;

          for (var i = 0; i < len; ++i) {
            code2 = code2 << 1 | t & 1;
            t >>= 1;
          } // fill the table entries


          for (var i = code2; i < size; i += skip) codes[i] = len << 16 | val;

          ++code;
        }
      }
    }

    return [codes, maxLen];
  };

  constructor.prototype.readBlock = function () {
    function repeat(stream, array, len, offset, what) {
      var repeat = stream.getBits(len) + offset;

      while (repeat-- > 0) array[i++] = what;
    } // read block header


    var hdr = this.getBits(3);
    if (hdr & 1) this.eof = true;
    hdr >>= 1;

    if (hdr == 0) {
      // uncompressed block
      var bytes = this.bytes;
      var bytesPos = this.bytesPos;
      var b;
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad block header in flate stream");
      var blockLen = b;
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad block header in flate stream");
      blockLen |= b << 8;
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad block header in flate stream");
      var check = b;
      if (typeof (b = bytes[bytesPos++]) == "undefined") error("Bad block header in flate stream");
      check |= b << 8;
      if (check != (~blockLen & 0xffff)) error("Bad uncompressed block length in flate stream");
      this.codeBuf = 0;
      this.codeSize = 0;
      var bufferLength = this.bufferLength;
      var buffer = this.ensureBuffer(bufferLength + blockLen);
      var end = bufferLength + blockLen;
      this.bufferLength = end;

      for (var n = bufferLength; n < end; ++n) {
        if (typeof (b = bytes[bytesPos++]) == "undefined") {
          this.eof = true;
          break;
        }

        buffer[n] = b;
      }

      this.bytesPos = bytesPos;
      return;
    }

    var litCodeTable;
    var distCodeTable;

    if (hdr == 1) {
      // compressed block, fixed codes
      litCodeTable = fixedLitCodeTab;
      distCodeTable = fixedDistCodeTab;
    } else if (hdr == 2) {
      // compressed block, dynamic codes
      var numLitCodes = this.getBits(5) + 257;
      var numDistCodes = this.getBits(5) + 1;
      var numCodeLenCodes = this.getBits(4) + 4; // build the code lengths code table

      var codeLenCodeLengths = Array(codeLenCodeMap.length);
      var i = 0;

      while (i < numCodeLenCodes) codeLenCodeLengths[codeLenCodeMap[i++]] = this.getBits(3);

      var codeLenCodeTab = this.generateHuffmanTable(codeLenCodeLengths); // build the literal and distance code tables

      var len = 0;
      var i = 0;
      var codes = numLitCodes + numDistCodes;
      var codeLengths = new Array(codes);

      while (i < codes) {
        var code = this.getCode(codeLenCodeTab);

        if (code == 16) {
          repeat(this, codeLengths, 2, 3, len);
        } else if (code == 17) {
          repeat(this, codeLengths, 3, 3, len = 0);
        } else if (code == 18) {
          repeat(this, codeLengths, 7, 11, len = 0);
        } else {
          codeLengths[i++] = len = code;
        }
      }

      litCodeTable = this.generateHuffmanTable(codeLengths.slice(0, numLitCodes));
      distCodeTable = this.generateHuffmanTable(codeLengths.slice(numLitCodes, codes));
    } else {
      error("Unknown block type in flate stream");
    }

    var buffer = this.buffer;
    var limit = buffer ? buffer.length : 0;
    var pos = this.bufferLength;

    while (true) {
      var code1 = this.getCode(litCodeTable);

      if (code1 < 256) {
        if (pos + 1 >= limit) {
          buffer = this.ensureBuffer(pos + 1);
          limit = buffer.length;
        }

        buffer[pos++] = code1;
        continue;
      }

      if (code1 == 256) {
        this.bufferLength = pos;
        return;
      }

      code1 -= 257;
      code1 = lengthDecode[code1];
      var code2 = code1 >> 16;
      if (code2 > 0) code2 = this.getBits(code2);
      var len = (code1 & 0xffff) + code2;
      code1 = this.getCode(distCodeTable);
      code1 = distDecode[code1];
      code2 = code1 >> 16;
      if (code2 > 0) code2 = this.getBits(code2);
      var dist = (code1 & 0xffff) + code2;

      if (pos + len >= limit) {
        buffer = this.ensureBuffer(pos + len);
        limit = buffer.length;
      }

      for (var k = 0; k < len; ++k, ++pos) buffer[pos] = buffer[pos - dist];
    }
  };

  return constructor;
}();

exports.FlateStream = FlateStream;
},{}],"sprites/lib/png.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _zlib = require("./zlib.js");

/*
 * MIT LICENSE
 * Copyright (c) 2011 Devon Govett
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the "Software"), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
 * to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or
 * substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
class PNG {
  constructor(data1) {
    let i;
    this.data = data1;
    this.pos = 8; // Skip the default header

    this.palette = [];
    this.imgData = [];
    this.transparency = {};
    this.animation = null;
    this.text = {};
    let frame = null; // eslint-disable-next-line no-constant-condition

    while (true) {
      var data;
      let chunkSize = this.readUInt32();
      let section = '';

      for (i = 0; i < 4; i++) {
        section += String.fromCharCode(this.data[this.pos++]);
      }

      switch (section) {
        case 'IHDR':
          // we can grab  interesting values from here (like width, height, etc)
          this.width = this.readUInt32();
          this.height = this.readUInt32();
          this.bits = this.data[this.pos++];
          this.colorType = this.data[this.pos++];
          this.compressionMethod = this.data[this.pos++];
          this.filterMethod = this.data[this.pos++];
          this.interlaceMethod = this.data[this.pos++];
          break;

        case 'acTL':
          // we have an animated PNG
          this.animation = {
            numFrames: this.readUInt32(),
            numPlays: this.readUInt32() || Infinity,
            frames: []
          };
          break;

        case 'PLTE':
          this.palette = this.read(chunkSize);
          break;

        case 'fcTL':
          if (frame) {
            this.animation.frames.push(frame);
          }

          this.pos += 4; // skip sequence number

          frame = {
            width: this.readUInt32(),
            height: this.readUInt32(),
            xOffset: this.readUInt32(),
            yOffset: this.readUInt32()
          };
          var delayNum = this.readUInt16();
          var delayDen = this.readUInt16() || 100;
          frame.delay = 1000 * delayNum / delayDen;
          frame.disposeOp = this.data[this.pos++];
          frame.blendOp = this.data[this.pos++];
          frame.data = [];
          break;

        case 'IDAT':
        case 'fdAT':
          if (section === 'fdAT') {
            this.pos += 4; // skip sequence number

            chunkSize -= 4;
          }

          data = frame && frame.data || this.imgData;

          for (i = 0; i < chunkSize; i++) {
            data.push(this.data[this.pos++]);
          }

          break;

        case 'tRNS':
          // This chunk can only occur once and it must occur after the
          // PLTE chunk and before the IDAT chunk.
          this.transparency = {};

          switch (this.colorType) {
            case 3:
              // Indexed color, RGB. Each byte in this chunk is an alpha for
              // the palette index in the PLTE ("palette") chunk up until the
              // last non-opaque entry. Set up an array, stretching over all
              // palette entries which will be 0 (opaque) or 1 (transparent).
              this.transparency.indexed = this.read(chunkSize);
              var short = 255 - this.transparency.indexed.length;

              if (short > 0) {
                for (i = 0; i < short; i++) {
                  this.transparency.indexed.push(255);
                }
              }

              break;

            case 0:
              // Greyscale. Corresponding to entries in the PLTE chunk.
              // Grey is two bytes, range 0 .. (2 ^ bit-depth) - 1
              this.transparency.grayscale = this.read(chunkSize)[0];
              break;

            case 2:
              // True color with proper alpha channel.
              this.transparency.rgb = this.read(chunkSize);
              break;
          }

          break;

        case 'tEXt':
          var text = this.read(chunkSize);
          var index = text.indexOf(0);
          var key = String.fromCharCode.apply(String, text.slice(0, index));
          this.text[key] = String.fromCharCode.apply(String, text.slice(index + 1));
          break;

        case 'IEND':
          if (frame) {
            this.animation.frames.push(frame);
          } // we've got everything we need!


          switch (this.colorType) {
            case 0:
            case 3:
            case 4:
              this.colors = 1;
              break;

            case 2:
            case 6:
              this.colors = 3;
              break;
          }

          this.hasAlphaChannel = [4, 6].includes(this.colorType);
          var colors = this.colors + (this.hasAlphaChannel ? 1 : 0);
          this.pixelBitlength = this.bits * colors;

          switch (this.colors) {
            case 1:
              this.colorSpace = 'DeviceGray';
              break;

            case 3:
              this.colorSpace = 'DeviceRGB';
              break;
          }

          this.imgData = new Uint8Array(this.imgData);
          return;

        default:
          // unknown (or unimportant) section, skip it
          this.pos += chunkSize;
      }

      this.pos += 4; // Skip the CRC

      if (this.pos > this.data.length) {
        throw new Error('Incomplete or corrupt PNG file');
      }
    }
  }

  read(bytes) {
    const result = new Array(bytes);

    for (let i = 0; i < bytes; i++) {
      result[i] = this.data[this.pos++];
    }

    return result;
  }

  readUInt32() {
    const b1 = this.data[this.pos++] << 24;
    const b2 = this.data[this.pos++] << 16;
    const b3 = this.data[this.pos++] << 8;
    const b4 = this.data[this.pos++];
    return b1 | b2 | b3 | b4;
  }

  readUInt16() {
    const b1 = this.data[this.pos++] << 8;
    const b2 = this.data[this.pos++];
    return b1 | b2;
  }

  decodePixels(data) {
    if (data == null) {
      data = this.imgData;
    }

    if (data.length === 0) {
      return new Uint8Array(0);
    }

    data = new _zlib.FlateStream(data);
    data = data.getBytes();
    const {
      width,
      height
    } = this;
    const pixelBytes = this.pixelBitlength / 8;
    const pixels = new Uint8Array(width * height * pixelBytes);
    const {
      length
    } = data;
    let pos = 0;

    function pass(x0, y0, dx, dy, singlePass = false) {
      const w = Math.ceil((width - x0) / dx);
      const h = Math.ceil((height - y0) / dy);
      const scanlineLength = pixelBytes * w;
      const buffer = singlePass ? pixels : new Uint8Array(scanlineLength * h);
      let row = 0;
      let c = 0;

      while (row < h && pos < length) {
        var byte, col, i, left, upper;

        switch (data[pos++]) {
          case 0:
            // None
            for (i = 0; i < scanlineLength; i++) {
              buffer[c++] = data[pos++];
            }

            break;

          case 1:
            // Sub
            for (i = 0; i < scanlineLength; i++) {
              byte = data[pos++];
              left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
              buffer[c++] = (byte + left) % 256;
            }

            break;

          case 2:
            // Up
            for (i = 0; i < scanlineLength; i++) {
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              upper = row && buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              buffer[c++] = (upper + byte) % 256;
            }

            break;

          case 3:
            // Average
            for (i = 0; i < scanlineLength; i++) {
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : buffer[c - pixelBytes];
              upper = row && buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
              buffer[c++] = (byte + Math.floor((left + upper) / 2)) % 256;
            }

            break;

          case 4:
            // Paeth
            for (i = 0; i < scanlineLength; i++) {
              var paeth, upperLeft;
              byte = data[pos++];
              col = (i - i % pixelBytes) / pixelBytes;
              left = i < pixelBytes ? 0 : buffer[c - pixelBytes];

              if (row === 0) {
                upper = upperLeft = 0;
              } else {
                upper = buffer[(row - 1) * scanlineLength + col * pixelBytes + i % pixelBytes];
                upperLeft = col && buffer[(row - 1) * scanlineLength + (col - 1) * pixelBytes + i % pixelBytes];
              }

              const p = left + upper - upperLeft;
              const pa = Math.abs(p - left);
              const pb = Math.abs(p - upper);
              const pc = Math.abs(p - upperLeft);

              if (pa <= pb && pa <= pc) {
                paeth = left;
              } else if (pb <= pc) {
                paeth = upper;
              } else {
                paeth = upperLeft;
              }

              buffer[c++] = (byte + paeth) % 256;
            }

            break;

          default:
            throw new Error(`Invalid filter algorithm: ${data[pos - 1]}`);
        }

        if (!singlePass) {
          let pixelsPos = ((y0 + row * dy) * width + x0) * pixelBytes;
          let bufferPos = row * scanlineLength;

          for (i = 0; i < w; i++) {
            for (let j = 0; j < pixelBytes; j++) pixels[pixelsPos++] = buffer[bufferPos++];

            pixelsPos += (dx - 1) * pixelBytes;
          }
        }

        row++;
      }
    }

    if (this.interlaceMethod === 1) {
      /*
          1 6 4 6 2 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
          3 6 4 6 3 6 4 6
          7 7 7 7 7 7 7 7
          5 6 5 6 5 6 5 6
          7 7 7 7 7 7 7 7
        */
      pass(0, 0, 8, 8); // 1

      pass(4, 0, 8, 8); // 2

      pass(0, 4, 4, 8); // 3

      pass(2, 0, 4, 4); // 4

      pass(0, 2, 2, 4); // 5

      pass(1, 0, 2, 2); // 6

      pass(0, 1, 1, 2); // 7
    } else {
      pass(0, 0, 1, 1, true);
    }

    return pixels;
  }

  decodePalette() {
    const {
      palette
    } = this;
    const {
      length
    } = palette;
    const transparency = this.transparency.indexed || [];
    const ret = new Uint8Array((transparency.length || 0) + length);
    let pos = 0;
    let c = 0;

    for (let i = 0; i < length; i += 3) {
      var left;
      ret[pos++] = palette[i];
      ret[pos++] = palette[i + 1];
      ret[pos++] = palette[i + 2];
      ret[pos++] = (left = transparency[c++]) != null ? left : 255;
    }

    return ret;
  }

  copyToImageData(imageData, pixels) {
    let j, k;
    let {
      colors
    } = this;
    let palette = null;
    let alpha = this.hasAlphaChannel;

    if (this.palette.length) {
      palette = this._decodedPalette || (this._decodedPalette = this.decodePalette());
      colors = 4;
      alpha = true;
    }

    const data = imageData.data || imageData;
    const {
      length
    } = data;
    const input = palette || pixels;
    let i = j = 0;

    if (colors === 1) {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        const v = input[k++];
        data[i++] = v;
        data[i++] = v;
        data[i++] = v;
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    } else {
      while (i < length) {
        k = palette ? pixels[i / 4] * 4 : j;
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = input[k++];
        data[i++] = alpha ? input[k++] : 255;
        j = k;
      }
    }
  }

  decode() {
    const ret = new Uint8Array(this.width * this.height * 4);
    this.copyToImageData(ret, this.decodePixels());
    return ret;
  }

}

exports.default = PNG;
},{"./zlib.js":"sprites/lib/zlib.js"}],"sprites/lib/bmp.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = BmpDecoder;

/**
 * @author shaozilee
 *
 * Bmp format decoder,support 1bit 4bit 8bit 24bit bmp
 *
 */
function BmpDecoder(buffer, is_with_alpha) {
  this.pos = 2;
  this.buffer = new DataView(buffer.buffer);
  this.is_with_alpha = !!is_with_alpha;
  this.bottom_up = true;
  this.flag = buffer.slice(0, 2);
  if (this.flag[0] !== 66 || this.flag[1] !== 77) throw new Error('Invalid BMP File');
  this.parseHeader();
  this.parseRGBA();
}

BmpDecoder.prototype.parseHeader = function () {
  this.fileSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.reserved = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.offset = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.headerSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.width = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.height = this.buffer.getInt32(this.pos, true);
  this.pos += 4;
  this.planes = this.buffer.getUint16(this.pos, true);
  this.pos += 2;
  this.bitPP = this.buffer.getUint16(this.pos, true);
  this.pos += 2;
  this.compress = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.rawSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.hr = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.vr = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.colors = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.importantColors = this.buffer.getUint32(this.pos, true);
  this.pos += 4;

  if (this.bitPP === 16 && this.is_with_alpha) {
    this.bitPP = 15;
  }

  if (this.bitPP < 15) {
    var len = this.colors === 0 ? 1 << this.bitPP : this.colors;
    this.palette = new Array(len);

    for (var i = 0; i < len; i++) {
      var blue = this.buffer.getUint8(this.pos++);
      var green = this.buffer.getUint8(this.pos++);
      var red = this.buffer.getUint8(this.pos++);
      var quad = this.buffer.getUint8(this.pos++);
      this.palette[i] = {
        red: red,
        green: green,
        blue: blue,
        quad: quad
      };
    }
  }

  if (this.height < 0) {
    this.height *= -1;
    this.bottom_up = false;
  }
};

BmpDecoder.prototype.parseRGBA = function () {
  var bitn = 'bit' + this.bitPP;
  var len = this.width * this.height * 4;
  this.data = new ArrayBuffer(len);
  this[bitn]();
};

BmpDecoder.prototype.bit1 = function () {
  var xlen = Math.ceil(this.width / 8);
  var mode = xlen % 4;
  var y = this.height >= 0 ? this.height - 1 : -this.height;

  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;

    for (var x = 0; x < xlen; x++) {
      var b = this.buffer.getUint8(this.pos++);
      var location = line * this.width * 4 + x * 8 * 4;

      for (var i = 0; i < 8; i++) {
        if (x * 8 + i < this.width) {
          var rgb = this.palette[b >> 7 - i & 0x1];
          this.data[location + i * 4] = 0;
          this.data[location + i * 4 + 1] = rgb.blue;
          this.data[location + i * 4 + 2] = rgb.green;
          this.data[location + i * 4 + 3] = rgb.red;
        } else {
          break;
        }
      }
    }

    if (mode != 0) {
      this.pos += 4 - mode;
    }
  }
};

BmpDecoder.prototype.bit4 = function () {
  //RLE-4
  if (this.compress == 2) {
    this.data.fill(0xff);
    var location = 0;
    var lines = this.bottom_up ? this.height - 1 : 0;
    var low_nibble = false; //for all count of pixel

    while (location < this.data.length) {
      var a = this.buffer.getUint8(this.pos++);
      var b = this.buffer.getUint8(this.pos++); //absolute mode

      if (a == 0) {
        if (b == 0) {
          //line end
          if (this.bottom_up) {
            lines--;
          } else {
            lines++;
          }

          location = lines * this.width * 4;
          low_nibble = false;
          continue;
        } else if (b == 1) {
          //image end
          break;
        } else if (b == 2) {
          //offset x,y
          var x = this.buffer.getUint8(this.pos++);
          var y = this.buffer.getUint8(this.pos++);

          if (this.bottom_up) {
            lines -= y;
          } else {
            lines += y;
          }

          location += y * this.width * 4 + x * 4;
        } else {
          var c = this.buffer.getUint8(this.pos++);

          for (var i = 0; i < b; i++) {
            if (low_nibble) {
              setPixelData.call(this, c & 0x0f);
            } else {
              setPixelData.call(this, (c & 0xf0) >> 4);
            }

            if (i & 1 && i + 1 < b) {
              c = this.buffer.getUint8(this.pos++);
            }

            low_nibble = !low_nibble;
          }

          if ((b + 1 >> 1 & 1) == 1) {
            this.pos++;
          }
        }
      } else {
        //encoded mode
        for (var i = 0; i < a; i++) {
          if (low_nibble) {
            setPixelData.call(this, b & 0x0f);
          } else {
            setPixelData.call(this, (b & 0xf0) >> 4);
          }

          low_nibble = !low_nibble;
        }
      }
    }

    function setPixelData(rgbIndex) {
      var rgb = this.palette[rgbIndex];
      this.data[location] = 0;
      this.data[location + 1] = rgb.blue;
      this.data[location + 2] = rgb.green;
      this.data[location + 3] = rgb.red;
      location += 4;
    }
  } else {
    var xlen = Math.ceil(this.width / 2);
    var mode = xlen % 4;

    for (var y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;

      for (var x = 0; x < xlen; x++) {
        var b = this.buffer.getUint8(this.pos++);
        var location = line * this.width * 4 + x * 2 * 4;
        var before = b >> 4;
        var after = b & 0x0f;
        var rgb = this.palette[before];
        this.data[location] = 0;
        this.data[location + 1] = rgb.blue;
        this.data[location + 2] = rgb.green;
        this.data[location + 3] = rgb.red;
        if (x * 2 + 1 >= this.width) break;
        rgb = this.palette[after];
        this.data[location + 4] = 0;
        this.data[location + 4 + 1] = rgb.blue;
        this.data[location + 4 + 2] = rgb.green;
        this.data[location + 4 + 3] = rgb.red;
      }

      if (mode != 0) {
        this.pos += 4 - mode;
      }
    }
  }
};

BmpDecoder.prototype.bit8 = function () {
  //RLE-8
  if (this.compress == 1) {
    this.data.fill(0xff);
    var location = 0;
    var lines = this.bottom_up ? this.height - 1 : 0;

    while (location < this.data.length) {
      var a = this.buffer.getUint8(this.pos++);
      var b = this.buffer.getUint8(this.pos++); //absolute mode

      if (a == 0) {
        if (b == 0) {
          //line end
          if (this.bottom_up) {
            lines--;
          } else {
            lines++;
          }

          location = lines * this.width * 4;
          continue;
        } else if (b == 1) {
          //image end
          break;
        } else if (b == 2) {
          //offset x,y
          var x = this.buffer.getUint8(this.pos++);
          var y = this.buffer.getUint8(this.pos++);

          if (this.bottom_up) {
            lines -= y;
          } else {
            lines += y;
          }

          location += y * this.width * 4 + x * 4;
        } else {
          for (var i = 0; i < b; i++) {
            var c = this.buffer.getUint8(this.pos++);
            setPixelData.call(this, c);
          }

          if (b & 1 == 1) {
            this.pos++;
          }
        }
      } else {
        //encoded mode
        for (var i = 0; i < a; i++) {
          setPixelData.call(this, b);
        }
      }
    }

    function setPixelData(rgbIndex) {
      var rgb = this.palette[rgbIndex];
      this.data[location] = 0;
      this.data[location + 1] = rgb.blue;
      this.data[location + 2] = rgb.green;
      this.data[location + 3] = rgb.red;
      location += 4;
    }
  } else {
    var mode = this.width % 4;

    for (var y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;

      for (var x = 0; x < this.width; x++) {
        var b = this.buffer.getUint8(this.pos++);
        var location = line * this.width * 4 + x * 4;

        if (b < this.palette.length) {
          var rgb = this.palette[b];
          this.data[location] = 0;
          this.data[location + 1] = rgb.blue;
          this.data[location + 2] = rgb.green;
          this.data[location + 3] = rgb.red;
        } else {
          this.data[location] = 0;
          this.data[location + 1] = 0xff;
          this.data[location + 2] = 0xff;
          this.data[location + 3] = 0xff;
        }
      }

      if (mode != 0) {
        this.pos += 4 - mode;
      }
    }
  }
};

BmpDecoder.prototype.bit15 = function () {
  var dif_w = this.width % 3;

  var _11111 = parseInt('11111', 2),
      _1_5 = _11111;

  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;

    for (var x = 0; x < this.width; x++) {
      var B = this.buffer.getUint16(this.pos, true);
      this.pos += 2;
      var blue = (B & _1_5) / _1_5 * 255 | 0;
      var green = (B >> 5 & _1_5) / _1_5 * 255 | 0;
      var red = (B >> 10 & _1_5) / _1_5 * 255 | 0;
      var alpha = B >> 15 ? 0xff : 0x00;
      var location = line * this.width * 4 + x * 4;
      this.data[location] = alpha;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    } //skip extra bytes


    this.pos += dif_w;
  }
};

BmpDecoder.prototype.bit16 = function () {
  var dif_w = this.width % 2 * 2; //default xrgb555

  this.maskRed = 0x7c00;
  this.maskGreen = 0x3e0;
  this.maskBlue = 0x1f;
  this.mask0 = 0;

  if (this.compress == 3) {
    this.maskRed = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskGreen = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskBlue = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.mask0 = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
  }

  var ns = [0, 0, 0];

  for (var i = 0; i < 16; i++) {
    if (this.maskRed >> i & 0x01) ns[0]++;
    if (this.maskGreen >> i & 0x01) ns[1]++;
    if (this.maskBlue >> i & 0x01) ns[2]++;
  }

  ns[1] += ns[0];
  ns[2] += ns[1];
  ns[0] = 8 - ns[0];
  ns[1] -= 8;
  ns[2] -= 8;

  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;

    for (var x = 0; x < this.width; x++) {
      var B = this.buffer.getUint16(this.pos, true);
      this.pos += 2;
      var blue = (B & this.maskBlue) << ns[0];
      var green = (B & this.maskGreen) >> ns[1];
      var red = (B & this.maskRed) >> ns[2];
      var location = line * this.width * 4 + x * 4;
      this.data[location] = 0;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    } //skip extra bytes


    this.pos += dif_w;
  }
};

BmpDecoder.prototype.bit24 = function () {
  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;

    for (var x = 0; x < this.width; x++) {
      //Little Endian rgb
      var blue = this.buffer.getUint8(this.pos++);
      var green = this.buffer.getUint8(this.pos++);
      var red = this.buffer.getUint8(this.pos++);
      var location = line * this.width * 4 + x * 4;
      this.data[location] = 0;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    } //skip extra bytes


    this.pos += this.width % 4;
  }
};
/**
 * add 32bit decode func
 * @author soubok
 */


BmpDecoder.prototype.bit32 = function () {
  //BI_BITFIELDS
  if (this.compress == 3) {
    this.maskRed = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskGreen = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskBlue = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.mask0 = this.buffer.getUint32(this.pos, true);
    this.pos += 4;

    for (var y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;

      for (var x = 0; x < this.width; x++) {
        //Little Endian rgba
        var alpha = this.buffer.getUint8(this.pos++);
        var blue = this.buffer.getUint8(this.pos++);
        var green = this.buffer.getUint8(this.pos++);
        var red = this.buffer.getUint8(this.pos++);
        var location = line * this.width * 4 + x * 4;
        this.data[location] = alpha;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
    }
  } else {
    for (var y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;

      for (var x = 0; x < this.width; x++) {
        //Little Endian argb
        var blue = this.buffer.getUint8(this.pos++);
        var green = this.buffer.getUint8(this.pos++);
        var red = this.buffer.getUint8(this.pos++);
        var alpha = this.buffer.getUint8(this.pos++);
        var location = line * this.width * 4 + x * 4;
        this.data[location] = alpha;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
    }
  }
};

BmpDecoder.prototype.getData = function () {
  return this.data;
};
},{}],"sprites/lib/parser.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.decode = decode;
exports.detect = detect;
exports.bmp = bmp;
exports.pngNoTransformFile = pngNoTransformFile;
exports.png = png;
exports.transform = transform;

var _png = _interopRequireDefault(require("./png.js"));

var _bmp = _interopRequireDefault(require("./bmp.js"));

var _colour = require("./colour.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const p = 16; // 16x16 sprite

const pngSig = [137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82];
const bmpSig = [66, 77];

function decode(file) {
  const {
    isPNG,
    isBMP
  } = detect(file);

  if (isPNG) {
    return png(file);
  }

  if (isBMP) {
    return bmp(file);
  }

  return file;
}

function detect(file) {
  let isPNG = true;
  let isBMP = true;

  for (let i = 0; i < Math.max(pngSig.length, bmpSig.length); i++) {
    if (file[i] !== bmpSig[i]) {
      isBMP = false;
    }

    if (file[i] !== pngSig[i]) {
      isPNG = false;
      break;
    }
  }

  return {
    isPNG,
    isBMP
  };
}

function bmp(file) {
  const bmp = new _bmp.default(file);
  const pixels = bmp.data;
  return transform({
    pixels,
    width: bmp.width,
    alphaFirst: true
  });
}

function pngNoTransformFile(file) {
  const png = new _png.default(file);
  const pixels = png.decode();
  const res = [];

  for (let i = 0; i < pixels.length; i += 4) {
    const [r, g, b, a] = [pixels[i + 0], pixels[i + 1], pixels[i + 2], pixels[i + 3]];

    if (a === 0 || r === undefined) {
      // transparent
      res.push(0xe3);
    } else {
      res.push((0, _colour.toRGB332)(r, g, b));
    }
  }

  return {
    data: new Uint8Array(res),
    png
  };
}

function png(file) {
  const png = new _png.default(file);
  const pixels = png.decode();
  return transform({
    pixels,
    width: png.width
  });
}

function transform({
  pixels,
  width,
  alphaFirst = false
}) {
  // let tmp = null;
  const res = [];
  let [ri, gi, bi, ai] = [0, 1, 2, 3];

  if (alphaFirst) {
    [ai, bi, gi, ri] = [0, 1, 2, 3];
  }

  let n = 1;

  if (width / 16 === (width / 16 | 0)) {
    n = width / 16;
  } else {
    // throw new Error('unsupported dimension');
    const d = width % 16;
    n = (width + (16 - d)) / 16;
  }

  for (let i = 0; i < pixels.length; i += 4) {
    const row = (i / 4 / p | 0) % p;
    const offset = i / 4 % p;
    const spriteIndex = i / 4 / (p * p) | 0;
    const spriteRow = (spriteIndex / n | 0) * (p * p * n);
    let dataIndex = spriteRow;
    dataIndex += spriteIndex * p;
    dataIndex += row * width;
    dataIndex += offset;
    dataIndex *= 4; // NOTE I don't fully understand how this works, but it does after
    // lots of testing...

    dataIndex -= p * 4 * (spriteIndex / n | 0) * n;
    const [r, g, b, a] = [pixels[dataIndex + ri], pixels[dataIndex + gi], pixels[dataIndex + bi], pixels[dataIndex + ai]];

    if (a === 0 || r === undefined) {
      // transparent
      res.push(0xe3);
    } else {
      res.push((0, _colour.toRGB332)(r, g, b));
    }
  }

  return new Uint8Array(res);
}
},{"./png.js":"sprites/lib/png.js","./bmp.js":"sprites/lib/bmp.js","./colour.js":"sprites/lib/colour.js"}],"lib/$.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$ = void 0;

class ArrayNode extends Array {
  constructor() {
    super(); // allow setting any node property via proxy

    return new Proxy(this, {
      set(obj, prop, value) {
        const type = obj[0];

        if (type && prop in type) {
          return obj.filter(el => el[prop] = value);
        }

        const res = this[prop] = value;
        return res;
      }

    });
  }

  on(event, handler, options) {
    return this.filter(el => el.addEventListener(event, handler, options));
  }

  emit(type, data) {
    const event = new Event(type, {
      data
    });
    return this.filter(el => el.dispatchEvent(event));
  }

}

const $ = (s, ctx = document) => {
  const res = ctx.querySelectorAll(s);

  if (res.length === 0) {
    console.warn(`${s} zero results`);
  }

  return ArrayNode.from(res);
};

exports.$ = $;
},{}],"sprites/SpriteSheet.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCoords = getCoords;
exports.emptyCanvas = emptyCanvas;
exports.xyToIndex = xyToIndex;
exports.default = exports.Sprite = exports.colourTable = void 0;

var _colour = require("./lib/colour.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const pixelLength = 256;
const width = 16;
const colourTable = Array.from({
  length: pixelLength
}, (_, i) => {
  return (0, _colour.rgbFromIndex)(i);
});
exports.colourTable = colourTable;

function getCoords(e, w = width, h = w) {
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left) / w | 0; //x position within the element.

  const y = (e.clientY - rect.top) / h | 0; //y position within the element.

  const index = xyToIndex({
    x,
    y,
    w: 16
  });
  return {
    x,
    y,
    index
  };
}

function emptyCanvas(ctx) {
  const blankData = new Uint8ClampedArray(ctx.canvas.width * ctx.canvas.height * 4); // blankData.fill(transparent);

  for (let i = 0; i < blankData.length; i += 4) {
    blankData[i + 0] = 0;
    blankData[i + 1] = 0;
    blankData[i + 2] = 0;
    blankData[i + 3] = 0;
  }

  const blank = new ImageData(blankData, ctx.canvas.width, ctx.canvas.height);
  ctx.putImageData(blank, 0, 0);
}

function xyToIndex({
  x,
  y,
  w = width
}) {
  if (x < 0) {
    return null;
  }

  if (x >= w) {
    return null;
  }

  if (y >= w) {
    return null;
  }

  return w * y + x;
}

class Sprite {
  /**
   *
   * @param {Uint8Array} pixels
   */
  constructor(pixels) {
    _defineProperty(this, "scale", 16);

    this.pixels = pixels;
    this.ctx = document.createElement('canvas').getContext('2d');
    this.ctx.canvas.width = this.ctx.canvas.height = width;
    this.render();
  }

  get canvas() {
    return this.ctx.canvas;
  }

  pget({
    index = null,
    x = null,
    y
  }) {
    if (index === null) {
      index = xyToIndex({
        x,
        y
      });
    }

    return this.pixels[index];
  }

  pset({
    index = null,
    x = null,
    y,
    value
  }) {
    if (index === null) {
      index = xyToIndex({
        x,
        y
      });
    }

    this.pixels[index] = value;
    this.render();
  }

  clear() {
    this.pixels.fill(_colour.transparent);
    this.render();
  }

  canvasToPixels() {
    const imageData = this.ctx.getImageData(0, 0, width, width);

    for (let i = 0; i < imageData.data.length / 4; i++) {
      const [r, g, b, a] = imageData.data.slice(i * 4, i * 4 + 4);

      if (a === 0) {
        this.pixels[i] = _colour.transparent;
      } else {
        this.pixels[i] = (0, _colour.toRGB332)(r, g, b);
      }
    }
  }

  render(dx = 0, dy = 0) {
    const pixels = this.pixels; // imageData is the internal copy

    const imageData = this.ctx.getImageData(0, 0, width, width);

    for (let i = 0; i < pixels.length; i++) {
      let index = pixels[i];
      const {
        r,
        g,
        b,
        a
      } = colourTable[index];
      imageData.data[i * 4 + 0] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = a * 255;
    }

    if (dx !== 0 || dy !== 0) {
      emptyCanvas(this.ctx);
    }

    this.ctx.putImageData(imageData, dx, dy, 0, 0, imageData.width, imageData.height);
  } // we always paint square…


  paint(ctx, dx = 0, dy = 0, w = null) {
    if (w === null) {
      w = ctx.canvas.width;
    } // clear, set to jaggy and scale to canvas


    ctx.clearRect(dx, dy, w, w);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.ctx.canvas, 0, 0, this.ctx.canvas.width, this.ctx.canvas.height, dx, dy, w, w);
  }

}

exports.Sprite = Sprite;

class SpriteSheet {
  constructor(data, ctx, scale = 2) {
    _defineProperty(this, "sprites", []);

    _defineProperty(this, "previewCtx", []);

    _defineProperty(this, "history", []);

    _defineProperty(this, "ctx", null);

    _defineProperty(this, "_undoPtr", 0);

    _defineProperty(this, "_current", 0);

    _defineProperty(this, "length", 0);

    _defineProperty(this, "clipboard", null);

    _defineProperty(this, "hooks", []);

    this.data = new Uint8Array(pixelLength * 4 * 16);
    this.data.set(data.slice(0, pixelLength * 4 * 16), 0);

    for (let i = 0; i < this.data.length; i += pixelLength) {
      const spriteData = this.data.subarray(i, i + pixelLength);
      const sprite = new Sprite(spriteData);
      this.sprites.push(sprite);
      const ctx = document.createElement('canvas').getContext('2d');
      ctx.canvas.width = ctx.canvas.height = width * scale;
      this.previewCtx.push(ctx);
      sprite.paint(ctx);
    }

    this.snapshot();
    this.length = data.length / pixelLength;
    this._current = 0;
    this.scale = scale;
    this.ctx = ctx;
    window.sprites = this;
  }

  getCoords(e) {
    return getCoords(e, this.scale * 16);
  }

  hook(callback) {
    this.hooks.push(callback);
  }

  trigger() {
    this.hooks.forEach(callback => callback());
  }

  copy() {
    // FIXME support partial copy/clip //{ x = 0, y = 0, w = width, h = width }
    this.clipboard = new Sprite(new Uint8Array(this.sprite.pixels));
  }

  paste() {
    if (this.clipboard.pixels) this.set(this.clipboard.pixels);
  }

  set(data) {
    // FIXME support partial paste
    this.snapshot();
    this.data.set(data, this._current * pixelLength);
    this.rebuild(this._current);
    this.paint();
  }

  snapshot() {
    this.history.splice(this._undoPtr + 1);
    this.history.push(new Uint8Array(this.data));
    this._undoPtr = this.history.length - 1;
    console.log(`history: ${this.history.length}`);
  }

  undo() {
    const data = this.history[this._undoPtr];

    if (!data) {
      return;
    }

    this._undoPtr--;
    this.data = data;

    for (let i = 0; i < this.length; i++) {
      this.rebuild(i);
    }

    this.paint();
  }

  rebuild(i) {
    if (i < 0 || i > this.length) {
      return; // noop
    }

    const sprite = new Sprite(this.data.subarray(i * pixelLength, i * pixelLength + pixelLength));
    this.sprites[i] = sprite;
    sprite.paint(this.previewCtx[i]);
    this.trigger();
  }

  getPreviewElements() {
    return this.previewCtx.map(_ => _.canvas);
  }

  canvasToPixels() {
    this.sprites[this._current].canvasToPixels();
  }

  pset(coords, value) {
    this.sprites[this._current].pset({ ...coords,
      value
    });

    this.trigger();
    return true;
  }

  pget(args) {
    return this.sprites[this._current].pget(args);
  }

  get current() {
    return this._current;
  }

  get sprite() {
    return this.sprites[this._current];
  }

  set current(value) {
    this._current = value;
    this.paint();
  }

  get(index) {
    return this.sprites[index];
  }

  clear() {
    this.snapshot();

    this.sprites[this._current].clear();

    this.trigger();
    this.paint();
  }

  renderPreview(i) {
    this.sprites[i].draw(this.previewCtx[i]);
  }

  paint(i = this._current) {
    const sprite = this.sprites[i];
    sprite.paint(this.ctx);
    sprite.paint(this.previewCtx[this._current]);
    this.getPreviewElements().map(_ => _.classList.remove('focus'));

    this.previewCtx[this._current].canvas.classList.add('focus');
  }

}

exports.default = SpriteSheet;
},{"./lib/colour.js":"sprites/lib/colour.js"}],"lib/track-down.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = trackDown;

const noop = () => {};

function trackDown(el, {
  handler = noop,
  move = noop,
  start = noop,
  end = noop
}) {
  let down = false;
  el.addEventListener('mouseout', () => down = false);
  el.addEventListener('click', handler);
  el.addEventListener('mousedown', e => {
    start(e);
    down = true;
  }, true);
  el.addEventListener('mouseup', e => {
    down = false;
    end(e);
  }, true);
  el.addEventListener('mousemove', e => {
    if (down) {
      handler(e);
    } else {
      move(e);
    }
  }, true);
  return () => {
    down = false;
  };
}
},{}],"sprites/ImageWindow.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _$ = require("../lib/$.js");

var _SpriteSheet = require("./SpriteSheet.js");

var _trackDown = _interopRequireDefault(require("../lib/track-down.js"));

var _colour = require("./lib/colour.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ImageWindow {
  constructor(data, ctx, width, height) {
    _defineProperty(this, "zoomFactor", 0);

    _defineProperty(this, "x", 0);

    _defineProperty(this, "y", 0);

    this.ctx = ctx;
    this.__ctx = document.createElement('canvas').getContext('2d');
    this.__ctx.canvas.width = width;
    this.__ctx.canvas.height = height;
    this.parent = ctx.canvas.parentNode;
    this.status = (0, _$.$)('#png-status');
    (0, _trackDown.default)(ctx.canvas, {
      start: e => this.start(e),
      handler: e => this.pan(e),
      end: e => this.end(e)
    });
    this.render(this.__ctx, data);
    this.zoom = 0;
  }

  get zoom() {
    return this.zoomFactor;
  }

  set zoom(value) {
    const preZoomDelta = this.zoomDelta;
    this.zoomFactor = value;

    if (this.zoomFactor > 4) {
      this.zoomFactor = 4;
    }

    if (this.zoomFactor < -3) {
      this.zoomFactor = -3;
    }

    this.parent.dataset.zoom = this.zoomFactor;
    const delta = this.zoomDelta - preZoomDelta;
    this.x += delta;
    this.y += delta;
    this.paint();
  }

  get pxScale() {
    if (this.zoomFactor >= 3) {
      return 1;
    }

    return 16 / (this.zoomFactor + 1) / 2;
  }

  get zoomDelta() {
    return 0xff >> this.zoomFactor + 3 << 3;
  }

  coords(x = this.x, y = this.y) {
    const delta = this.zoomDelta;
    return {
      x: Math.abs(x - delta),
      y: Math.abs(y - delta)
    };
  }

  start(event) {
    const coords = (0, _SpriteSheet.getCoords)(event, this.pxScale);
    this.parent.dataset.dragging = true;
    this._coords = {
      x: coords.x,
      y: coords.y,
      curX: this.x,
      curY: this.y
    };
  }

  end(event) {
    this.parent.dataset.dragging = false;
    const scale = this.pxScale;
    const coords = (0, _SpriteSheet.getCoords)(event, scale);
    this.x = this._coords.curX + (coords.x - this._coords.x) * scale | 0;
    this.y = this._coords.curY + (coords.y - this._coords.y) * scale | 0;
    this.paint();
  }

  shiftX(neg = false, n = 1) {
    this.x += neg ? -n : n;
    this.paint();
  }

  shiftY(neg = false, n = 1) {
    this.y += neg ? -n : n;
    this.paint();
  }

  pan(event) {
    if (event.type === 'click') {
      return;
    }

    const scale = this.pxScale;
    const coords = (0, _SpriteSheet.getCoords)(event, scale);
    const x = this.x + (coords.x - this._coords.x) * scale;
    const y = this.y + (coords.y - this._coords.y) * scale;
    this.paint(x | 0, y | 0);
  }

  copy() {
    const data = new Uint8Array(16 * 16);
    const ctx = this.__ctx;
    const {
      x,
      y
    } = this.coords();
    const imageData = ctx.getImageData(x, y, 16, 16);

    for (let i = 0; i < data.length; i++) {
      const [r, g, b, a] = imageData.data.slice(i * 4, i * 4 + 4);
      const index = (0, _colour.toRGB332)(r, g, b);

      if (index === 0xe3 || a === 0) {
        data[i] = 0xe3;
      } else {
        data[i] = index;
      }
    }

    if (this.oncopy) this.oncopy(data);
  }

  paint(x = this.x, y = this.y) {
    const zoom = this.zoomFactor < 0 ? 512 << this.zoomFactor * -1 : 512 >> this.zoomFactor;
    const localCords = this.coords(x, y);
    this.status.innerHTML = `Zoom: ${5 - this.zoomFactor}:1<br>X/Y: ${localCords.x}/${localCords.y}`;
    const ctx = this.ctx;
    (0, _SpriteSheet.emptyCanvas)(ctx);
    const w = ctx.canvas.width;
    ctx.clearRect(0, 0, w, w);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.__ctx.canvas, -x, -y, zoom, zoom, 0, 0, w, w);
  }

  render(ctx = this.ctx, pixels) {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (let i = 0; i < imageData.data.length / 4; i++) {
      let index = pixels[i];
      const {
        r,
        g,
        b,
        a
      } = _SpriteSheet.colourTable[index];
      imageData.data[i * 4 + 0] = r;
      imageData.data[i * 4 + 1] = g;
      imageData.data[i * 4 + 2] = b;
      imageData.data[i * 4 + 3] = a * 255;
    }

    ctx.putImageData(imageData, 0, 0);
  }

}

exports.default = ImageWindow;
},{"../lib/$.js":"lib/$.js","./SpriteSheet.js":"sprites/SpriteSheet.js","../lib/track-down.js":"lib/track-down.js","./lib/colour.js":"sprites/lib/colour.js"}],"sprites/ColourPicker.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _colour = require("./lib/colour.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ColourPicker {
  constructor(size, target) {
    _defineProperty(this, "transparent", _colour.transparent);

    _defineProperty(this, "_index", 0);

    _defineProperty(this, "_history", []);

    this.size = size;
    const html = Array.from({
      length: size
    }, (_, i) => {
      return `<div title="Key ${i + 1}" data-id=${i} id="picker-${i}"></div>`;
    }).join('');
    target.innerHTML = html;
    target.addEventListener('mousedown', e => {
      if (e.target.dataset.id) {
        this.index = e.target.dataset.id;
      }
    });
    this.container = target;
    this.history = [0, 255, this.transparent];
    this.index = 0;
  }

  set value(index) {
    const colour = parseInt(index, 10);

    if (colour === this._history[0]) {
      this.index = 0;
      return;
    }

    this._history.unshift(colour);

    this.history = this._history.slice(0, this.size);
    this.index = 0;
  }

  set history(values) {
    this._history = values;
    values.forEach((value, i) => {
      const el = document.querySelector('#picker-' + i);
      el.title = `Key ${i} - ${value} -- 0x${value.toString(16).padStart(2, '0')}`;
      el.className = 'c-' + value;
    });
  }

  get value() {
    return this._history[this._index];
  }

  set index(value) {
    value = parseInt(value, 10);
    this._index = value;
    this.container.dataset.selected = value + 1;
  }

}

exports.default = ColourPicker;
},{"./lib/colour.js":"sprites/lib/colour.js"}],"sprites/Tool.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _$ = require("../lib/$.js");

var _SpriteSheet = require("./SpriteSheet.js");

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class Tool {
  constructor({
    type = 'brush',
    colour
  }) {
    _defineProperty(this, "types", ['brush', 'fill', 'erase', 'pan']);

    _defineProperty(this, "_selected", 'brush');

    _defineProperty(this, "state", {
      target: null,
      index: null
    });

    this.colour = colour;
    (0, _$.$)('#tool-types button').on('click', e => {
      this.selected = e.target.dataset.action;
    });
    const shortcuts = this.types.map(_ => _[0]);
    document.body.addEventListener('keydown', e => {
      const k = e.key;
      const i = shortcuts.indexOf(k);

      if (i > -1) {
        this.selected = this.types[i];
      }
    });
    this.selected = type;
  }

  get selected() {
    return this._selected;
  }

  set selected(value) {
    this._selected = value;
    this.state = {
      index: null,
      target: null,
      x: 0,
      y: 0
    };
    (0, _$.$)('#tool-types button').className = '';
    (0, _$.$)(`#tool-types button[data-action="${value}"]`).className = 'selected';
    document.documentElement.dataset.tool = value;
  }

  resetState() {
    this.state = {
      index: null,
      target: null,
      x: 0,
      y: 0
    };
  }

  shift(shift) {
    this.state.index = null;
    console.log('shift called', this.state, shift);

    if (shift) {
      if (this._last !== 'erase') this._last = this.selected;
      this.selected = 'erase';
    } else {
      if (this.state.dirty) {
        console.log('commiting');
        const sprites = this.state.dirty;
        this.state.dirty = false;
        this.state.x = 0;
        this.state.y = 0;
        sprites.snapshot();
        sprites.canvasToPixels();
        sprites.rebuild(sprites.current);
        sprites.paint();
      }

      if (this._last) {
        // this.selected setter clears dirty flag
        this.selected = this._last;
        this._last = null;
      }
    }
  }

  shiftX(neg = false, n = 1, sprites) {
    this.shiftPx('x', neg, n, sprites);
  }

  shiftY(neg = false, n = 1, sprites) {
    this.shiftPx('y', neg, n, sprites);
  }

  shiftPx(axis, neg, n, sprites) {
    // important, we're using the shift key to manually pan
    // so we're tracking it with this dirty state. when shift
    // goes to false, then we need to clear this state
    this.state.dirty = sprites;
    const sprite = sprites.sprite;
    const ctx = sprites.ctx;
    this.state[axis] += neg ? -n : n;
    const {
      x,
      y
    } = this.state; // weird way to do it.

    console.log({
      x,
      y
    });
    sprite.render(x, y);
    sprite.paint(ctx);
  }

  pan(coords, sprites) {
    const sprite = sprites.sprite;
    const ctx = sprites.ctx;
    const x = coords.x - this._coords.x;
    const y = coords.y - this._coords.y;
    sprite.render(x, y);
    sprite.paint(ctx);
  }

  fill(sprites, coords, source, target) {
    if (!coords || coords.index === null) return;
    const value = sprites.pget(coords);

    if (value !== source || value === target) {
      return;
    }

    this.paint(sprites, coords, target);
    const {
      x,
      y
    } = coords;
    this.fill(sprites, {
      x: x - 1,
      y
    }, source, target);
    this.fill(sprites, {
      x: x + 1,
      y
    }, source, target);
    this.fill(sprites, {
      x,
      y: y - 1
    }, source, target);
    this.fill(sprites, {
      x,
      y: y + 1
    }, source, target);
  }

  paint(sprites, coords, target) {
    return sprites.pset(coords, target);
  }

  start(event) {
    const coords = (0, _SpriteSheet.getCoords)(event, 32);
    this._coords = coords;
  }

  end() {// this._coords = null;
  }

  apply(event, sprites) {
    const coords = (0, _SpriteSheet.getCoords)(event, 32, 32);
    let target = this.colour.value;

    if (this.selected === 'erase') {
      target = this.colour.transparent;
    } // if nothing has changed, don't do the work


    if (event.type === this.state.event && coords.index === this.state.index && target === this.state.target) {
      return;
    }

    this.state.index = coords.index;
    this.state.target = target;
    this.state.event = event.type;

    if (this.selected === 'pan') {
      if (event.type === 'click' && this._coords.index !== coords.index) {
        // this is a release
        // read from the canvas and put into pixels
        sprites.snapshot();
        sprites.canvasToPixels();
        sprites.rebuild(sprites.current);
        sprites.paint();
        return;
      }

      if (!this._coords) {
        return; // noop
      }

      this.pan(coords, sprites);
      return;
    }

    if (this.selected === 'fill') {
      // now find surrounding pixels of the same colour
      this.fill(sprites, coords, sprites.pget(coords), target);
    } else {
      this.paint(sprites, coords, target);
    } // update canvas


    if (event.type === 'click') sprites.snapshot();
    sprites.paint();
  }

}

exports.default = Tool;
},{"../lib/$.js":"lib/$.js","./SpriteSheet.js":"sprites/SpriteSheet.js"}],"sprites/TileMap.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getCoords = getCoords;
exports.default = void 0;

var _SpriteSheet = require("./SpriteSheet.js");

var _$ = require("../lib/$.js");

var _trackDown = _interopRequireDefault(require("../lib/track-down.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const dummySpriteSheet = {
  get() {
    return dummySpriteSheet;
  },

  paint() {}

};

function getCoords(e, w, size) {
  const rect = e.target.getBoundingClientRect();
  const x = (e.clientX - rect.left) / size | 0; //x position within the element.

  const y = (e.clientY - rect.top) / size | 0; //y position within the element.

  const index = (0, _SpriteSheet.xyToIndex)({
    x,
    y,
    w
  });
  return {
    x,
    y,
    index
  };
}

const sizes = new Map([[16, {
  bank: 16 * 12,
  w: 16,
  h: 12
}], [8, {
  bank: 32 * 24,
  w: 32,
  h: 24
}]]);

class TileMap {
  constructor({
    size = 16,
    sprites
  }) {
    _defineProperty(this, "scale", 2);

    _defineProperty(this, "_sprites", null);

    _defineProperty(this, "_tmp", null);

    _defineProperty(this, "getXY", i => {
      const x = i % this.width;
      const y = i / this.width | 0;
      return {
        x,
        y
      };
    });

    const scale = this.scale;
    this.size = size;
    const {
      bank,
      w,
      h
    } = sizes.get(size);
    this.width = w;
    this.height = h;
    this.bank = new Uint8Array(bank);
    this.bank.fill(1024 / size - 1);
    this.ctx = document.createElement('canvas').getContext('2d');
    const el = this.ctx.canvas;
    el.style.maxWidth = `${w * size * scale}px`;
    el.width = w * size * scale;
    el.height = h * size * scale;
    const cancel = (0, _trackDown.default)(el, {
      handler: e => {
        const {
          index
        } = getCoords(e, this.width, this.size * this.scale);
        this.set(index);
        this._tmp = null;
        this.paint();
      },
      end: e => this.hover(e)
    });
    el.addEventListener('mouseout', () => {
      cancel();
      this.clearHover();
    });
    this.sprites = sprites;
    this.active = true;
  }

  set active(value) {
    (0, _$.$)(`.tile-controls input[name="size"][value="${this.size}"]`).checked = true;
    (0, _$.$)(`.tile-controls input[name="width"]`).value = this.width;
    (0, _$.$)(`.tile-controls input[name="height"]`).value = this.height;
  }

  set sprites(sprites) {
    this._sprites = sprites || dummySpriteSheet;
    if (sprites) sprites.hook(() => this.paint());
    this.paint();
  }

  get sprites() {
    return this._sprites;
  }

  set(index) {
    this.bank[index] = this.sprites.current;
  }

  clearHover() {
    if (this._tmp !== null) {
      const index = this._tmp;
      const {
        x,
        y
      } = this.getXY(index); // if (this.bank[index] === -1) {
      //   this.ctx.clearRect(
      //     x * this.size * this.scale,
      //     y * this.size * this.scale,
      //     this.size * this.scale,
      //     this.size * this.scale
      //   );
      // } else {

      const sprite = this.sprites.get(this.bank[index]);
      sprite.paint(this.ctx, x * this.size * this.scale, y * this.size * this.scale, this.size * this.scale, false); // }

      this._tmp = null;
    }
  }

  hover(e) {
    const {
      index,
      x,
      y
    } = getCoords(e, this.width, this.size * this.scale);

    if (this._tmp === index) {
      return;
    }

    this.clearHover();
    this._tmp = index;
    this.sprites.sprite.paint(this.ctx, x * this.size * this.scale, y * this.size * this.scale, this.size * this.scale, false);
  }

  paint() {
    for (let i = 0; i < this.bank.length; i++) {
      // if (this.bank[i] > -1) {
      const {
        x,
        y
      } = this.getXY(i);
      const sprite = this.sprites.get(this.bank[i]);
      sprite.paint(this.ctx, x * this.size * this.scale, y * this.size * this.scale, this.size * this.scale, false); // }
    }
  }

}

exports.default = TileMap;
},{"./SpriteSheet.js":"sprites/SpriteSheet.js","../lib/$.js":"lib/$.js","../lib/track-down.js":"lib/track-down.js"}],"bas/codes.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
// https://en.wikipedia.org/wiki/ZX_Spectrum_character_set
var _default = {
  // 0x3a: ':',
  // 0x2a: '*',
  0x87: 'PEEK$',
  0x88: 'REG',
  0x89: 'DPOKE',
  0x8a: 'DPEEK',
  0x8b: 'MOD',
  0x8c: '<<',
  0x8d: '>>',
  0x8e: 'UNTIL',
  0x8f: 'ERROR',
  0x90: 'ON',
  0x91: 'DEFPROC',
  0x92: 'ENDPROC',
  0x93: 'PROC',
  0x94: 'LOCAL',
  0x95: 'DRIVER',
  0x96: 'WHILE',
  0x97: 'REPEAT',
  0x98: 'ELSE',
  0x99: 'REMOUNT',
  0x9a: 'BANK',
  0x9b: 'TILE',
  0x9c: 'LAYER',
  0x9d: 'PALETTE',
  0x9e: 'SPRITE',
  0x9f: 'PWD',
  0xa0: 'CD',
  0xa1: 'MKDIR',
  0xa2: 'RMDIR',
  0xa3: 'SPECTRUM',
  0xa4: 'PLAY',
  0xa5: 'RND',
  0xa6: 'INKEY$',
  0xa7: 'PI',
  0xa8: 'FN',
  0xa9: 'POINT',
  0xaa: 'SCREEN$',
  0xab: 'ATTR',
  0xac: 'AT',
  0xad: 'TAB',
  0xae: 'VAL$',
  0xaf: 'CODE',
  0xb0: 'VAL',
  0xb1: 'LEN',
  0xb2: 'SIN',
  0xb3: 'COS',
  0xb4: 'TAN',
  0xb5: 'ASN',
  0xb6: 'ACS',
  0xb7: 'ATN',
  0xb8: 'LN',
  0xb9: 'EXP',
  0xba: 'INT',
  0xbb: 'SQR',
  0xbc: 'SGN',
  0xbd: 'ANS',
  0xbe: 'PEEK',
  0xbf: 'IN',
  0xc0: 'USR',
  0xc1: 'STR$',
  0xc2: 'CHR$',
  0xc3: 'NOT',
  0xc4: 'BIN',
  0xc5: 'OR',
  0xc6: 'AND',
  0xc7: '<=',
  0xc8: '>=',
  0xc9: '<>',
  0xca: 'LINE',
  0xcb: 'THEN',
  0xcc: 'TO',
  0xcd: 'STEP',
  0xce: 'DEF FN',
  0xcf: 'CAT',
  0xd0: 'FORMAT',
  0xd1: 'MOVE',
  0xd2: 'ERASE',
  0xd3: 'OPEN#',
  0xd4: 'CLOSE#',
  0xd5: 'MERGE',
  0xd6: 'VERIFY',
  0xd7: 'BEEP',
  0xd8: 'CIRCLE',
  0xd9: 'INK',
  0xda: 'PAPER',
  0xdb: 'FLASH',
  0xdc: 'BRIGHT',
  0xdd: 'INVERSE',
  0xde: 'OVER',
  0xdf: 'OUT',
  0xe0: 'LPRINT',
  0xe1: 'LLIST',
  0xe2: 'STOP',
  0xe3: 'READ',
  0xe4: 'DATA',
  0xe5: 'RESTORE',
  0xe6: 'NEW',
  0xe7: 'BORDER',
  0xe8: 'CONTINUE',
  0xe9: 'DIM',
  0xea: 'REM',
  0xeb: 'FOR',
  0xec: 'GO TO',
  0xed: 'GO SUB',
  0xee: 'INPUT',
  0xef: 'LOAD',
  0xf0: 'LIST',
  0xf1: 'LET',
  0xf2: 'PAUSE',
  0xf3: 'NEXT',
  0xf4: 'POKE',
  0xf5: 'PRINT',
  0xf6: 'PLOT',
  0xf7: 'RUN',
  0xf8: 'SAVE',
  0xf9: 'RANDOMIZE',
  0xfa: 'IF',
  0xfb: 'CLS',
  0xfc: 'DRAW',
  0xfd: 'CLEAR',
  0xfe: 'RETURN',
  0xff: 'COPY'
};
exports.default = _default;
},{}],"lib/to.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zxToFloat = exports.floatToZX = exports.toHex = exports.toBinary = void 0;

const toBinary = (n, size = 8) => {
  if (n < 0) {
    return Array.from({
      length: size
    }, (_, i) => {
      return (n >> i & 1) === 1 ? 1 : 0;
    }).reverse().join('');
  }

  return n.toString(2).padStart(size, 0);
};

exports.toBinary = toBinary;

const toHex = (n, size = 8) => {
  if (n < 0) {
    n = parseInt(toBinary(n, size), 2);
  }

  return n.toString(16).padStart(size / (8 / 2), 0).toUpperCase();
}; // https://www.facebook.com/groups/ZXNextBasic/permalink/792585537934454/?comment_id=792727721253569
// by Daniel A. Nagy originally in C, bless his socks


exports.toHex = toHex;

const floatToZX = input => {
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

exports.floatToZX = floatToZX;

const zxToFloat = source => {
  const view = new DataView(source.buffer);
  const exp = view.getUint8(0) - 128;
  let mantissa = view.getUint32(1, false);
  let sign = mantissa >>> 31 ? -1 : 1;
  mantissa = mantissa | 0x80000000;
  let frac = 0;

  for (let i = 0; i < 32; i++) {
    if (mantissa >> i & 1) {
      const v = Math.pow(2, -(32 - i));
      frac += v;
    }
  }

  frac = frac.toFixed(8);
  const value = frac * Math.pow(2, exp);
  return value * sign;
};

exports.zxToFloat = zxToFloat;
},{}],"lib/unpack/lib.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.encode = exports.decode = exports.typeMap = exports.pattern = void 0;
const pattern = '([aAZbBhHcCWqQnNvVuUx@]|[sSlLiI][\\!><]?)(?:([\\d*]+)|(?:\\[(.*)\\]))?(?:\\$([a-zA-Z0-9_]+)\\b)?';
exports.pattern = pattern;
const typeMap = {
  x: {
    length: 1
  },
  b: {
    length: 1
  },
  //B: { length: 1, fn: 'Uint8', little: true }, // bit
  // h: { length: 2, fn: 'Uint16' },
  // H: { length: 2, fn: 'Uint16', little: true }, // nibble
  c: {
    length: 1,
    fn: 'Int8',
    array: Int8Array
  },
  // char == byte
  C: {
    length: 1,
    fn: 'Uint8',
    array: Uint8Array
  },
  a: {
    length: 1,
    fn: 'Uint8'
  },
  // string with arbitrary, null padded
  A: {
    length: 1,
    fn: 'Uint8'
  },
  // string with arbitrary, space padded
  s: {
    length: 2,
    fn: 'Int16',
    array: Int16Array
  },
  S: {
    length: 2,
    fn: 'Uint16',
    array: Uint16Array
  },
  i: {
    length: 4,
    fn: 'Int32',
    array: Int32Array
  },
  I: {
    length: 4,
    fn: 'Uint32',
    array: Uint32Array
  },
  l: {
    length: 8,
    fn: 'Int64'
  },
  L: {
    length: 8,
    fn: 'Uint64'
  },
  n: {
    length: 2,
    fn: 'Uint16',
    little: false
  },
  N: {
    length: 4,
    fn: 'Uint32',
    little: false
  },
  f: {
    length: 4,
    fn: 'Float32',
    array: Float32Array
  },
  d: {
    length: 8,
    fn: 'Float64',
    array: Float64Array
  }
};
exports.typeMap = typeMap;

const decode = a => new TextDecoder().decode(a);

exports.decode = decode;

const encode = a => new TextEncoder().encode(a);

exports.encode = encode;
},{}],"lib/unpack/pack.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pack;

var _lib = require("./lib.js");

function pack(template, data, offset = 0) {
  if (ArrayBuffer.isView(data)) {
    data = data.buffer;
  }

  const re = new RegExp(_lib.pattern, 'g');
  let m = [];
  let bytePtr = 0;
  let little = false;
  const firstChr = template[0];
  const defaultLittle = firstChr === '<' ? true : false;
  let templateCounter = -1;
  let dataLength = 0;

  while (m = re.exec(template)) {
    let length = null;

    if (_lib.typeMap[m[2]]) {
      length = _lib.typeMap[m[2]].length;
    } else {
      length = parseInt(m[2] || 1);
    }

    let c = m[1];

    if (c.length === 2) {
      little = c[1] === '<';
      c = c[0];
    }

    const type = _lib.typeMap[c];

    if (!type) {
      throw new Error(`unsupported type "${c}"`);
    }

    const size = type.length;
    let end = c === 'b' ? length / 8 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    dataLength += end; // ?
  }

  const result = new DataView(new ArrayBuffer(dataLength));

  while (m = re.exec(template)) {
    templateCounter++;
    const index = m[4] || templateCounter;
    let little = defaultLittle;
    let length = null;

    if (_lib.typeMap[m[2]]) {
      length = _lib.typeMap[m[2]].length;
    } else {
      length = parseInt(m[2] || 1);
    }

    let c = m[1];

    if (c.length === 2) {
      little = c[1] === '<';
      c = c[0];
    }

    const type = _lib.typeMap[c];

    if (!type) {
      throw new Error(`unsupported type "${c}"`);
    } // forced endianness


    if (type.little !== undefined) {
      little = type.little;
    }

    const size = type.length;
    let end = c === 'b' ? 1 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    if (offset + end > data.byteLength) {
      // return result;
      break;
    }

    if (c !== 'b') {
      // reset the byte counter
      bytePtr = 0;
    }

    switch (c) {
      case 'b':
        result.setUint8(offset, result.getUint8(offset) | data[index] << 8 - bytePtr - length);
        bytePtr += length;

        if (bytePtr > 7) {
          offset++;
          bytePtr = 0;
        }

        break;

      case 'x':
        // x is skipped null bytes
        templateCounter--;
        offset += end;
        result.setUint8(offset, 0x00);
        break;

      case 'a':
      case 'A':
        new Uint8Array(result.buffer, offset, end).set((0, _lib.encode)(data[index]));
        offset += end;
        break;

      default:
        if (length > 1) {
          for (let i = index; i < index + length; i++) {
            result[`set${type.fn}`](offset, data[i], little);
            templateCounter++;
            offset += type.length;
          }
        } else {
          result[`set${type.fn}`](offset, data[index], little);
        }

        offset += end;
        break;
    }
  }

  return new Uint8Array(result.buffer);
}
},{"./lib.js":"lib/unpack/lib.js"}],"bas/txt2bas.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.plus3DOSHeader = exports.asTap = exports.tapHeader = exports.calculateXORChecksum = exports.encode = void 0;

var _codes = _interopRequireDefault(require("./codes.js"));

var _to = require("../lib/to.js");

var _pack = _interopRequireDefault(require("../lib/unpack/pack.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const encode = a => new TextEncoder().encode(a);

exports.encode = encode;

const calculateXORChecksum = array => Uint8Array.of(array.reduce((checksum, item) => checksum ^ item, 0))[0];

exports.calculateXORChecksum = calculateXORChecksum;
const opTable = Object.entries(_codes.default).reduce((acc, [code, str]) => {
  acc[str] = parseInt(code);
  return acc;
}, {
  GOTO: 0xec
});
/*
header unpack template:
<S$headerLength
C$flagByte
C$type
A10$filename
S$length
S$autostart
S$varStart
C$checksum

S$nextBlockLength

C$blockType
C……$data
C$blockChecksum
*/

const tapHeader = (basic, filename = 'BASIC') => {
  const autostart = new DataView(basic.buffer).getUint16(0, false);
  const res = (0, _pack.default)('<S$headerLength C$flagByte C$type A10$filename S$length S$p1 S$p2 C$checksum', {
    headerLength: 19,
    flagByte: 0x0,
    // header
    type: 0x00,
    // program
    filename: filename.slice(0, 10),
    // 10 chrs max
    length: basic.length,
    p1: autostart,
    p2: basic.length,
    checksum: 0 // solved later

  });
  const checksum = calculateXORChecksum(res.slice(2, 20));
  res[res.length - 1] = checksum;
  return res;
};

exports.tapHeader = tapHeader;

const asTap = (basic, filename = 'tap dot js') => {
  const header = tapHeader(basic, filename);
  const dataType = 0xff;
  const checksum = calculateXORChecksum(Array.from([dataType, ...basic]));
  const tapData = new Uint8Array(header.length + basic.length + 2 + 2); // ? [header.length, basic.length]

  tapData.set(header, 0); // put header in tap

  new DataView(tapData.buffer).setUint16(header.length, basic.length + 2, true); // set follow block length (plus 2 for flag + checksum)

  tapData[header.length + 2] = dataType; // data follows

  tapData.set(basic, header.length + 3); // put basic binary in tap

  tapData[tapData.length - 1] = checksum; // finish with 8bit checksum

  return tapData;
};

exports.asTap = asTap;

const plus3DOSHeader = (basic, opts = {
  hType: 0,
  hOffset: basic.length - 128
}) => {
  const {
    hType,
    hOffset
  } = opts;
  const res = (0, _pack.default)('< A8$sig C$eof C$issue C$version I$length C$hType S$hFileLength n$hLine S$hOffset', {
    sig: 'PLUS3DOS',
    eof: 26,
    issue: 1,
    version: 0,
    length: basic.length,
    hType,
    hFileLength: basic.length - 128,
    hLine: 128,
    hOffset
  });
  const checksum = Array.from(res).reduce((acc, curr) => acc += curr, 0);
  const result = new Uint8Array(128);
  result.set(res, 0);
  result[127] = checksum;
  return result;
}; // Based on (with huge mods) https://eli.thegreenplace.net/2013/07/16/hand-written-lexer-in-javascript-compared-to-the-regex-based-ones


exports.plus3DOSHeader = plus3DOSHeader;

class Lexer {
  constructor() {
    _defineProperty(this, "pos", 0);

    _defineProperty(this, "buf", null);

    _defineProperty(this, "bufLen", 0);

    _defineProperty(this, "opTable", opTable);
  }

  // Initialize the Lexer's buffer. This resets the lexer's internal
  // state and subsequent tokens will be returned starting with the
  // beginning of the new buffer.
  input(buf) {
    this.pos = 0;
    this.buf = buf;
    this.bufLen = buf.length;
  }

  lines(lines) {
    const data = lines.split('\n').map(line => this.line(line).basic);
    const len = data.reduce((acc, curr) => acc += curr.length, 0);
    const res = new Uint8Array(len);
    let offset = 0;
    data.forEach(line => {
      res.set(line, offset);
      offset += line.length;
    });
    return res;
  } // TODO arrays


  line(line) {
    this.input(line);
    this.inLiteral = false;
    let lineNumber = null;
    let tokens = [];
    let length = 0;
    let token = null;

    while (token = this.token()) {
      const {
        name,
        value
      } = token;

      if (!lineNumber && name === 'NUMBER') {
        lineNumber = parseInt(value, 10);
        continue;
      }

      if (name === 'KEYWORD') {
        length++;
        tokens.push(token);

        if (_codes.default[value] === 'REM') {
          token = this._processComment();
          length += token.value.length;
          tokens.push(token);
        }

        if (_codes.default[value] === 'BIN') {
          token = this._processBinary(); // ?

          length += token.value.length;
          tokens.push(token);
        }
      } else if (name === 'NUMBER') {
        length += value.toString().length;
        const {
          numeric
        } = token;
        tokens.push(token);

        if ((numeric | 0) === numeric && numeric >= -65535 && numeric <= 65535) {
          const view = new DataView(new ArrayBuffer(6));
          view.setUint8(0, 0x0e);
          view.setUint8(1, 0x00);
          view.setUint8(2, numeric < 0 ? 0xff : 0x00);
          view.setUint16(3, numeric, true);
          tokens.push({
            name: 'NUMBER_DATA',
            value: new Uint8Array(view.buffer)
          });
          length += 6;
        } else {
          const value = new Uint8Array(6);
          value[0] = 0x0e;
          value.set((0, _to.floatToZX)(numeric), 1);
          tokens.push({
            name: 'NUMBER_DATA',
            value
          });
          length += 6;
        }
      } else {
        length += value.toString().length;
        tokens.push(token);
      }
    } // add the end of carriage to the line


    tokens.push({
      name: 'KEYWORD',
      value: 0x0d
    });
    length++;
    const buffer = new DataView(new ArrayBuffer(length + 4));
    buffer.setUint16(0, lineNumber, false); // line number is stored as big endian

    buffer.setUint16(2, length, true);
    let offset = 4;
    tokens.forEach(({
      name,
      value
    }) => {
      if (name === 'KEYWORD') {
        buffer.setUint8(offset, value);
        offset++;
      } else if (name === 'NUMBER_DATA') {
        const view = new Uint8Array(buffer.buffer);
        view.set(value, offset);
        offset += value.length;
      } else {
        const v = value.toString();
        const view = new Uint8Array(buffer.buffer);
        view.set(encode(v), offset);
        offset += v.length;
      }
    }); // console.log(tokens);

    return {
      basic: new Uint8Array(buffer.buffer),
      lineNumber,
      tokens,
      length
    };
  } // Get the next token from the current buffer. A token is an object with
  // the following properties:
  // - name: name of the pattern that this token matched (taken from rules).
  // - value: actual string value of the token.
  // - pos: offset in the current buffer where the token starts.
  //
  // If there are no more tokens in the buffer, returns null. In case of
  // an error throws Error.


  token() {
    this._skipNonTokens();

    if (this.pos >= this.bufLen) {
      return null;
    } // The char at this.pos is part of a real token. Figure out which.


    var c = this.buf.charAt(this.pos);

    const _next = this.buf.charAt(this.pos + 1); // comments are slurped elsewhere
    // Look it up in the table of operators


    var op = this.opTable[c];

    if (op !== undefined) {
      return {
        name: 'KEYWORD',
        value: op,
        pos: this.pos++
      };
    } else {
      // Not an operator - so it's the beginning of another token.
      // if alpha or starts with 0 (which can only be binary)
      if (Lexer._isAlpha(c) || c === '' || c === '.' && Lexer._isAlpha(_next)) {
        return this._processIdentifier();
      } else if (Lexer._isStartOfComment(c)) {
        return this._processComment();
      } else if (Lexer._isLiteralNumeric(c)) {
        this.inLiteral = true;
        return {
          name: 'SYMBOL',
          value: c,
          pos: this.pos++
        };
      } else if (c === '.' && Lexer._isDigit(_next)) {
        return this._processNumber();
      } else if (Lexer._isDigit(c)) {
        return this._processNumber();
      } else if (Lexer._isLiteralReset(c)) {
        this.inLiteral = false;
        return {
          name: 'SYMBOL',
          value: c,
          pos: this.pos++
        };
      } else if (Lexer._isStatementSep(c)) {
        this.inLiteral = false;
        return {
          name: 'SYMBOL',
          value: c,
          pos: this.pos++
        };
      } else if (Lexer._isSymbol(c)) {
        if (c === '<' || c === '>') {
          // check if the next is a symbol
          const value = this.opTable[Object.keys(opTable).find(_ => _ === c + _next)];

          if (value) {
            return {
              name: 'KEYWORD',
              value,
              pos: this.pos += 2
            };
          }
        }

        return {
          name: 'SYMBOL',
          value: c,
          pos: this.pos++
        };
      } else if (c === '"') {
        return this._processQuote();
      } else if (Lexer._isNumericSymbol(c)) {
        return {
          name: 'SYMBOL',
          value: c,
          pos: this.pos++
        };
      } else {
        throw Error(`Token error at ${this.pos} (${c})\n${this.buf}`);
      }
    }
  }

  static _isNumericSymbol(c) {
    return c === '@' || c === '$';
  }

  static _isLiteralNumeric(c) {
    return c === '%';
  }

  static _isBinary(c) {
    return c === '1' || c === '0';
  }

  static _isNewLine(c) {
    return c === '\r' || c === '\n';
  }

  static _isDigit(c) {
    return c >= '0' && c <= '9';
  }

  static _isStatementSep(c) {
    return c === ':';
  }

  static _isLiteralReset(c) {
    return c === '=' || c === ',';
  }

  static _isSymbol(c) {
    return '!,;-+/*()<>#%${}[]|&^'.includes(c);
  }

  static _isAlpha(c) {
    return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c === '_' || c === '$';
  }

  static _isStartOfComment(c) {
    return c === ';';
  }

  static _isAlphaNum(c) {
    return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || c === '_';
  }

  _processLiteralNumber() {
    var endPos = this.pos + 1;
    let needsClose = false;

    while (endPos < this.bufLen && (Lexer._isDigit(this.buf.charAt(endPos)) || this.buf.charAt(endPos) === '(' || this.buf.charAt(endPos) === '!') || needsClose && this.buf.charAt(endPos) === ')') {
      if (this.buf.charAt(endPos) === '(') {
        needsClose = true; // only allow this once
      }

      endPos++;
    }

    const value = this.buf.substring(this.pos, endPos);
    var tok = {
      name: 'LITERAL_NUMBER',
      value,
      pos: this.pos
    };
    this.pos = endPos;
    return tok;
  }

  _processNumber() {
    var endPos = this.pos + 1;
    let exp = false;

    while (endPos < this.bufLen && (Lexer._isDigit(this.buf.charAt(endPos)) || this.buf.charAt(endPos) === '.' || this.buf.charAt(endPos) === 'e') || exp && this.buf.charAt(endPos) === '-') {
      if (this.buf.charAt(endPos) === 'e') {
        exp = true; // only allow this once
      } else {
        exp = false;
      }

      endPos++;
    }

    const value = this.buf.substring(this.pos, endPos);
    let numeric = 0;

    if (value.includes('.')) {
      numeric = parseFloat(value);
    } else {
      numeric = parseInt(value, 10);
    }

    let name = 'NUMBER';

    if (this.inLiteral) {
      name = 'LITERAL_NUMBER';
    }

    var tok = {
      name,
      value,
      numeric,
      pos: this.pos
    };
    this.pos = endPos;
    return tok;
  }

  _processBinary(start = '') {
    this._skipNonTokens();

    if (start.length) {
      this.pos += start.length;
    }

    var endPos = this.pos;

    while (endPos < this.bufLen && Lexer._isBinary(this.buf.charAt(endPos))) {
      endPos++;
    }

    var tok = {
      name: 'BINARY',
      value: start + this.buf.substring(this.pos, endPos).trim(),
      pos: this.pos
    };
    this.pos = endPos;
    return tok;
  }

  _processComment() {
    var endPos = this.pos; // Skip until the end of the line

    while (endPos < this.bufLen && !Lexer._isNewLine(this.buf.charAt(endPos))) {
      endPos++;
    }

    var tok = {
      name: 'COMMENT',
      value: this.buf.substring(this.pos, endPos).trim(),
      pos: this.pos
    };
    this.pos = endPos + 1;
    return tok;
  }

  _isOpCode(endPos) {
    let curr = this.buf.substring(this.pos, endPos).toUpperCase();

    const _next = this.buf.charAt(endPos, endPos + 1);

    let ignorePeek = false;

    if (_next == ' ' && curr === 'GO') {
      // check if the next is "SUB" or "TO"
      const next = this._peekToken(1).toUpperCase();

      if (next === 'SUB' || next === 'TO') {
        endPos = endPos + 1 + next.length;
        curr = curr + ' ' + next;
        ignorePeek = true;
      }
    }

    if (this.opTable[curr] !== undefined) {
      const peeked = this._peekToken(-1).toUpperCase();

      if (ignorePeek === false && curr !== peeked) {
        return false;
      }

      this.pos = endPos;
      return {
        name: 'KEYWORD',
        value: this.opTable[curr],
        pos: this.pos
      };
    }

    return false;
  }

  _peekToken(offset = 0) {
    const tmp = this.pos;
    this.pos += offset + 1;

    this._skipNonTokens();

    let endPos = this.pos + 1;

    while (endPos < this.bufLen && Lexer._isAlphaNum(this.buf.charAt(endPos))) {
      endPos++;
    }

    const value = this.buf.substring(this.pos, endPos);
    this.pos = tmp;
    return value;
  }

  _processIdentifier() {
    var endPos = this.pos + 1;

    while (endPos < this.bufLen && Lexer._isAlphaNum(this.buf.charAt(endPos))) {
      let tok = this._isOpCode(endPos);

      if (tok) {
        return tok;
      }

      endPos++;
    }

    let tok = this._isOpCode(endPos);

    if (tok) {
      return tok;
    } // special case for GO<space>[TO|SUB]


    let value = this.buf.substring(this.pos, endPos);
    tok = {
      name: 'IDENTIFIER',
      value,
      pos: this.pos
    };
    this.pos = endPos;
    return tok;
  }

  _processQuote() {
    // this.pos points at the opening quote. Find the ending quote.
    var end_index = this.buf.indexOf('"', this.pos + 1);

    if (end_index === -1) {
      throw Error('Unterminated quote at ' + this.pos);
    } else {
      var tok = {
        name: 'QUOTE',
        value: this.buf.substring(this.pos, end_index + 1),
        pos: this.pos
      };
      this.pos = end_index + 1;
      return tok;
    }
  }

  _skipNonTokens() {
    while (this.pos < this.bufLen) {
      var c = this.buf.charAt(this.pos);

      if (c == ' ' || c == '\t' || c == '\r' || c == '\n') {
        this.pos++;
      } else {
        break;
      }
    }
  }

} // const l = new Lexer();
// const res = l.line(
//   `
// 5 let b=@01111100
// `.trim()
// ); // ?
// bas2txtLines(res.basic); // ?


exports.default = Lexer;
},{"./codes.js":"bas/codes.js","../lib/to.js":"lib/to.js","../lib/unpack/pack.js":"lib/unpack/pack.js"}],"lib/Tabs.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Tab = void 0;

var _$ = require("./$.js");

class Tab {
  constructor(parent, root) {
    this.root = root;
    this.id = root.id;
  }

  hide() {
    this.root.style.display = 'none';
  }

  show() {
    this.root.setAttribute('style', '');
  }

}

exports.Tab = Tab;

class Tabs {
  constructor(selector) {
    this.root = document.querySelector(selector);
    const panels = (0, _$.$)(selector + ' > section:not([hidden])');
    this.panels = panels.map(el => new Tab(this, el));
    const ids = panels.map(_ => _.id);
    const tabNav = document.querySelector(selector + ' > .tabs ul');
    panels.map(panel => {
      const a = document.createElement('a');
      a.href = '#' + panel.id;
      a.innerText = panel.dataset.title;
      const li = document.createElement('li');
      li.appendChild(a);
      tabNav.appendChild(li);
    });
    this.tabs = (0, _$.$)(selector + ' > .tabs a');
    this.tabs.on('click', e => {
      e.preventDefault();
      this.show(e.target.hash.substring(1));
      window.history.pushState(null, '', e.target.hash);
    });
    this.show(window.location.hash.substring(1) || this.panels[0].id);
    window.addEventListener('hashchange', () => {
      const id = window.location.hash.substring(1);
      if (!ids.includes(id)) return; // ignore this

      this.show(id);
    });
  }

  show(id) {
    this.hide();
    this.panels.find(_ => _.id === id).show();
    this.tabs.find(_ => _.hash === '#' + id).className = 'selected';
    this.selected = id;
  }

  hide() {
    this.tabs.className = '';
    this.panels.forEach(_ => _.hide());
  }

}

exports.default = Tabs;
},{"./$.js":"lib/$.js"}],"lib/unpack/dataview-64.js":[function(require,module,exports) {
if (!DataView.prototype.getUint64) DataView.prototype.getUint64 = function (byteOffset, littleEndian) {
  // split 64-bit number into two 32-bit (4-byte) parts
  const left = this.getUint32(byteOffset, littleEndian);
  const right = this.getUint32(byteOffset + 4, littleEndian); // combine the two 32-bit values

  const combined = littleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;
  if (!Number.isSafeInteger(combined)) console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
  return combined;
};
if (!DataView.prototype.getUint64) DataView.prototype.getInt64 = function (byteOffset, littleEndian) {
  // split 64-bit number into two 32-bit (4-byte) parts
  const left = this.getInt32(byteOffset, littleEndian);
  const right = this.getInt32(byteOffset + 4, littleEndian); // combine the two 32-bit values

  const combined = littleEndian ? left + 2 ** 32 * right : 2 ** 32 * left + right;
  if (!Number.isSafeInteger(combined)) console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');
  return combined;
};
},{}],"lib/unpack/unpack.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Unpack = void 0;

require("./dataview-64.js");

var _lib = require("./lib.js");

function binarySlice(value, ptr, length) {
  if (!length || isNaN(length)) {
    length = 8 - ptr;
  }

  const mask = 2 ** length - 1;
  const shift = 8 - (ptr + length);
  const res = value >> shift & mask;
  return res;
}

class Unpack {
  constructor(data) {
    this.data = data;
    this.offset = 0;
  }

  parse(template) {
    const res = unpack(template, this.data, this.offset);
    this.last = res;

    if (!res) {
      return res;
    }

    this.offset = res.__offset;
    delete res.__offset;
    return res;
  }

}

exports.Unpack = Unpack;

function unpack(template, data, offset = 0) {
  const result = {}; // return an object

  if (Array.isArray(data)) {
    data = Uint8Array.from(data);
  }

  if (typeof data === 'string') {
    data = (0, _lib.encode)(data).buffer; // ?
  } else if (typeof data === 'number') {
    if ((data | 0) !== data) {
      // float
      data = Float64Array.from([data]).buffer;
    } else {
      data = Int32Array.from([data]).buffer;
    }
  } else if (ArrayBuffer.isView(data)) {
    data = data.buffer;
  }

  if (offset >= data.byteLength) {
    return null;
  }

  const re = new RegExp(_lib.pattern, 'g');
  let m = [];
  let bytePtr = 0;
  const firstChr = template[0];
  const defaultLittle = firstChr === '<' ? true : false;
  let templateCounter = -1;

  while (m = re.exec(template)) {
    templateCounter++;
    const index = m[4] || templateCounter;
    let little = defaultLittle;
    let length = null;

    if (_lib.typeMap[m[2]]) {
      length = _lib.typeMap[m[2]].length;
    } else {
      length = parseInt(m[2] || 1);
    }

    let c = m[1];

    if (c.length === 2) {
      little = c[1] === '<';
      c = c[0];
    }

    const type = _lib.typeMap[c];

    if (!type) {
      throw new Error(`unsupported type "${c}"`);
    }

    if (type.little !== undefined) {
      little = type.little;
    }

    const size = type.length; // ?

    let end = c === 'b' ? 1 : size * length;

    if (isNaN(length)) {
      end = data.byteLength - offset;
    }

    if (offset + end > data.byteLength) {
      // return result;
      break;
    }

    const view = new DataView(data, offset, end);

    if (c !== 'b') {
      // reset the byte counter
      bytePtr = 0;
    }

    switch (c) {
      case 'b':
        c = view.getUint8(0, little);
        result[index] = binarySlice(c, bytePtr, length);
        result[index]; // ? [index,result[index],c, bytePtr, length]

        bytePtr += length;

        if (bytePtr > 7) {
          offset++;
          bytePtr = 0;
        }

        break;

      case 'x':
        // x is skipped null bytes
        templateCounter--;
        offset += end;
        break;

      case 'a':
      case 'A':
        result[index] = (0, _lib.decode)(view).padEnd(length, c === 'A' ? ' ' : '\0');

        if (c === 'a' && result[index].indexOf('\0') !== -1) {
          result[index] = result[index].substring(0, result[index].indexOf('\0'));
        }

        offset += end;
        break;

      default:
        if (length > 1) {
          result[index] = new type.array(view.buffer.slice(offset, offset + end));
        } else {
          result[index] = view[`get${type.fn}`](0, little);
        }

        offset += end;
        break;
    }
  }

  result.__offset = offset;
  return result;
}

var _default = unpack; // unpack('<I$length', Uint8Array.from([0xe7, 0x00, 0x00, 0x00])); // ?

exports.default = _default;
},{"./dataview-64.js":"lib/unpack/dataview-64.js","./lib.js":"lib/unpack/lib.js"}],"sprites/index.js":[function(require,module,exports) {
"use strict";

var _dnd = _interopRequireDefault(require("../lib/dnd.js"));

var _colour = require("./lib/colour.js");

var _save = _interopRequireDefault(require("../lib/save.js"));

var _parser = require("./lib/parser.js");

var _ImageWindow = _interopRequireDefault(require("./ImageWindow.js"));

var _$ = require("../lib/$.js");

var _SpriteSheet = _interopRequireDefault(require("./SpriteSheet.js"));

var _ColourPicker = _interopRequireDefault(require("./ColourPicker.js"));

var _Tool = _interopRequireDefault(require("./Tool.js"));

var _TileMap = _interopRequireDefault(require("./TileMap.js"));

var _txt2bas = require("../bas/txt2bas.js");

var _Tabs = _interopRequireDefault(require("../lib/Tabs.js"));

var _unpack = require("../lib/unpack/unpack.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const container = document.querySelector('#container');
const ctx = container.getContext('2d');
const spritesContainer = document.querySelector('#sprites .container');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const pickerColour = document.querySelector('.pickerColour div');
const buttons = (0, _$.$)('button[data-action]');
const tileDownloads = (0, _$.$)('#tiles button');
let sprites = null;

function newSpriteSheet(check = true) {
  if (check) {
    if (!confirm('Are you sure you want to create a blank new sprite sheet?')) {
      return;
    }
  }

  sprites = new _SpriteSheet.default(Uint8Array.from({
    length: 256 * 16 * 4
  }, (_, i) => {
    if (check == false && i < 256) return i;
    return _colour.transparent;
  }), ctx); // FIXME not quite right…

  tileMap.sprites = sprites;
  tileMap.paint();
  renderSpritePreviews();
  renderCurrentSprite();
}

function download() {
  const filename = prompt('Filename:', 'untitled.spr');

  if (filename) {
    (0, _save.default)(sprites.data, filename);
  }
}

const tabs = new _Tabs.default('.tabbed');
const colour = new _ColourPicker.default(8, pickerColour.parentNode);
const tool = new _Tool.default({
  colour
});
const tileMap = new _TileMap.default({
  size: 16,
  sprites
});
let imageWindow = null;
window.tileMap = tileMap;
document.querySelector('#tile-map-container').appendChild(tileMap.ctx.canvas);

function fileToImageWindow(file) {
  const res = (0, _parser.pngNoTransformFile)(file);
  const ctx = document.querySelector('#png-importer canvas.png').getContext('2d');
  imageWindow = new _ImageWindow.default(res.data, ctx, res.png.width, res.png.height);

  imageWindow.oncopy = data => sprites.set(data);

  window.imageWindow = imageWindow;
  imageWindow.paint();
}

function fileToTile(file) {
  const unpack = new _unpack.Unpack(file);
  unpack.parse(`<A8$sig
    C$marker
    C$issue
    C$version
    I$length
    C$hType
    S$hFileLength
    n$hLine
    S$hOffset
    x
    x104
    C$checksum`);
  tileMap.bank = new Uint8Array(file.slice(unpack.offset));
  tileMap.sprites = sprites; // just in case

  tileMap.paint();
}

(0, _dnd.default)(document.querySelector('#png-importer'), fileToImageWindow);
(0, _dnd.default)(document.querySelector('#tiles'), fileToTile);
const importMask = document.querySelector('#png-container .focus');
(0, _$.$)('#png-import-tools input[type=range]').on('input', e => {
  const v = parseInt(e.target.value);
  importMask.style.borderColor = `rgba(127, 127, 127, ${v / 100})`;
});
(0, _$.$)('#png-import-tools button').on('click', e => {
  const action = e.target.dataset.action;

  if (action === 'zoom-in') {
    imageWindow.zoom++;
  }

  if (action === 'zoom-out') {
    imageWindow.zoom--;
  }

  if (action === 'copy') {
    imageWindow.copy();
  }
});
buttons.on('click', e => {
  const action = e.target.dataset.action;

  if (action === 'new') {
    newSpriteSheet(true);
  }

  if (action === 'undo') {
    sprites.undo();
  }

  let currentSprite = sprites.current;
  const totalSprites = sprites.length;

  if (action.startsWith('ro')) {
    const left = action === 'rol';
    const right = action === 'ror';

    if (right && currentSprite == totalSprites - 1 || left && currentSprite === 0) {
      return;
    }

    sprites.snapshot();
    const offset = 256 * currentSprite;
    const copy = sprites.data.slice(offset, offset + 256);
    const next = (currentSprite + (left ? -1 : 1)) * 256;
    sprites.data.set(sprites.data.slice(next, next + 256), offset);
    sprites.data.set(copy, next);
    sprites.current += left ? -1 : 1;
    sprites.rebuild(sprites.current - 1);
    sprites.rebuild(sprites.current + 1);
    sprites.rebuild(sprites.current);
    sprites.paint();
  }

  if (action === 'copy') {
    sprites.copy();
  }

  if (action === 'paste') {
    sprites.paste();
  }

  if (action === 'clear') {
    sprites.clear();
  }

  if (action === 'download') {
    download();
  }
});
picker.addEventListener('mousedown', e => {
  colour.value = e.target.dataset.value;
});
let down = false;
container.addEventListener('mousedown', event => {
  down = true;
  tool.start(event);
}, true);
container.addEventListener('mouseup', () => {
  down = false;
  tool.end();
}, true);
container.addEventListener('mousemove', e => {
  if (down) {
    container.onclick(e);
  }
}, true);

container.onclick = e => {
  if (e.altKey || e.ctrlKey) {
    colour.value = sprites.pget(sprites.getCoords(e));
  } else {
    tool.apply(e, sprites);
  }
}; // main key handlers


document.documentElement.addEventListener('keyup', e => {
  if (e.key === 'Shift') {
    tool.shift(false);
  }
});
document.documentElement.addEventListener('keydown', e => {
  if (e.key === 'Shift') {
    tool.shift(true);
  }

  let focusTool = null;

  if (tabs.selected === 'sprite-editor') {
    focusTool = tool;
  } else if (tabs.selected === 'png-importer') {
    focusTool = imageWindow;
  }

  if (focusTool) {
    if (e.shiftKey && e.key === 'ArrowLeft') {
      focusTool.shiftX(true, e.ctrlKey ? 8 : 1, sprites);
    }

    if (e.shiftKey && e.key === 'ArrowRight') {
      focusTool.shiftX(false, e.ctrlKey ? 8 : 1, sprites);
    }

    if (e.shiftKey && e.key === 'ArrowUp') {
      focusTool.shiftY(true, e.ctrlKey ? 8 : 1, sprites);
    }

    if (e.shiftKey && e.key === 'ArrowDown') {
      focusTool.shiftY(false, e.ctrlKey ? 8 : 1, sprites);
    }
  }

  if (e.key >= '1' && e.key <= '8') {
    colour.index = parseInt(e.key, 10) - 1;
    return;
  }

  if (e.shiftKey === false && e.key === 'z' && (e.metaKey || e.ctrlKey)) {
    sprites.undo();
    tool.resetState();
    return;
  }

  if (e.key === 'D') {
    download();
    return;
  }

  if (!e.shiftKey) {
    let current = sprites.current;

    if (e.key === 'ArrowLeft') {
      current--;
    }

    if (e.key === 'ArrowRight') {
      current++;
    }

    if (current === sprites.length) {
      current = 0;
    } else if (current < 0) {
      current = sprites.length - 1;
    }

    if (current !== sprites.current) {
      sprites.current = current;
    }
  }
});

function buildStyleSheet() {
  let css = '';

  for (let i = 0; i < 256; i++) {
    const {
      r,
      g,
      b,
      a
    } = (0, _colour.rgbFromIndex)(i);
    css += `.c-${i} { background: rgba(${[r, g, b, a].join(', ')}); }`;
  }

  const s = document.createElement('style');
  s.innerText = css;
  document.head.append(s);
}

function renderCurrentSprite() {
  try {
    spritesContainer.querySelector('.focus').classList.remove('focus');
  } catch (e) {// noop
  }

  const focused = document.querySelector(`#sprites > :nth-child(${sprites.current + 1})`);
  if (focused) focused.classList.add('focus');
  sprites.paint();
}

function renderSpritePreviews() {
  spritesContainer.innerHTML = '';
  sprites.getPreviewElements().map((_, i) => {
    _.title = 'Index: ' + i;
    spritesContainer.appendChild(_);
  });
}

function fileHandler(file) {
  file = (0, _parser.decode)(file);
  sprites = new _SpriteSheet.default(file, ctx);
  tileMap.sprites = sprites;
  tileMap.paint();
  renderSpritePreviews();
  renderCurrentSprite();
}

function render(data, into) {
  into.innerHTML = '';

  for (let i = 0; i < data.length; i++) {
    let index = data[i];
    into.appendChild(makePixel(index, i));
  }
}

function makePixel(index, dataIndex) {
  const d = document.createElement('div');
  d.className = 'c-' + index;
  d.dataset.value = index;
  d.dataset.index = dataIndex;
  d.title = `${index} -- 0x${index.toString(16).padStart(2, '0')}`;
  return d;
}

container.onmousemove = e => {
  let {
    x,
    y
  } = sprites.getCoords(e);
  const value = sprites.pget({
    x,
    y
  });
  debug.innerHTML = `X:${x} Y:${y} -- ${value} 0x${value.toString(16).padStart(2, '0')}`;
};

container.onmouseout = () => {
  debug.innerHTML = '&nbsp;';
};

spritesContainer.addEventListener('click', e => {
  const node = e.target;

  if (node.nodeName === 'CANVAS') {
    sprites.current = Array.from(node.parentNode.childNodes).indexOf(node);
  }
});
(0, _dnd.default)(document.documentElement, fileHandler);

document.documentElement.ondrop = async e => {
  e.preventDefault();
  const files = e.dataTransfer.files;
  console.log('file length', files.length);

  if (files.length === 1) {
    const droppedFile = files[0];
    const reader = new FileReader();

    reader.onload = event => {
      fileHandler(new Uint8Array(event.target.result));
    };

    reader.readAsArrayBuffer(droppedFile);
  } else {
    let id = sprites.current + 1;
    await Promise.all(Array.from(files).map(file => {
      const reader = new FileReader();
      return new Promise(resolve => {
        reader.onload = event => {
          const res = (0, _parser.decode)(new Uint8Array(event.target.result));
          sprites.current = id;
          sprites.set(res);
          id++;
          resolve();
        }; // data url!


        reader.readAsArrayBuffer(file);
      });
    }));
    renderSpritePreviews();
    renderCurrentSprite();
  }
};

upload.addEventListener('change', e => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();

  reader.onload = event => {
    fileHandler(new Uint8Array(event.target.result));
  };

  reader.readAsArrayBuffer(droppedFile);
});
(0, _$.$)('input[name="transparency"]').on('change', e => {
  document.documentElement.dataset.transparency = e.target.value;
});
tileDownloads.on('click', e => {
  console.log(e.target.dataset.type);
  const filename = prompt('Filename:', 'untitled.map');

  if (filename) {
    const data = new Uint8Array(tileMap.bank.length + 128);
    data.set((0, _txt2bas.plus3DOSHeader)(data, {
      hType: 3,
      hOffset: 0x8000
    }));
    data.set(tileMap.bank, 128);
    (0, _save.default)(data, filename);
  }
}); // support native paste of pngs

document.onpaste = async event => {
  const items = (event.clipboardData || event.originalEvent.clipboardData).items;
  const files = [];

  for (let index in items) {
    const item = items[index];

    if (item.kind === 'file' && item.type === 'image/png') {
      files.push(item);
    }
  } // will only ever be 1 file :(


  let id = sprites.current;
  await Promise.all(files.map(item => {
    const blob = item.getAsFile();
    const reader = new FileReader();
    return new Promise(resolve => {
      reader.onload = event => {
        const res = (0, _parser.decode)(new Uint8Array(event.target.result));
        sprites.current = id;
        sprites.set(res);
        id++;
        resolve();
      }; // data url!


      reader.readAsArrayBuffer(blob);
    });
  }));
  renderSpritePreviews();
  renderCurrentSprite();
};

newSpriteSheet(false); // render the colour picker

render(Uint8Array.from({
  length: 256
}, (_, i) => i), picker);
buildStyleSheet();
},{"../lib/dnd.js":"lib/dnd.js","./lib/colour.js":"sprites/lib/colour.js","../lib/save.js":"lib/save.js","./lib/parser.js":"sprites/lib/parser.js","./ImageWindow.js":"sprites/ImageWindow.js","../lib/$.js":"lib/$.js","./SpriteSheet.js":"sprites/SpriteSheet.js","./ColourPicker.js":"sprites/ColourPicker.js","./Tool.js":"sprites/Tool.js","./TileMap.js":"sprites/TileMap.js","../bas/txt2bas.js":"bas/txt2bas.js","../lib/Tabs.js":"lib/Tabs.js","../lib/unpack/unpack.js":"lib/unpack/unpack.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;

function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}

module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "56488" + '/');

  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);

    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);

          if (didAccept) {
            handled = true;
          }
        }
      }); // Enable HMR for CSS by default.

      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });

      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }

    if (data.type === 'reload') {
      ws.close();

      ws.onclose = function () {
        location.reload();
      };
    }

    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }

    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}

function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);

  if (overlay) {
    overlay.remove();
  }
}

function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID; // html encode message and stack trace

  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}

function getParents(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return [];
  }

  var parents = [];
  var k, d, dep;

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];

      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }

  return parents;
}

function hmrApply(bundle, asset) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}

function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;

  if (!modules) {
    return;
  }

  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }

  if (checkedAssets[id]) {
    return;
  }

  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }

  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}

function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};

  if (cached) {
    cached.hot.data = bundle.hotData;
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }

  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });

    return true;
  }
}
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","sprites/index.js"], null)
//# sourceMappingURL=/sprites.2fa6e6a2.js.map