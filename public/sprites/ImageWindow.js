import nearestColour from 'nearest-color';
import { $ } from '../lib/$.js';
import { emptyCanvas, getCoords } from './sprite-tools.js';
import trackDown from '../lib/track-down.js';
import { next512FromRGB, rgbToHex } from './lib/colour.js';
import palette, { sorter } from './Palette.js';
import Bind from '../lib/bind.js';

const transparent = palette.transparency[1];

/**
 * @class
 */
export default class ImageWindow {
  zoomFactor = 0;
  x = 0;
  y = 0;

  constructor(data, ctx, { width, height, original, fileData }) {
    this.fileData = fileData;

    this.ctx = ctx;
    this.__ctx = document.createElement('canvas').getContext('2d');
    this.__ctx.canvas.width = width;
    this.__ctx.canvas.height = height;

    this.pixels = original; // original imageData

    this.parent = ctx.canvas.parentNode;
    this.status = $('#png-status');

    this.controls = {
      w: $('#repeat-width'),
      h: $('#repeat-height'),
    };

    this.dimensions = 16;
    this.useMagenta = false;

    new Bind(
      { dimensions: this.dimensions, magenta: false },
      {
        magenta: {
          dom: '#transparent-magenta',
          callback: (v) => (this.useMagenta = v),
        },
        dimensions: {
          dom: '#import-dims',
          callback: (value) => (this.dimensions = value),
        },
      }
    );

    trackDown(ctx.canvas, {
      start: (e) => this.start(e),
      handler: (e) => this.pan(e),
      end: (e) => this.end(e),
    });

    this.render(this.__ctx);
    // this.zoom = 0;
    this.zoom = 2;
    this.y = this.x = 56;

    this.paint();
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

  /**
   * @param {number} size
   */
  set dimensions(size) {
    this._dimensions = size;
    this.parent.dataset.dimensions = size;
    this.paint();
  }

  get dimensions() {
    return this._dimensions;
  }

  get pxScale() {
    if (this.zoomFactor >= 3) {
      return 1;
    }
    return 16 / (this.zoomFactor + 1) / 2;
  }

  get zoomDelta() {
    return (0xff >> (this.zoomFactor + 3)) << 3;
  }

  coords(x = this.x, y = this.y, abs = true) {
    let delta = this.zoomDelta;

    if (abs) {
      return {
        x: Math.abs(x - delta),
        y: Math.abs(y - delta),
      };
    } else {
      const adjust = {
        8: -4,
        16: 0,
        32: 8,
        64: 24,
      };

      delta = delta - adjust[this.dimensions];
      return {
        x: (x - delta) * -1,
        y: (y - delta) * -1,
      };
    }
  }

  start(event) {
    const coords = getCoords(event, this.pxScale);
    this.parent.dataset.dragging = true;
    this._coords = {
      x: coords.x,
      y: coords.y,
      curX: this.x,
      curY: this.y,
    };
  }

  end(event) {
    this.parent.dataset.dragging = false;
    const scale = this.pxScale;
    const coords = getCoords(event, scale);
    this.x = (this._coords.curX + (coords.x - this._coords.x) * scale) | 0;
    this.y = (this._coords.curY + (coords.y - this._coords.y) * scale) | 0;

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
    const coords = getCoords(event, scale);
    const x = this.x + (coords.x - this._coords.x) * scale;
    const y = this.y + (coords.y - this._coords.y) * scale;
    this.paint(x | 0, y | 0);
  }

  /**
   * Prompts for entire image or selection and updates the palette selection
   * with values from the imported image
   *
   * @param {boolean} fourBit
   */
  importPalette(fourBit = false) {
    const fromSelection = !confirm(
      'Import source indexed palette or selection?\n\nOK = entire source palette\nCancel = selection'
    );

    const dim = this.dimensions;
    const ctx = this.__ctx;

    let { x, y } = this.coords();

    let paletteIndex = null;
    let imageData;
    let length;
    let palArray;

    // read all the pixels and load into a palette
    const pal = new Set();
    if (fromSelection) {
      const width = parseInt(this.controls.w.value, 10);
      const height = parseInt(this.controls.h.value, 10);

      imageData = ctx.getImageData(x, y, dim * width, dim * height);
      length = dim * dim;
    } else {
      try {
        palArray = Array.from(palette.importBinary(this.fileData));
        palArray.forEach((value, index) => {
          palette.set(paletteIndex * 16 + index, value);
        });
        palette.updateTable();

        return;
      } catch (e) {
        console.log('indexed import failed: ' + e.message);

        imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        length = ctx.canvas.width * ctx.canvas.height;
      }
    }

    for (let i = 0; i < length; i++) {
      let j = i;
      const [r, g, b, a] = imageData.data.slice(j * 4, j * 4 + 4);
      const index = next512FromRGB({ r, g, b });
      if (a === 0) {
        pal.add(transparent);
      } else if (index === 0x1c6 || index === 0x1c7) {
        if (this.useMagenta) {
          pal.add(transparent);
        } else {
          pal.add(463);
        }
      } else {
        pal.add(index);
      }
    }

    palArray = Array.from(pal);

    if (fourBit) {
      if (palArray.length < 16) {
        palArray.push(...Array.from({ length: 16 - palArray.length }, () => 0));
      }

      palArray.sort(sorter);

      paletteIndex = palette.find4BitIndex(palArray);

      if (paletteIndex === null) {
        if (pal.size > 16) {
          alert(
            `The selected region has ${pal.size} colours (of a max 16 colours) - exiting`
          );
          return;
        }

        // now add the index
        while (
          paletteIndex === null ||
          !(paletteIndex >= 0 && paletteIndex <= 15)
        ) {
          paletteIndex = prompt(
            'Matching palette could not be found, where would you\nlike to insert the new 16 colour palette?\n\n0-15'
          );

          if (paletteIndex === null) return;
          paletteIndex = parseInt(paletteIndex, 10);

          palArray.forEach((value, index) => {
            palette.set(paletteIndex * 16 + index, value);
          });
          palette.updateTable();
        }
      }
    } else {
      const ti = palArray.indexOf(transparent);

      if (ti > -1) {
        palArray.splice(ti, 1);
      }

      if (palArray.length < 256) {
        palArray.push(
          ...Array.from({ length: 256 - palArray.length }, () => 0)
        );
      }

      palArray.sort(sorter);
      palArray[227] = transparent;

      palArray.forEach((value, index) => {
        palette.set(paletteIndex * 16 + index, value);
      });
      palette.updateTable();
    }
  }

  /**
   * @param {boolean} [as8x8=false]
   * @param {boolean|Uint8Array} [over=false]
   * @param {boolean} [fourBit=false]
   */
  copy(as8x8 = false, over = false, fourBit = false) {
    const dim = this.dimensions;
    const ctx = this.__ctx;

    const edge = dim === 8 ? 8 : 16;

    const ittr = (dim / edge) ** 2;
    const step = dim / edge;

    let paletteIndex = null;
    const transparent = palette.transparent9Bit;

    let paletteLookup = Array.from({ length: 256 }, (_, i) => i);
    const transparencyPositions = [];
    paletteLookup = paletteLookup
      .filter((i) => {
        const isTransparent = palette.transparency.includes(palette.table[i]);
        if (isTransparent) {
          transparencyPositions.push(i);
        }
        return !isTransparent;
      })
      .map((i) => {
        return palette.getHex(i);
      });

    const nearest = nearestColour.from(paletteLookup);

    const width = parseInt(this.controls.w.value, 10);
    const height = parseInt(this.controls.h.value, 10);
    const auto = width * height;

    for (let k = 0; k < auto; k++) {
      // allow use to copy from outside the original image
      let { x, y } = this.coords(this.x, this.y, false);

      x = x + (k % width) * dim;
      y = y + ((k / width) | 0) * dim;

      if (fourBit) {
        // read all the pixels and load into a palette
        const pal = new Set();
        const imageData = ctx.getImageData(x, y, dim, dim);
        const length = dim * dim;
        for (let i = 0; i < length; i++) {
          let j = i;
          const [r, g, b, a] = imageData.data.slice(j * 4, j * 4 + 4);
          const index = next512FromRGB({ r, g, b });
          if (a === 0) {
            pal.add(transparent);
          } else {
            if (palette.transparency.includes(index)) {
              if (this.useMagenta) {
                pal.add(transparent);
              } else {
                // we've got magenta and we need to manually shift it along
                pal.add(463);
              }
            } else {
              pal.add(index);
            }
          }
        }

        let palArray = Array.from(pal);
        if (palArray.length < 16) {
          palArray.push(
            ...Array.from({ length: 16 - palArray.length }, () => 0)
          );
        }

        palArray.sort(sorter);

        paletteIndex = palette.find4BitIndex(palArray);

        if (paletteIndex === null) {
          if (pal.size > 16) {
            alert(
              `The selected region has ${pal.size} colours (of a max 16 colours) - exiting`
            );
            return;
          }

          // now add the index
          while (
            paletteIndex === null ||
            !(paletteIndex >= 0 && paletteIndex <= 15)
          ) {
            paletteIndex = prompt(
              'Matching palette could not be found, where would you\nlike to insert the new 16 colour palette?\n\n0-15'
            );

            if (paletteIndex === null) return;
            paletteIndex = parseInt(paletteIndex, 10);

            palArray.forEach((value, index) => {
              palette.set(paletteIndex * 16 + index, value);
            });
            palette.updateTable();
          }
        }
      }

      let adjust = (dim - edge) / 2;
      if (edge === 8) {
        adjust = 4;
        x -= 4;
        y -= 4;
      } else {
        x -= adjust;
        y -= adjust;
      }

      for (let j = 0; j < ittr; j++) {
        const pal = new Set();
        let data = new Uint16Array(edge * edge);
        const xa = (j % step) * edge;
        const ya = ((j / step) | 0) * edge;

        const imageData = ctx.getImageData(x + xa, y + ya, edge, edge);

        for (let i = 0; i < data.length; i++) {
          let j = i;
          if (as8x8 && edge === 16) {
            j =
              112 * Math.floor(i / 128) +
              16 * Math.floor((i % 64) / 8) +
              8 * Math.floor(i / 64) +
              (i % 8);
          }
          const [r, g, b, a] = imageData.data.slice(j * 4, j * 4 + 4);
          // const index = fourBit ? nearest({ r, g, b }) : toRGB332({ r, g, b });

          // if the sprite is in 4bit mode, we'll find the best spectrum colour and
          // create a palette on the fly.
          // if the sprite is 8bit, then we need to find the colour based on their
          // existing palette
          let index = next512FromRGB({ r, g, b });

          if (a === 0) {
            pal.add(transparent);
            if (!over) {
              data[i] = transparent;
            }
          } else {
            // this is a special edge case where the user image has magenta and
            // because of this we'll shift it across to the magenta that the
            // Next uses (#ff24ff). Feels a bit iffy, but it works.
            if (palette.transparency.includes(index)) {
              if (this.useMagenta) {
                index = transparent;
              } else {
                index = 463;
              }
            }

            // if the colour isn't already in our palette, do the best job to
            // match to the nearest colour
            if (palette.data.indexOf(index) === -1) {
              const best = nearest(rgbToHex({ r, g, b }));

              let bestIndex = paletteLookup.indexOf(best);

              const adjust = transparencyPositions.filter((_) => _ < bestIndex);

              // if the best match happens to be transparent (which is actually magenta)
              // then we'll shift to the next best colour
              // if (best === '#9200FF')
              //   console.log(
              //     'using nearest',
              //     { r, g, b },
              //     {
              //       index,
              //       best,
              //       bestIndex,
              //       adjust: adjust.length,
              //       pal: palette.data[bestIndex],
              //       prevBestIndex: paletteLookup.indexOf(best),
              //     }
              //   );

              bestIndex += adjust.length;

              index = palette.data[bestIndex];
            }

            pal.add(index);
            data[i] = index;
          }
        }

        if (fourBit) {
          const modified = new Uint8Array(edge * edge);
          const pal = palette.get4Bit(paletteIndex);
          data.forEach((_, i) => {
            modified[i] = paletteIndex * 16 + pal.indexOf(_);
          });
          data = modified;
        } else {
          const modified = new Uint8Array(edge * edge);
          data.forEach((_, i) => {
            modified[i] = palette.table.indexOf(_);
          });
          data = modified;
        }

        if (this.oncopy) this.oncopy(data, k * ittr + j);
      }
    }

    if (fourBit) {
      palette.render();
      palette.trigger('change');
      palette.updateCounts();
    }
  }

  paint(x = this.x, y = this.y) {
    const zoom =
      this.zoomFactor < 0
        ? 512 << (this.zoomFactor * -1)
        : 512 >> this.zoomFactor;

    const localCords = this.coords(x, y, false);
    this.status.innerHTML = `Zoom: ${5 - this.zoomFactor}:1<br>X/Y: ${
      localCords.x
    }/${localCords.y}<br>W/H: ${this.__ctx.canvas.width}/${
      this.__ctx.canvas.height
    }px`;
    const ctx = this.ctx;
    emptyCanvas(ctx);
    const w = ctx.canvas.width;
    ctx.clearRect(0, 0, w, w);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.__ctx.canvas, -x, -y, zoom, zoom, 0, 0, w, w);
  }

  render(ctx = this.ctx) {
    ctx.putImageData(this.pixels, 0, 0);
  }
}
