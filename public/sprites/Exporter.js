import Bind from '../lib/bind';
import { $ } from '../lib/$';
import palette from './Palette';
import Hooks from '../lib/Hooks.js';
import BmpEncoder from '../lib/bmpEncoder';

/**
 * @typedef { import("./Sprite").default } Sprite
 * @typedef { import("./SpriteSheet").default } SpriteSheet
 * @typedef { import("./TileMap").default } TileMap
 */

/**
 * @param {Uint8Array} source
 * @param {object} options
 * @param {number} options.bytesPerLine
 * @param {string} options.format
 * @param {string} options.prefix
 * @param {string} options.dist
 * @param {string} options.spaceAround
 * @param {string} options.pad
 * @param {string} options.size
 * @param {boolean} options.group
 * @param {number} options.groupLines
 * @param {string} options.groupPrefix
 * @returns {string[]}
 */
function bytesToLines(
  source,
  {
    bytesPerLine,
    format,
    prefix,
    dist,
    spaceAround,
    pad,
    size,
    group,
    groupPrefix,
    groupLines,
  }
) {
  const asm = dist === 'asm';
  let lines = [];
  const join = spaceAround === 'yes' ? ', ' : ',';
  pad = pad === 'yes';
  const padSize = size === 'byte' ? 2 : 4;
  const bytes = source.reduce((acc, curr, i) => {
    const index = (i / bytesPerLine) | 0;

    if (!acc[index]) acc[index] = [];

    let byte = curr;
    if (format !== 'dec') {
      byte = byte.toString(16);
      if (pad) {
        byte = byte.padStart(padSize, '0');
      }
      if (format === '0x') {
        byte = '0x' + byte;
      }
      if (format === '$') {
        byte = '$' + byte;
      }
      if (format === 'h') {
        byte = byte + 'h';
      }
    }

    acc[index].push(byte);

    return acc;
  }, []);

  for (let j = 0; j < bytes.length; j++) {
    lines.push(`${asm ? '\t' : ''}${prefix} ${bytes[j].join(join)}`);
  }

  if (group) {
    let ctr = 0;
    lines = lines.reduce((acc, curr, i) => {
      if (i % groupLines === 0) {
        if (i !== 0) {
          acc.push('');
        }
        acc.push(`${groupPrefix}${ctr++}${asm ? ':' : ''}`);
      }

      acc.push(curr);

      return acc;
    }, []);
  }

  return lines;
}

const rangeBind = (type, { min = 0, max = 63, callback = () => {} } = {}) => {
  return new Bind(
    {
      min,
      max,
    },
    {
      min: { dom: `#export-${type}-range-start`, callback },
      max: { dom: `#export-${type}-range-end`, callback },
    }
  );
};

export default class Exporter extends Hooks {
  constructor() {
    super();
    const callback = () => this.update();
    this.sRange = rangeBind('sprite', { callback, max: 63 });
    this.pRange = rangeBind('palette', {
      max: 255,
      callback,
    });

    this.settings = new Bind(
      {
        bytesPerLine: 16,
        prefix: 'db',
        format: '$',
        selection: ['sprites'],
        dist: 'asm',
        spaceAround: 'yes',
        pad: 'no',
        paletteBits: 9,
        size: 'byte',
        sprite8x8: false,
        group: false,
        groupLines: 4,
        groupPrefix: '',
      },
      {
        dist: {
          dom: '#export input[name="export-destination"]',
          callback(value) {
            if (value === 'basic') {
              this.prefix = 'DATA';
              this.format = 'dec';
            }
            if (value === 'asm') {
              if (this.size === 'byte') {
                this.prefix = 'db';
              } else {
                this.prefix = 'dbw';
              }
              this.format = '$';
            }
          },
        },
        size: {
          dom: '#export input[name="export-byte-size"], #export .export-value-size',
          callback(size) {
            if (this.dist === 'asm') {
              if (size === 'byte') {
                this.prefix = 'db';
              } else {
                this.prefix = 'dbw';
              }
            }
            callback();
          },
        },
        sprite8x8: {
          dom: '#tile-size',
          callback(value) {
            $('#export-sprite-range-end').max = value ? 255 : 63;
            return callback(value);
          },
        },
        bytesPerLine: { dom: '#export-sprite-asm-bytes', callback },
        prefix: { dom: '#export-sprite-asm-prefix', callback },
        format: { dom: '#export-sprite-asm-byte-type', callback },
        selection: { dom: '#export input[name="export-section"]', callback },
        spaceAround: { dom: '#export input[name="export-spaces"]', callback },
        pad: { dom: '#export input[name="export-pad"]', callback },
        paletteBits: {
          dom: '#export input[name="export-palette-format"]',
          callback,
        },
        group: {
          dom: '#export input[name="export-grouping"]',
          callback,
        },
        groupLines: {
          dom: '#export input[name="export-grouping-lines"]',
          callback,
        },
        groupPrefix: {
          dom: '#export input[name="export-grouping-prefix"]',
          callback,
        },
      }
    );

    this.output = $('#export-output');
  }

  /**
   * Serialises the palette for local storage
   *
   * @returns {object}
   */
  serialize() {
    return {
      settings: this.settings.__export(),
      ranges: {
        sprites: this.sRange.__export(),
        palette: this.pRange.__export(),
      },
    };
  }

  restore({ settings, ranges }) {
    Object.entries(settings).forEach(([key, value]) => {
      this.settings[key] = value;
    });
    this.pRange.min = ranges.palette.min;
    this.pRange.max = ranges.palette.max;
    this.sRange.min = ranges.sprites.min;
    this.sRange.max = ranges.sprites.max;

    this.update();
  }

  set sprites(sprites) {
    this._sprites = sprites;
    this.update();
  }

  /**
   * @returns {Sprite[]} sprites
   */
  get sprites() {
    if (!this._sprites) return [];
    let { min, max } = this.sRange;
    max = max + 1;
    const sprites = this._sprites.sprites.slice(min, max);
    return sprites;
  }

  set tiles(tiles) {
    this._tiles = tiles;
    this.update();
  }

  /**
   * @returns {boolean}
   */
  get fourBit() {
    return this._sprites.fourBit;
  }

  /**
   * @returns {TileMap}
   */
  get tiles() {
    return this._tiles;
  }

  spritesToCanvas(spriteWidth = 64) {
    let { min, max } = this.sRange;
    const sprite8x8 = this.settings.sprite8x8 ? 8 : 16;

    max = max + 1;
    const size = max - min;
    const sprites = this.sprites;
    const ctx = document.createElement('canvas').getContext('2d');
    let width = sprite8x8 * size;
    let height = sprite8x8;

    if (size > spriteWidth) {
      width = sprite8x8 * spriteWidth;
      height = sprite8x8 * ((size / spriteWidth) | 0);
    }

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    sprites.forEach((sprite, i) => {
      if (sprite8x8 === 8) {
        for (let j = 0; j < 4; j++) {
          const k = i * 2;
          let x = (k % spriteWidth) * sprite8x8;
          let y = (((k * 2) / spriteWidth) | 0) * sprite8x8;

          x = x + (j % 2) * sprite8x8;
          y = y + ((j / 2) | 0) * sprite8x8;

          const opts = {
            x,
            y,
            scale: 8,
            ctx,
            subSprite: j,
            skipClear: true,
            fourBit: this.fourBit,
          };

          sprite.render(opts);
        }
      } else {
        const x = (i % spriteWidth) * sprite8x8;
        const y = ((i / spriteWidth) | 0) * sprite8x8;

        sprite.render({
          x,
          y,
          scale: 16,
          skipClear: true,
          ctx,
        });
      }
    });

    return ctx;
  }

  bmp(spriteWidth) {
    const ctx = this.spritesToCanvas(spriteWidth);
    const { width, height } = ctx.canvas;

    const imageData = ctx.getImageData(0, 0, width, height);
    const bmp = new BmpEncoder({
      data: new Uint8Array(imageData.data.buffer),
      width,
      height,
    });
    return bmp.encode();
  }

  spr() {
    let { min, max } = this.sRange;
    max = max + 1;
    const mul = this._sprites.fourBit ? 128 : 256;
    const data = this._sprites.getData();
    return data.slice(min * mul, max * mul);
  }

  png(spriteWidth) {
    const ctx = this.spritesToCanvas(spriteWidth);

    return new Promise((resolve) => {
      ctx.canvas.toBlob(resolve);
    });
  }

  piskel() {
    const frameCount = this.sprites.length;
    const layout = Array.from({ length: frameCount }, (_, i) => [i]);
    const ctx = this.spritesToCanvas();
    const base64PNG = ctx.canvas.toDataURL('image/png');

    const layer = {
      name: 'Layer 1',
      opacity: 1,
      frameCount,
      chunks: [{ layout, base64PNG }],
    };
    const template = {
      modelVersion: 2,
      piskel: {
        name: 'New Piskel',
        description: '',
        fps: 12,
        height: 16,
        width: 16,
        layers: [JSON.stringify(layer)],
        hiddenFrames: [],
      },
    };

    return JSON.stringify(template);
  }

  update(force = false) {
    this.trigger('update', force);

    // bit of a hack, but worthwhile
    if (force === false && !window.location.hash.includes('export')) return;
    if (!this.settings) {
      return; // not ready yet
    }

    const lines = [];
    const { selection, dist, paletteBits, size } = this.settings;
    const asm = dist === 'asm';

    if (this.binaryFile) {
      let data = null;
      if (size === 'byte') {
        data = this.binaryFile;
      } else {
        data = new Uint16Array(new DataView(this.binaryFile.buffer).buffer);
      }

      lines.push(...bytesToLines(data, { ...this.settings }));
      lines.push('');
      this.output.value = lines.join('\n');
      return;
    }

    if (selection.includes('sprites')) {
      if (!this.sprites) {
        console.log('no sprites');

        return;
      }

      let { min, max } = this.sRange;
      max = max + 1;
      /** @type {Sprite[]} */
      const sprites = this.sprites;

      if (asm) {
        lines.push(`sprite_count EQU ${max - min}`);
      } else {
        lines.push(`#autoline 10,10`);
        lines.push(`REM sprite count: ${max - min}`);
      }

      if (this.settings.sprite8x8) {
        const width = this.fourBit ? 32 : 64;
        for (let i = min; i < max; i++) {
          lines.push(`sprite${i}:`);
          ``;
          const sprite = sprites[(i / 4) | 0];
          const offset = (i % 4) * width;
          // console.log('slice', i, i % 4, width, sprite.getData(this.fourBit));
          let data = sprite.getData(this.fourBit).slice(offset, offset + width);

          if (size !== 'byte') {
            data = new Uint16Array(new DataView(data.buffer).buffer);
          }
          lines.push(...bytesToLines(data, { ...this.settings }));
          lines.push('');
        }
      } else {
        for (let i = 0; i < sprites.length; i++) {
          if (asm) {
            // lines.push(`sprite${min + i}_index=${min + i}`);
            lines.push(`sprite${min + i}:`);
          } else {
            lines.push(`REM sprite ${min + i}`);
          }

          let data;
          if (size === 'byte') {
            data = sprites[i].getData(this.fourBit);
          } else {
            const pixels = new Uint8Array(sprites[i].getData(this.fourBit));
            data = new Uint16Array(new DataView(pixels.buffer).buffer);
          }

          lines.push(...bytesToLines(data, { ...this.settings }));
          lines.push('');
        }
      }
    }

    if (selection.includes('tiles')) {
      const tiles = this.tiles;
      if (asm) {
        lines.push(`tile_width EQU ${tiles.width}`);
        lines.push(`tile_height EQU ${tiles.height}`);
        lines.push(`tiles:`);
      } else {
        lines.push(`#autoline 10,10`);
        lines.push(
          `REM tiles ${tiles.width}x${tiles.height} @ ${tiles.size}px`
        );
      }

      let data;
      if (size === 'byte') {
        data = tiles.bank;
      } else {
        data = new Uint16Array(new DataView(tiles.bank.buffer).buffer);
      }

      lines.push(
        ...bytesToLines(data, { ...this.settings, bytesPerLine: tiles.width })
      );
      lines.push('');
    }

    if (selection.includes('palette')) {
      let { min, max } = this.pRange;
      max++;
      if (asm) {
        lines.push(`palette_count EQU ${max - min}`);
        lines.push(`palette:`);
      } else {
        lines.push(`#autoline 10,10`);
        lines.push(`REM palette count: ${max - min}`);
      }

      let bytes;
      const pData = palette.export().slice(min * 2, max * 2);
      if (paletteBits === 9) {
        bytes = pData;
      } else {
        bytes = new Uint8Array(max - min);
        for (let i = 0; i < pData.length; i += 2) {
          bytes[i / 2] = pData[i];
        }
      }

      if (size === 'word') {
        bytes = new Uint16Array(new DataView(bytes.buffer).buffer);
      }

      lines.push(...bytesToLines(bytes, { ...this.settings }));
      lines.push('');
    }

    this.output.value = lines.join('\n');
  }
}
