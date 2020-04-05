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
},{}],"scr-tools/lib/zx-colour.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalColours = exports.brightColours = exports.normalColoursLookup = exports.brightColoursLookup = void 0;
const brightColoursLookup = new Map();
exports.brightColoursLookup = brightColoursLookup;
brightColoursLookup.set([0, 0, 0].toString(), 0b000);
brightColoursLookup.set([0, 0, 0xff].toString(), 0b001);
brightColoursLookup.set([0xff, 0, 0].toString(), 0b010);
brightColoursLookup.set([0xff, 0, 0xff].toString(), 0b011);
brightColoursLookup.set([0, 0xff, 0].toString(), 0b100);
brightColoursLookup.set([0, 0xff, 0xff].toString(), 0b101);
brightColoursLookup.set([0xff, 0xff, 0].toString(), 0b110);
brightColoursLookup.set([0xff, 0xff, 0xff].toString(), 0b111);
const normalColoursLookup = new Map();
exports.normalColoursLookup = normalColoursLookup;
normalColoursLookup.set([0, 0, 0].toString(), 0b000);
normalColoursLookup.set([0, 0, 0xd7].toString(), 0b001);
normalColoursLookup.set([0xd7, 0, 0].toString(), 0b010);
normalColoursLookup.set([0xd7, 0, 0xd7].toString(), 0b011);
normalColoursLookup.set([0, 0xd7, 0].toString(), 0b100);
normalColoursLookup.set([0, 0xd7, 0xd7].toString(), 0b101);
normalColoursLookup.set([0xd7, 0xd7, 0].toString(), 0b110);
normalColoursLookup.set([0xd7, 0xd7, 0xd7].toString(), 0b111);
const brightColours = {
  0b000: [0, 0, 0],
  0b001: [0, 0, 0xff],
  0b010: [0xff, 0, 0],
  0b011: [0xff, 0, 0xff],
  0b100: [0, 0xff, 0],
  0b101: [0, 0xff, 0xff],
  0b110: [0xff, 0xff, 0],
  0b111: [0xff, 0xff, 0xff]
};
exports.brightColours = brightColours;
const normalColours = {
  0b000: [0, 0, 0],
  0b001: [0, 0, 0xd7],
  0b010: [0xd7, 0, 0],
  0b011: [0xd7, 0, 0xd7],
  0b100: [0, 0xd7, 0],
  0b101: [0, 0xd7, 0xd7],
  0b110: [0xd7, 0xd7, 0],
  0b111: [0xd7, 0xd7, 0xd7]
};
exports.normalColours = normalColours;
},{}],"scr-tools/lib/Zoom.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function getIndexForXY(width, x, y) {
  return width * y + x;
}

let order = 1;

class Zoom {
  constructor(buffer, target = document.body, id) {
    this.target = target;
    this.order = order++;
    this.id = id || `zoom-${this.order}`;

    if (buffer instanceof HTMLImageElement) {
      const img = buffer;
      const canvas = document.createElement('canvas');
      target.appendChild(canvas);
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = buffer = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      img.parentNode.replaceChild(canvas, img);
    }

    if (buffer instanceof CanvasRenderingContext2D) {
      const ctx = this.sourceCtx = buffer;
      this.buffer = buffer.getImageData(0, 0, buffer.canvas.width, buffer.canvas.height).data;
      ctx.canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        ctx.canvas.style.background = `url(${url}) no-repeat`;
        ctx.clearRect(0, 0, buffer.canvas.width, buffer.canvas.height);
      });
    } else {
      this.buffer = buffer instanceof ImageData ? buffer.data : buffer;
    }

    this.isVisible = false;
    this._last = null;
  }

  makeVisible(target = this.target) {
    const canvas = document.createElement('canvas');
    canvas.className = 'zoom';
    canvas.id = this.id;
    target.appendChild(canvas);
    this.ctx = canvas.getContext('2d');
    const scale = 20;
    const w = canvas.width = 8;
    const h = canvas.height = 8;
    canvas.style.imageRendering = 'pixelated';
    canvas.style.width = `${w * scale}px`;
    canvas.style.height = `${h * scale}px`;
    canvas.style.setProperty('--order', this.order);
    this.isVisible = true;
    return this;
  }

  put(imageData) {
    const ctx = this.ctx;
    ctx.putImageData(imageData, 0, 0);
  }

  seeXY(x, y) {
    const key = `${x}x${y}`;
    if (key === this._last) return;
    this._last = key;
    if (!this.isVisible) this.makeVisible();
    const imageData = new ImageData(this.pixel(x, y), 8, 8);
    this.ctx.putImageData(imageData, 0, 0);

    if (this.sourceCtx) {
      const ctx = this.sourceCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.strokeStyle = 'white';
      ctx.strokeRect(x * 8 + 0.5, y * 8 + 0.5, 8, 8);
      ctx.strokeStyle = 'black';
      ctx.strokeRect(x * 8 - 0.5, y * 8 - 0.5, 8, 8);
    }
  }

  pixel(x = 0, y = 0) {
    const sourceWidth = 256;
    const width = 8;
    const height = 8;
    const source = this.buffer;
    const data = new Uint8ClampedArray(width * height * 4);
    const print = false; //x === 31 && y === 23;

    for (let i = 0; i < height; i++) {
      const j = getIndexForXY(sourceWidth, x * 8, y * 8 + i);
      const index = j * 4;
      const end = index + width * 4;
      const offset = i * width * 4;

      if (print) {
        console.log('j: %s, index: %s, end: %s', j, index, end, x * 8, i, source.subarray(index, end));
      }

      data.set(source.slice(index, end), offset);
    }

    return data;
  }

}

exports.default = Zoom;
},{}],"scr-tools/lib/scr.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.load = load;
exports.stream = stream;
exports.pixelsForSCR = pixelsForSCR;
exports.loadBlinkAttributes = loadBlinkAttributes;
exports.default = main;
exports.blink = blink;
exports.readAttributes = readAttributes;
exports.pixelsToBytes = pixelsToBytes;
exports.putPixels = putPixels;
exports.getInkFromPixel = getInkFromPixel;
exports.attributesForBlock = attributesForBlock;
exports.putAttributes = putAttributes;
exports.download = download;

var _zxColour = require("./zx-colour.js");

var _Zoom = _interopRequireDefault(require("./Zoom.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let toBlink = [];
let blinkOn = false;

function block(x = 0, y = 0, buffer, // expected to be 6912 long (2048 * 3 + 768)
attribute = buffer.subarray(2048 * 3)[y * 32 + x]) {
  const start = (y / 8 | 0) * 2048;
  const pixels = buffer.subarray(start, start + 2048); // reminder: paper is binary 0, ink is 1

  const {
    ink,
    paper
  } = readAttributes(attribute);
  const pixel = new Uint8ClampedArray(4 * 8 * 8);
  y = y % 8;

  for (let i = 0; i < 8; i++) {
    const ptr = x + 256 * i + y * 32;
    const byte = pixels[ptr]; // imageData rgba 8x1

    for (let j = 0; j < 8; j++) {
      // determines bit for i, based on MSb as left most pixel
      const colour = (byte & 1 << 7 - j) === 0 ? paper : ink;
      const offset = j * 4 + 4 * 8 * i;
      pixel[offset + 0] = colour[0];
      pixel[offset + 1] = colour[1];
      pixel[offset + 2] = colour[2];
      pixel[offset + 3] = 255;
    }
  }

  return pixel;
}

async function load(url) {
  return new Uint8Array((await (await fetch(url)).arrayBuffer()));
}

async function sleep(ms) {
  // return;
  if (!ms) return;
  return new Promise(resolve => setTimeout(() => resolve(), ms));
}

async function put(ctx, imageData, x, y) {
  ctx.putImageData(imageData, x, y);
  await sleep(0);
}

async function draw(ctx, third, data) {
  const imageData = new Uint8ClampedArray(4 * 8);
  let ctr = 0;

  for (let offset = 0; offset < 8; offset++) {
    for (let line = 0; line < 8; line++) {
      for (let i = 0; i < 32; i++) {
        let j = 0;
        const ptr = ctr++;
        const byte = data[ptr]; // imageData rgba 8x1

        for (; j < 8; j++) {
          // determines bit for i, based on MSb
          const bit = (byte & 1 << 7 - j) === 0 ? 0 : 255;
          const offset = j * 4;
          imageData[offset + 0] = bit;
          imageData[offset + 1] = bit;
          imageData[offset + 2] = bit;
          imageData[offset + 3] = 255; // - bit; // alpha
        }

        const x = i * 8;
        const y = ctx.canvas.height / 3 * third + line * 8 + offset;
        await put(ctx, new ImageData(imageData, 8, 1), x, y);
      }
    }
  }
} // stream individual whole bytes into the canvas


async function stream(ctx, byte, index) {
  const third = index >> 11; // 0..2047, 2048..4095, 4096..6143

  if (third === 3) {
    // colour
    const attribs = readAttributes(byte);
    const x = index % 32 * 8;
    const y = (index >> 5) % 64 * 8;
    const block = ctx.getImageData(x, y, 8, 8);

    for (let i = 0; i < 8 * 8; i++) {
      const type = block.data[i * 4] === 255 ? 'ink' : 'paper';
      block.data.set(attribs[type], i * 4);
    }

    if (attribs.blink && attribs.ink !== attribs.paper) {
      toBlink.push({
        attribute: byte,
        x: x / 8,
        y: y / 8
      });
    }

    await put(ctx, block, x, y);
    return;
  }

  const imageData = new Uint8ClampedArray(4 * 8); // 1x8 pixel array

  for (let j = 7; j >= 0; j--) {
    // determines bit for i, based on MSb
    const bit = (byte & 1 << j) === 0 ? 0 : 255;
    imageData.set([bit, bit, bit, 255], (7 - j) * 4); // place the bits forward
  } // build the line based on the 8bit byte
  // for (let j = 0; j < 8; j++) {
  //   // determines bit for i, based on MSb
  //   const bit = (byte & (1 << (7 - j))) === 0 ? 0 : 255;
  //   imageData.set([bit, bit, bit, 255], j * 4);
  // }


  const x = index % 32;
  const y = (index >> 5) * 8 % 64 + third * 56; // this is the y coord

  const offset = index >> 8; // await

  put(ctx, new ImageData(imageData, 8, 1), x * 8, y + offset);
}

function pixelsForSCR(buffer, ctx) {
  const w = 256;
  const h = 192;
  const pixels = new Uint8ClampedArray(w * h * 4); // 196,608

  for (let y = 0; y < h / 8; y++) {
    for (let x = 0; x < w / 8; x++) {
      const pixel = block(x, y, buffer); // returns 8x8

      ctx.putImageData(new ImageData(pixel, 8, 8), x * 8, y * 8);
    }
  }

  return pixels;
}

function loadBlinkAttributes(buffer, ctx) {
  toBlink = []; // 768

  for (let i = 6144; i <= 6912; i++) {
    const attribute = buffer[i];
    const {
      ink,
      paper,
      blink
    } = readAttributes(attribute);

    if (blink && ink.join('') !== paper.join('')) {
      const x = i % 32;
      const y = (i >> 5) % 64;
      toBlink.push({
        attribute,
        i,
        x,
        y
      });
    }
  }

  let timer = null;
  const blink = {
    start: () => {
      timer = setInterval(() => doBlink(ctx, buffer), 333);
    },
    stop: () => {
      return clearInterval(timer);
    }
  };
  return blink;
}

async function colour(ctx, buffer) {
  const attribs = buffer.subarray(2048 * 3);

  for (let i = 0; i < attribs.length; i++) {
    const attribute = attribs[i];
    const {
      ink,
      paper,
      blink
    } = readAttributes(attribute);
    const x = i % (ctx.canvas.width / 8);
    const y = i / (ctx.canvas.width / 8) | 0;
    const pixel = new ImageData(block(x, y, buffer), 8, 8);

    if (blink && ink.join('') !== paper.join('')) {
      toBlink.push({
        attribute,
        x,
        y
      });
    }

    await put(ctx, pixel, x * 8, y * 8); // replace the whole shebang
  }
}

function doBlink(ctx, buffer) {
  blinkOn = !blinkOn;
  toBlink.forEach(item => {
    const {
      x,
      y
    } = item;
    let attribute = item.attribute;

    if (blinkOn) {
      // swap the paper and ink
      attribute = (attribute & 192) + ( // bright + blink
      (attribute & 7) << 3) + ( // ink moved to paper
      (attribute & 56) >> 3); // paper moved to ink
    }

    const pixel = new ImageData(block(x, y, buffer, attribute), 8, 8);
    put(ctx, pixel, x * 8, y * 8);
  });
}

async function main(url) {
  const buffer = await load(url || './screens/remy.scr');
  const canvas = document.createElement('canvas');
  const log = document.createElement('pre');
  document.body.appendChild(canvas);
  const zoom = new _Zoom.default(buffer);
  document.body.appendChild(log);
  const ctx = canvas.getContext('2d');
  window.ctx = ctx;
  const scale = 2;
  const w = canvas.width = 256;
  const h = canvas.height = 192;
  canvas.style.imageRendering = 'pixelated';
  canvas.style.width = `${w * scale}px`;
  canvas.style.height = `${h * scale}px`;
  ctx.fillStyle = '#ccc';
  ctx.fillRect(0, 0, w, h);
  await draw(ctx, 0, buffer.subarray(0, 2048));
  await draw(ctx, 1, buffer.subarray(2048, 2048 * 2));
  await draw(ctx, 2, buffer.subarray(2048 * 2, 2048 * 3));
  const attribs = buffer.subarray(2048 * 3);
  await colour(ctx, buffer);
  zoom.seeXY(0, 0); // setInterval(() => zoom.seeXY(), 1000);

  canvas.onmousemove = e => {
    const {
      ptr,
      x,
      y,
      byte,
      bright,
      blink,
      ink,
      paper
    } = readFromPoint({
      attribs,
      scale,
      x: e.pageX,
      y: e.pageY
    });
    zoom.seeXY(x / 8, y / 8);
    log.innerHTML = `ptr: ${ptr}
x: ${x} (${x / 8})
y: ${y} (${y / 8})
byte: ${byte}
ink: <span style="color: white; text-shadow: 1px 1px 0 #000; background: rgb(${ink.join(',')})">${(byte & 7).toString(2).padStart(3, '0')}</span>
paper: <span style="color: white; text-shadow: 1px 1px 0 #000; background: rgb(${paper.join(',')})">${((byte & 56) >> 3).toString(2).padStart(3, '0')}</span>
bright: ${bright}
blink: ${blink}
`;
  };

  canvas.onclick = e => {
    const {
      x,
      y,
      ink,
      paper
    } = readFromPoint({
      attribs,
      scale,
      x: e.pageX,
      y: e.pageY
    });
    toBlink.push({
      x,
      y,
      ink,
      paper
    });
  };

  setInterval(() => doBlink(ctx, buffer), 333);
}

function blink(ctx, buffer) {
  return setInterval(() => doBlink(ctx, buffer), 333);
}

function readAttributes(byte) {
  const bright = !!(byte & 64);
  const source = bright ? _zxColour.brightColours : _zxColour.normalColours;
  const values = {
    ink: byte & 7,
    paper: (byte & 56) >> 3
  };
  const ink = source[values.ink]; // 0b00000111

  const paper = source[values.paper]; // 0b00111000

  const blink = !!(byte & 128);
  return {
    values,
    bright,
    ink,
    paper,
    blink
  };
}

function readFromPoint({
  x,
  y,
  scale = 1,
  attribs = []
}) {
  x = (x / scale | 0) / 8 | 0;
  y = (y / scale | 0) / 8 | 0;
  const ptr = y * 32 + x;
  const byte = attribs[ptr];
  const {
    ink,
    paper,
    bright,
    blink
  } = readAttributes(byte);
  return {
    ptr,
    x: x * 8,
    y: y * 8,
    byte,
    ink,
    paper,
    blink,
    bright
  };
}

function getIndexForXY(width, x, y) {
  return width * y + x;
}
/**
 * Converts canvas image data to SCR binary format
 * @param {Number} third 0-2: the thirds of the screen data
 * @param {Uint8Array} arrayBuffer expected to be 3 * 2048 + 768 (empty)
 * @param {Uint8ClampedArray} canvasImageData canvas pixel data (expects to be filled)
 */


function pixelsToBytes(third, arrayBuffer, canvasImageData) {
  const data = arrayBuffer.subarray(third * 2048, (third + 1) * 2048);
  const pixels = canvasImageData.subarray(third * (canvasImageData.length / 3), (third + 1) * (canvasImageData.length / 3));
  let ptr = 0;

  for (let offset = 0; offset < 8; offset++) {
    for (let y = 0; y < 8; y++) {
      const row = y * 8 + offset;

      for (let x = 0; x < 32; x++) {
        let byte = 0;

        for (let j = 0; j < 8; j++) {
          const index = getIndexForXY(256, x * 8 + j, row) * 4;
          byte += (pixels[index] === 0 ? 1 : 0) << 7 - j;
        }

        data[ptr] = byte;
        ptr++;
      }
    }
  }
}
/**
 * Converts canvas image data to SCR binary format
 * @param {Number} third 0-2: the thirds of the screen data
 * @param {Uint8Array} allPixels expected to be 3 * 2048 + 768
 * @param {Uint8ClampedArray} allData canvas pixel data
 */


function putPixels(third, allPixels, allData) {
  const pixels = allPixels.subarray(third * 2048, (third + 1) * 2048);
  const data = allData.subarray(third * (allData.length / 3), (third + 1) * (allData.length / 3));
  let ptr = 0;

  for (let offset = 0; offset < 8; offset++) {
    for (let y = 0; y < 8; y++) {
      const row = y * 8 + offset;

      for (let x = 0; x < 32; x++) {
        let bit = 0;

        for (let j = 0; j < 8; j++) {
          const index = getIndexForXY(256, x * 8 + j, row) * 4;
          bit += (data[index] === 0 ? 1 : 0) << 7 - j;
        }

        pixels[ptr] = bit;
        ptr++;
      }
    }
  }
}

function getInkFromPixel(rgb, shiftBright = false) {
  rgb = `${rgb[0]},${rgb[1]},${rgb[2]}`;

  let ink = _zxColour.brightColoursLookup.get(rgb);

  if (!ink) {
    ink = _zxColour.normalColoursLookup.get(rgb);
    if (shiftBright) ink <<= 3;
  }

  return ink;
}

function attributesForBlock(block, print) {
  let attribute = 0;
  const inks = new Uint8Array((0b111 << 3) + 1).fill(0); // container array

  for (let i = 0; i < block.length / 4; i++) {
    const ink = getInkFromPixel([...block.slice(i * 4, i * 4 + 3)], true);
    inks[ink]++;
  }

  if (print) {
    Object.keys(inks).forEach((ink, count) => inks[count] && console.log('ink %s (%s)', ink, inks[count]));
  }

  let [{
    ink: paper
  }, {
    ink
  } = {
    ink: 0
  }] = Array.from(inks).map((count, ink) => ({
    ink,
    count
  })).filter(({
    count
  }) => count).sort((a, b) => a.count - b.count).slice(-2);

  if (paper === null) {
    paper = ink;
  } // this helps massage the colours into a better position


  if (ink === 7 && paper !== 7) {
    [ink, paper] = [paper, ink];
  } // work out the brightness based on the majority ink


  if (ink >> 3 === 0 || paper >> 3 === 0) {
    // if ink or paper is black, then take the brightness from the other colour
    if (ink === 0 || paper === 0) {
      const colour = ink === 0 ? paper : ink;

      if (colour >>> 3 === 0) {
        // colour is bright
        attribute += 64;
      } else {// not bright
      }
    } else {
      // we're dealing with bright
      if (print) console.log('dealing with bright');

      if (ink >> 3 === 0 && inks[ink] > inks[paper]) {
        if (print) console.log('ink > paper', ink, paper);
        attribute += 64;
      } else if (paper >> 3 === 0 && inks[paper] > inks[ink]) {
        if (print) console.log('paper > ink');
        attribute += 64;
      }
    }
  }

  if (ink >> 3 !== 0) {
    ink = ink >> 3;
  }

  if (paper >> 3 !== 0) {
    paper = paper >> 3;
  }

  attribute += paper << 3;
  attribute += ink;
  return attribute;
}

function putAttributes(pixels, inkData) {
  let ptr = 0;
  const zoom = new _Zoom.default(inkData);

  for (let y = 0; y < 192 / 8; y++) {
    for (let x = 0; x < 256 / 8; x++) {
      const block = zoom.pixel(x, y);
      const print = false; // x === 28 && y === 19;

      pixels[2048 * 3 + ptr] = attributesForBlock(block, print);
      ptr++;
    }
  }
}

function download(data, filename = 'image.png', type = 'image/png') {
  const click = function (node) {
    var event = new MouseEvent('click');
    node.dispatchEvent(event);
  };

  const a = document.createElement('a');
  a.download = filename;
  const blob = new Blob([data], {
    type
  });
  const url = URL.createObjectURL(blob);
  a.href = url;
  click(a);
  URL.revokeObjectURL(url);
}
},{"./zx-colour.js":"scr-tools/lib/zx-colour.js","./Zoom.js":"scr-tools/lib/Zoom.js"}],"lib/$.js":[function(require,module,exports) {
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
},{}],"scr-tools/lib/matrices.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _default = {
  oneDimensional: [{
    x: 1,
    y: 0,
    factor: 1
  }],
  floydSteinberg: [{
    x: 1,
    y: 0,
    factor: 7 / 16
  }, {
    x: -1,
    y: 1,
    factor: 3 / 16
  }, {
    x: 0,
    y: 1,
    factor: 5 / 16
  }, {
    x: 1,
    y: 1,
    factor: 1 / 16
  }],
  jarvisJudiceNinke: [{
    x: 1,
    y: 0,
    factor: 7 / 48
  }, {
    x: 2,
    y: 0,
    factor: 5 / 48
  }, {
    x: -2,
    y: 1,
    factor: 3 / 48
  }, {
    x: -1,
    y: 1,
    factor: 5 / 48
  }, {
    x: 0,
    y: 1,
    factor: 7 / 48
  }, {
    x: 1,
    y: 1,
    factor: 5 / 48
  }, {
    x: 2,
    y: 1,
    factor: 3 / 48
  }, {
    x: -2,
    y: 2,
    factor: 1 / 48
  }, {
    x: -1,
    y: 2,
    factor: 3 / 48
  }, {
    x: 0,
    y: 2,
    factor: 5 / 48
  }, {
    x: 1,
    y: 2,
    factor: 3 / 48
  }, {
    x: 2,
    y: 2,
    factor: 1 / 48
  }],
  stucki: [{
    x: 1,
    y: 0,
    factor: 8 / 42
  }, {
    x: 2,
    y: 0,
    factor: 4 / 42
  }, {
    x: -2,
    y: 1,
    factor: 2 / 42
  }, {
    x: -1,
    y: 1,
    factor: 4 / 42
  }, {
    x: 0,
    y: 1,
    factor: 8 / 42
  }, {
    x: 1,
    y: 1,
    factor: 4 / 42
  }, {
    x: 2,
    y: 1,
    factor: 2 / 42
  }, {
    x: -2,
    y: 2,
    factor: 1 / 42
  }, {
    x: -1,
    y: 2,
    factor: 2 / 42
  }, {
    x: 0,
    y: 2,
    factor: 4 / 42
  }, {
    x: 1,
    y: 2,
    factor: 2 / 42
  }, {
    x: 2,
    y: 2,
    factor: 1 / 42
  }],
  atkinson: [{
    x: 1,
    y: 0,
    factor: 1 / 8
  }, {
    x: 2,
    y: 0,
    factor: 1 / 8
  }, {
    x: -1,
    y: 1,
    factor: 1 / 8
  }, {
    x: 0,
    y: 1,
    factor: 1 / 8
  }, {
    x: 1,
    y: 1,
    factor: 1 / 8
  }, {
    x: 0,
    y: 2,
    factor: 1 / 8
  }],
  burkes: [{
    x: 1,
    y: 0,
    factor: 8 / 32
  }, {
    x: 2,
    y: 0,
    factor: 4 / 32
  }, {
    x: -2,
    y: 1,
    factor: 2 / 32
  }, {
    x: -1,
    y: 1,
    factor: 4 / 32
  }, {
    x: 0,
    y: 1,
    factor: 8 / 32
  }, {
    x: 1,
    y: 1,
    factor: 4 / 32
  }, {
    x: 2,
    y: 1,
    factor: 2 / 32
  }],
  sierra3: [{
    x: 1,
    y: 0,
    factor: 5 / 32
  }, {
    x: 2,
    y: 0,
    factor: 3 / 32
  }, {
    x: -2,
    y: 1,
    factor: 2 / 32
  }, {
    x: -1,
    y: 1,
    factor: 4 / 32
  }, {
    x: 0,
    y: 1,
    factor: 5 / 32
  }, {
    x: 1,
    y: 1,
    factor: 4 / 32
  }, {
    x: 2,
    y: 1,
    factor: 2 / 32
  }, {
    x: -1,
    y: 2,
    factor: 2 / 32
  }, {
    x: 0,
    y: 2,
    factor: 3 / 32
  }, {
    x: 1,
    y: 2,
    factor: 2 / 32
  }],
  sierra2: [{
    x: 1,
    y: 0,
    factor: 4 / 16
  }, {
    x: 2,
    y: 0,
    factor: 3 / 16
  }, {
    x: -2,
    y: 1,
    factor: 1 / 16
  }, {
    x: -1,
    y: 1,
    factor: 2 / 16
  }, {
    x: 0,
    y: 1,
    factor: 3 / 16
  }, {
    x: 1,
    y: 1,
    factor: 2 / 16
  }, {
    x: 2,
    y: 1,
    factor: 1 / 16
  }],
  sierraLite: [{
    x: 1,
    y: 0,
    factor: 2 / 4
  }, {
    x: -1,
    y: 1,
    factor: 1 / 4
  }, {
    x: 0,
    y: 1,
    factor: 1 / 4
  }],
  none: []
};
exports.default = _default;
},{}],"scr-tools/lib/Dither.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _matrices = _interopRequireDefault(require("./matrices.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const colorMap = [[0, 0, 0xff], [0xff, 0, 0], [0xff, 0, 0xff], [0, 0xff, 0], [0, 0xff, 0xff], [0xff, 0xff, 0], [0xff, 0xff, 0xff], [0, 0, 0], [0, 0, 0xd7], [0xd7, 0, 0], [0xd7, 0, 0xd7], [0, 0xd7, 0], [0, 0xd7, 0xd7], [0xd7, 0xd7, 0], [0xd7, 0xd7, 0xd7]];

function getDistance(current, match) {
  const redDifference = current[0] - match[0];
  const greenDifference = current[1] - match[1];
  const blueDifference = current[2] - match[2];
  return redDifference * redDifference + greenDifference * greenDifference + blueDifference * blueDifference;
} // feels expensive, but https://www.cyotek.com/blog/finding-nearest-colors-using-euclidean-distance


function defaultFindColor(rgb) {
  let shortestDistance;
  let index;
  index = -1;
  shortestDistance = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < colorMap.length; i++) {
    const match = colorMap[i];
    const distance = getDistance(rgb, match);

    if (distance < shortestDistance) {
      index = i;
      shortestDistance = distance;
    }
  }

  return [...colorMap[index], 255];
}

const defaults = {
  step: 4,
  channels: 4,
  diffusionFactor: 0.9,
  clip: () => {},
  findColor: defaultFindColor,
  matrix: _matrices.default.floydSteinberg
};

class Dither {
  constructor(options) {
    this.options = { ...defaults,
      ...options
    };
  }

  static get defaultFindColor() {
    return defaultFindColor;
  }

  static get matrices() {
    return _matrices.default;
  }

  dither(buffer, width, settings = {}) {
    let i, k, ref, x, y;
    const options = { ...this.options,
      ...settings
    };
    const d = [];

    for (i = k = 0, ref = buffer.length; 0 <= ref ? k <= ref : k >= ref; i = 0 <= ref ? ++k : --k) {
      d.push(buffer[i]);
    }

    const height = buffer.length / (options.channels * width);
    const result = [];
    y = 0;

    while (y < height) {
      x = 0;

      while (x < width) {
        this.handlePixel(x, y, d, result, width, options);
        x += options.step;
      }

      y += options.step;
    }

    return result;
  }

  calculateIndex(x, y, width, channels) {
    return channels * x + channels * y * width;
  }

  handlePixel(x, y, d, result, width, options) {
    var currentColor, i, j, k, l, newColor, q, ref, ref1;
    i = this.calculateIndex(x, y, width, options.channels);
    currentColor = [];

    for (j = k = 0, ref = options.channels; 0 <= ref ? k < ref : k > ref; j = 0 <= ref ? ++k : --k) {
      currentColor.push(d[i + j]);
    }

    newColor = options.findColor(currentColor);
    q = [];

    for (j = l = 0, ref1 = options.channels; 0 <= ref1 ? l < ref1 : l > ref1; j = 0 <= ref1 ? ++l : --l) {
      q[j] = (d[i + j] - newColor[j]) * options.diffusionFactor;
    }

    this.diffuseError(d, q, x, y, width, options);
    return this.applyNewColor(result, width, newColor, i, options);
  }

  diffuseError(d, q, x, y, width, options) {
    var channelOffset, entry, index, k, l, len, ref, ref1, results;
    ref = options.matrix;
    results = [];

    for (k = 0, len = ref.length; k < len; k++) {
      entry = ref[k];
      index = this.calculateIndex(x + options.step * entry.x, y + options.step * entry.y, width, options.channels);

      for (channelOffset = l = 0, ref1 = options.channels; 0 <= ref1 ? l < ref1 : l > ref1; channelOffset = 0 <= ref1 ? ++l : --l) {
        d[index + channelOffset] += entry.factor * q[channelOffset];
      }

      results.push(options.clip(d, index));
    }

    return results;
  }

  applyNewColor(buffer, width, newColor, i, options) {
    var di, dx, dy, j, k, ref, results;
    results = [];

    for (dx = k = 0, ref = options.step; 0 <= ref ? k < ref : k > ref; dx = 0 <= ref ? ++k : --k) {
      results.push(function () {
        var l, ref1, results1;
        results1 = [];

        for (dy = l = 0, ref1 = options.step; 0 <= ref1 ? l < ref1 : l > ref1; dy = 0 <= ref1 ? ++l : --l) {
          di = i + options.channels * dx + options.channels * width * dy;
          results1.push(function () {
            var m, ref2, results2;
            results2 = [];

            for (j = m = 0, ref2 = options.channels; 0 <= ref2 ? m < ref2 : m > ref2; j = 0 <= ref2 ? ++m : --m) {
              results2.push(buffer[di + j] = newColor[j]);
            }

            return results2;
          }());
        }

        return results1;
      }());
    }

    return results;
  }

}

exports.default = Dither;
},{"./matrices.js":"scr-tools/lib/matrices.js"}],"scr-tools/lib/image.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = main;
exports.contrast = contrast;
exports.threshold = threshold;
exports.invertPotentialInk = invertPotentialInk;
exports.imageToCanvas = imageToCanvas;
exports.imageToPixels = imageToPixels;
exports.imageToBlob = imageToBlob;
exports.fileToBinary = fileToBinary;

var _Zoom = _interopRequireDefault(require("./Zoom.js"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function main(image) {
  return imageToBlob(image).then(fileToBinary);
}

function contrast(imageData, contrast = 50) {
  const data = imageData.data;
  contrast = contrast / 100 + 1; //convert to decimal & shift range: [0..2]

  const intercept = 128 * (1 - contrast);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * contrast + intercept;
    data[i + 1] = data[i + 1] * contrast + intercept;
    data[i + 2] = data[i + 2] * contrast + intercept;
  }

  return imageData;
}

function threshold(data, _, threshold = _) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const test = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const v = test >= threshold ? 255 : 0;
    data[i] = data[i + 1] = data[i + 2] = v;
  }

  invertPotentialInk(data);
  return data;
}

function invertPotentialInk(imageData) {
  const zoom = new _Zoom.default(imageData);

  for (let y = 0; y < 192 / 8; y++) {
    for (let x = 0; x < 256 / 8; x++) {
      const block = zoom.pixel(x, y);
      let inkCount = 0;

      for (let i = 0; i < 8 * 8 * 4; i += 4) {
        if (block[i] === 0) {
          // black = ink
          inkCount = inkCount + 1;
        }
      }

      if (inkCount < 32) {
        // flip
        for (let i = 0; i < 8 * 8 * 4; i += 4) {
          const c = block[i] === 0 ? 255 : 0;
          block[i] = block[i + 1] = block[i + 2] = c;
        }
      }
    }
  }

  return imageData;
}

function crop(source = {
  width: 0,
  height: 0
}, destination = {
  width: 0,
  height: 0
}) {
  // result:
  let x = 0;
  let y = 0; // which is longest side

  let longest = 'width';
  let shortest = 'height';

  if (destination.width < destination.height) {
    [longest, shortest] = [shortest, longest];
  } // get divisor


  const d = source[longest] / destination[longest]; // FIXME does this work for scaling up?

  const width = destination.width * d | 0;
  const height = destination.height * d | 0;

  if (longest === 'height') {
    x = (source[shortest] - width) / 2;
  } else {
    y = (source[shortest] - height) / 2;
  }

  return {
    x,
    y,
    width,
    height
  };
}

function imageToCanvas(img, scale = {
  width: img.width,
  height: img.height
}) {
  const canvas = document.createElement('canvas');
  canvas.style.imageRendering = 'pixelated';
  const ctx = canvas.getContext('2d');
  canvas.width = scale.width;
  canvas.height = scale.height;
  const {
    x,
    y,
    height,
    width
  } = crop(img, canvas);
  ctx.drawImage(img, x, y, width, height, 0, 0, canvas.width, canvas.height);
  return ctx;
}

function imageToPixels(img, scale) {
  const ctx = imageToCanvas(img, scale);
  return ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
}

async function imageToBlob(img, ctx = imageToCanvas(img)) {
  return new Promise(resolve => {
    const canvas = ctx.canvas;
    canvas.toBlob(file => resolve(file));
  });
}

function fileToBinary(file) {
  return new Promise(resolve => {
    const reader = new window.FileReader();

    reader.onloadend = () => resolve(new Uint8Array(reader.result));

    reader.readAsArrayBuffer(file);
  });
}
},{"./Zoom.js":"scr-tools/lib/Zoom.js"}],"scr-tools/lib/retrofy.js":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.dither = dither;
exports.default = main;

var _Dither = _interopRequireDefault(require("./Dither.js"));

var _Zoom = _interopRequireDefault(require("./Zoom.js"));

var _image = require("./image.js");

var _scr = require("./scr.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function dither({
  url,
  all = false,
  debug = false
}) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  if (debug) document.body.appendChild(img);
  const ctx = (0, _image.imageToCanvas)(img, {
    width: 256,
    height: 192
  });
  const canvas = ctx.canvas;
  const w = canvas.width;
  const h = canvas.height;
  if (debug) document.body.appendChild(canvas); // the buffer is used to draw into as a temp space

  const bufferCtx = document.createElement('canvas').getContext('2d');
  bufferCtx.canvas.width = w;
  bufferCtx.canvas.height = h;
  if (debug) document.body.appendChild(bufferCtx.canvas);
  const dither = new _Dither.default({
    matrix: _Dither.default.matrices.none,
    step: 1
  });
  const {
    imageData: inkData
  } = await render(ctx, bufferCtx, dither, {
    diffusionFactor: 0.1,
    matrix: _Dither.default.matrices.atkinson
  });
  const {
    imageData: pixelData
  } = await renderFromInk(bufferCtx, bufferCtx); // load all the final output into SCR format - starting with binary for pixels

  const pixels = new Uint8Array(256 * 192 / 8 + 768);
  (0, _scr.putPixels)(0, pixels, pixelData.data);
  (0, _scr.putPixels)(1, pixels, pixelData.data);
  (0, _scr.putPixels)(2, pixels, pixelData.data); // …then try to work out the attributes (bright, ink and paper)

  (0, _scr.putAttributes)(pixels, inkData);

  if (all) {
    return {
      pixels,
      inkData,
      pixelData,
      originalData: ctx.getImageData(0, 0, w, h)
    };
  }

  return pixels; // this is the raw binary .src format
}

async function pixelsToImage(pixels) {
  const ctx = document.createElement('canvas').getContext('2d');
  const canvas = ctx.canvas;
  canvas.width = 256;
  canvas.height = 192;
  ctx.putImageData(pixels, 0, 0);
  const url = canvas.toDataURL('image/png');
  const img = new Image();
  img.src = url;
  return new Promise(resolve => img.onload = () => resolve(img));
}

async function main(url = `https://twivatar.glitch.me/${prompt('Give me a twitter handle:')}`) {
  // export default async function main(url = './image-manip/tap-js.png') {
  // const username = prompt('Give me a twitter handle:');
  // ctx = drawing context with our source image
  const {
    pixels,
    inkData,
    pixelData,
    originalData
  } = await dither( // `https://twivatar.glitch.me/${username}`,
  url, true);
  const scrBlob = new Blob([pixels], {
    'content-type': 'application/binary'
  });
  const scrURL = URL.createObjectURL(scrBlob);
  const container = document.createElement('div');
  document.body.appendChild(container);
  const scrCtx = document.createElement('canvas').getContext('2d');
  scrCtx.canvas.width = 256;
  scrCtx.canvas.height = 192;
  container.appendChild(scrCtx.canvas); // validate our pixels by translating the SCR binary back into a canvas

  (0, _scr.pixelsForSCR)(pixels, scrCtx);
  const ul = document.createElement('ul');
  ul.innerHTML = `<li><a href="${scrURL}" download="image.scr">Download .SCR file</a></li>`;
  const li = document.createElement('li');
  ul.appendChild(li);
  const attribsLI = document.createElement('li');
  ul.appendChild(attribsLI);
  document.body.appendChild(ul); // put all the image data into imgs

  const img2 = await pixelsToImage(originalData);
  container.appendChild(img2);
  const inkImg = await pixelsToImage(inkData);
  container.appendChild(inkImg);
  const pixelImg = await pixelsToImage(pixelData);
  container.appendChild(pixelImg);
  const zoomOriginal = new _Zoom.default(img2);
  const zoomPixel = new _Zoom.default(pixelImg);
  const zoomInk = new _Zoom.default(inkImg);
  const zoomResult = new _Zoom.default(scrCtx);
  const rootCanvas = document.querySelector('canvas');
  rootCanvas.classList.add('crosshair');
  let hover = true;

  rootCanvas.onclick = () => {
    hover = !hover;
  };

  rootCanvas.onmousemove = e => {
    if (!hover) return;
    const x = e.pageX / 8 | 0;
    const y = e.pageY / 8 | 0;
    zoomResult.seeXY(x, y);
    zoomOriginal.seeXY(x, y);
    zoomInk.seeXY(x, y);
    zoomPixel.seeXY(x, y);
    li.innerHTML = `{ x: ${x}, y: ${y} }`;
    const block = zoomInk.pixel(x, y);
    const byte = (0, _scr.attributesForBlock)(block);
    window.attributesForBlock = _scr.attributesForBlock.bind(null, block);
    const debug = y === 18 && x === 20;
    const attribs = (0, _scr.readAttributes)(byte, debug);
    const ink = attribs.ink.join(',');
    const paper = attribs.paper.join(',');
    attribsLI.innerHTML = `ink: ${ink} (${attribs.values.ink}) <span class="block" style="background: rgb(${ink})"></span>, paper: ${paper} (${attribs.values.paper}) <span class="block" style="background: rgb(${paper})"></span>`;
  };
}

async function render(ctx, bufferCtx, dither, options = {}) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const buffer = (0, _image.contrast)(ctx.getImageData(0, 0, w, h), 10);
  const res = dither.dither(buffer.data, w, options);
  const imageData = new ImageData(new Uint8ClampedArray(res), w, h);
  bufferCtx.putImageData(imageData, 0, 0);
  return {
    imageData
  };
}

function putInkForBlock(zoom, x, y, newBlock = new Uint8ClampedArray(8 * 8 * 4)) {
  const block = zoom.pixel(x, y); // 1: find how many colours we're dealing with (256 elements)
  // 2: if 2 - switch them to majority paper (0b0) and least ink (0b1)
  // 3: if more than two, order then select

  const print = x === 3 && y === 1;
  const byte = (0, _scr.attributesForBlock)(block, print);
  const attributes = (0, _scr.readAttributes)(byte);
  if (print) console.log(attributes);

  for (let i = 0; i < 64; i++) {
    const ink = (0, _scr.getInkFromPixel)([...block.slice(i * 4, i * 4 + 3)]);

    if (ink === attributes.values.ink) {
      newBlock.set([0, 0, 0, 255], i * 4);
    } else if (ink === attributes.values.paper) {
      newBlock.set([255, 255, 255, 255], i * 4);
    } else {
      newBlock.set([0, 0, 0, 255], i * 4);
    }
  }

  return newBlock;
}

async function renderFromInk(ctx, bufferCtx) {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const buffer = ctx.getImageData(0, 0, w, h);
  const zoom = new _Zoom.default(buffer.data);
  const blockBuffer = new Uint8ClampedArray(8 * 8 * 4);

  for (let y = 0; y < 192 / 8; y++) {
    for (let x = 0; x < 256 / 8; x++) {
      putInkForBlock(zoom, x, y, blockBuffer);
      bufferCtx.putImageData(new ImageData(blockBuffer, 8, 8), x * 8, y * 8);
    }
  }

  const imageData = bufferCtx.getImageData(0, 0, w, h);
  return {
    imageData
  };
}

if (window.location.search.includes('retrofy')) main();
},{"./Dither.js":"scr-tools/lib/Dither.js","./Zoom.js":"scr-tools/lib/Zoom.js","./image.js":"scr-tools/lib/image.js","./scr.js":"scr-tools/lib/scr.js"}],"scr-tools/index.js":[function(require,module,exports) {
"use strict";

var _dnd = _interopRequireDefault(require("../lib/dnd.js"));

var _scr = require("./lib/scr.js");

var _$ = require("../lib/$.js");

var _save = _interopRequireDefault(require("../lib/save.js"));

var _retrofy = require("./lib/retrofy.js");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const result = (0, _$.$)('#result')[0];

function basename(filename) {
  return filename.split('.').slice(0, -1).join('.');
}

function container(filename, altDownload) {
  const isSCR = filename.toUpperCase().endsWith('.SCR');
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const div = document.createElement('div');
  div.className = 'container';
  div.appendChild(canvas);
  const button = document.createElement('button');
  div.appendChild(button);

  button.onclick = async () => {
    const file = await new Promise(resolve => canvas.toBlob(resolve));
    (0, _save.default)(file, basename(filename) + '.png');
  };

  button.innerText = 'Download PNG';

  if (!isSCR) {
    const button = document.createElement('button');
    div.appendChild(button);

    button.onclick = async () => {
      (0, _save.default)(altDownload, basename(filename) + '.scr');
    };

    button.innerText = 'Download SCR';
  }

  result.prepend(div);
  return ctx;
}

async function fileHandler(data, filename, type) {
  if (filename.toUpperCase().endsWith('.SCR')) {
    (0, _scr.pixelsForSCR)(data, container(filename));
  } else {
    const blob = new Blob([data], {
      type
    });
    const url = URL.createObjectURL(blob);
    const res = await (0, _retrofy.dither)({
      url
    });
    console.log(res);
    (0, _scr.pixelsForSCR)(res, container(filename, res));
    URL.revokeObjectURL(url);
  }
}

(0, _dnd.default)(document.body, fileHandler);
(0, _$.$)('input').on('change', event => {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = event => fileHandler(new Uint8Array(event.target.result), file.name, file.type);

  reader.readAsArrayBuffer(file);
});
},{"../lib/dnd.js":"lib/dnd.js","./lib/scr.js":"scr-tools/lib/scr.js","../lib/$.js":"lib/$.js","../lib/save.js":"lib/save.js","./lib/retrofy.js":"scr-tools/lib/retrofy.js"}],"../node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
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
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "51499" + '/');

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
},{}]},{},["../node_modules/parcel-bundler/src/builtins/hmr-runtime.js","scr-tools/index.js"], null)
//# sourceMappingURL=/scr-tools.628f49dc.js.map