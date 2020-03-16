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

  root.ondrop = e => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    const reader = new FileReader();

    reader.onload = event => {
      callback(new Uint8Array(event.target.result));
    };

    reader.readAsArrayBuffer(droppedFile);
    return false;
  };
}
},{}],"sprites/lib/colour.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rgbFromIndex = rgbFromIndex;
exports.toRGB332 = toRGB332;

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
    a: 1
  };
}

function toRGB332(r, g, b) {
  return (Math.floor(r / 32) << 5) + (Math.floor(g / 32) << 2) + Math.floor(b / 64);
}
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
    throw new Error('unsupported dimension');
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

    dataIndex -= p * 4 * (spriteIndex / n | 0) * n; // if (spriteRow !== tmp) {
    //   console.log({
    //     row,
    //     offset,
    //     spriteRow,
    //     dataIndex,
    //     spriteIndex,
    //     n,
    //     alt: n * spriteIndex * 4,
    //     alt2: p * 4 * ((spriteIndex / n) | 0),
    //   });
    // }
    // tmp = spriteRow;

    const [r, g, b, a] = [pixels[dataIndex + ri], pixels[dataIndex + gi], pixels[dataIndex + bi], pixels[dataIndex + ai]];

    if (a === 0) {
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
        if (prop in HTMLElement.prototype) {
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

const $ = (s, ctx = document) => ArrayNode.from(ctx.querySelectorAll(s));

exports.$ = $;
},{}],"sprites/index.js":[function(require,module,exports) {
"use strict";

var _dnd = _interopRequireDefault(require("../lib/dnd.js"));

var _colour = require("./lib/colour.js");

var _save = _interopRequireDefault(require("../lib/save.js"));

var _parser = require("./lib/parser.js");

var _$ = require("../lib/$.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const container = document.querySelector('#container');
const spritesContainer = document.querySelector('#sprites');
const debug = document.querySelector('#debug');
const picker = document.querySelector('.picker');
const upload = document.querySelector('#upload input');
const pickerColour = document.querySelector('.pickerColour div');
const buttons = (0, _$.$)('#tools button[data-action]');
let sprites = Uint8Array.from({
  length: 256
}, (_, i) => i);
let currentSprite = 0;
let totalSprites = 1;

const newSprite = () => {
  totalSprites++;
  currentSprite = totalSprites - 1;
  sprites = Uint8Array.from(Array.from(sprites).concat(Array.from({
    length: 256
  }).fill(colour.transparent)));
  renderSpritePreviews();
  renderCurrentSprite();
};

const dupeSprite = () => {
  const offset = currentSprite;
  console.log('dupe ' + offset);
  const copy = Array.from(sprites.slice(offset * 256, offset * 256 + 256));
  totalSprites++;
  currentSprite = totalSprites - 1;
  sprites = Uint8Array.from(Array.from(sprites).concat(copy));
  renderSpritePreviews();
  renderCurrentSprite();
};

function download() {
  const filename = prompt('Filename:', 'untitled.spr');

  if (filename) {
    (0, _save.default)(sprites, filename);
  }
}

class ColourPicker {
  constructor(size, target) {
    _defineProperty(this, "transparent", 0xe3);

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
      document.querySelector('#picker-' + i).className = 'c-' + value;
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

const colour = new ColourPicker(8, pickerColour.parentNode);
buttons.on('click', e => {
  const action = e.target.dataset.action;
  const offset = 256 * currentSprite;

  if (action === 'new') {
    newSprite();
  }

  if (action === 'dupe') {
    dupeSprite();
  }

  if (action.startsWith('ro')) {
    const left = action === 'rol';
    const right = action === 'ror';

    if (right && currentSprite == totalSprites - 1 || left && currentSprite === 0) {
      return;
    }

    const copy = sprites.slice(offset, offset + 256);
    const next = (currentSprite + (left ? -1 : 1)) * 256;
    sprites.set(sprites.slice(next, next + 256), offset);
    sprites.set(copy, next);
    currentSprite += left ? -1 : 1;
    renderSpritePreviews();
    renderCurrentSprite();
  }

  if (action === 'del') {
    const copy = Array.from(sprites);
    copy.splice(offset, 256);
    sprites = Uint8Array.from(copy);
    totalSprites--;

    if (currentSprite !== 0) {
      currentSprite--;
    }

    renderSpritePreviews();
    renderCurrentSprite();
  }

  if (action === 'clear') {
    for (let i = offset; i < offset + 256; i++) {
      sprites[i] = colour.transparent;
    }

    renderSpritePreviews();
    renderCurrentSprite();
  }

  if (action === 'download') {
    download();
  }
});
picker.addEventListener('mousedown', e => {
  colour.value = e.target.dataset.value;
});
let down = false;
container.addEventListener('mousedown', () => {
  down = true;
}, true);
container.addEventListener('mouseup', () => {
  down = false;
}, true);
container.addEventListener('mousemove', e => {
  if (down) {
    container.onclick(e);
  }
}, true);

container.onclick = e => {
  if (e.target.className.startsWith('c-')) {
    if (e.altKey || e.ctrlKey) {
      colour.value = e.target.dataset.value;
    } else {
      const target = e.shiftKey ? colour.transparent : colour.value;
      e.target.className = 'c-' + target;
      e.target.dataset.value = target;
      const offset = 256 * currentSprite;
      const x = offset + parseInt(e.target.dataset.index, 10);
      sprites[x] = parseInt(target, 10); // update preview

      const div = document.querySelector(`#sprites .focus`);
      render(new Uint8Array(sprites.slice(currentSprite * 256, currentSprite * 256 + 256)), div);
    }
  }
};

document.body.onkeydown = e => {
  if (e.key >= '1' && e.key <= '8') {
    colour.index = parseInt(e.key, 10) - 1;
    return;
  }

  if (e.key === 'D') {
    download();
    return;
  }

  const current = currentSprite;

  if (e.key === 'ArrowLeft') {
    currentSprite--;
  }

  if (e.key === 'ArrowRight') {
    currentSprite++;
  }

  if (currentSprite === totalSprites) {
    currentSprite = 0;
  } else if (currentSprite < 0) {
    currentSprite = totalSprites - 1;
  }

  if (currentSprite !== current) {
    renderCurrentSprite();
  }
};

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
  } catch (e) {}

  document.querySelector(`#sprites > :nth-child(${currentSprite + 1})`).classList.add('focus');
  const offset = 256 * currentSprite;
  render(new Uint8Array(sprites.slice(offset, offset + 256)));
}

function renderSpritePreviews() {
  spritesContainer.innerHTML = '';
  Array.from({
    length: totalSprites
  }, (_, offset) => {
    const div = document.createElement('div');
    div.className = 'sprite';
    render(new Uint8Array(sprites.slice(offset * 256, offset * 256 + 256)), div);
    div.addEventListener('mousedown', () => {
      currentSprite = offset;
      renderCurrentSprite();
    });
    spritesContainer.appendChild(div);
  });
}

function fileHandler(file) {
  file = (0, _parser.decode)(file);
  totalSprites = file.byteLength / 256;
  currentSprite = 0;
  sprites = file;
  renderSpritePreviews();
  renderCurrentSprite();
}

function render(data, into = container) {
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
  return d;
}

container.onmousemove = e => {
  const value = e.target.dataset.value;

  if (value === undefined) {
    return;
  }

  debug.innerHTML = `${value} 0x${value.toString(16).padStart(2, '0')}`;
};

(0, _dnd.default)(document.documentElement, fileHandler);
upload.addEventListener('change', e => {
  const droppedFile = e.target.files[0];
  const reader = new FileReader();

  reader.onload = event => {
    fileHandler(new Uint8Array(event.target.result));
  };

  reader.readAsArrayBuffer(droppedFile);
});
renderSpritePreviews();
renderCurrentSprite();
render(sprites, picker);
buildStyleSheet();
},{"../lib/dnd.js":"lib/dnd.js","./lib/colour.js":"sprites/lib/colour.js","../lib/save.js":"lib/save.js","./lib/parser.js":"sprites/lib/parser.js","../lib/$.js":"lib/$.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "49267" + '/');

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