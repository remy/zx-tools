// import { rgbFromIndex, transparent, toRGB332 } from './lib/colour.js';
import { xyToIndex } from './sprite-tools.js';
import { $ } from '../lib/$.js';
import trackDown from '../lib/track-down.js';
import Hooks from '../lib/Hooks.js';

const currentTile = document.querySelector('#current-tile');

const dummySpriteSheet = {
  get() {
    return dummySpriteSheet;
  },

  setScale() {},

  paint() {},
};

export function getCoords(e, w, size, h = w) {
  const rect = e.target.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / size) | 0; //x position within the element.
  const y = ((e.clientY - rect.top) / size) | 0; //y position within the element.
  const index = xyToIndex({ x, y, w, h });
  return { x, y, index };
}

const sizes = new Map([
  [16, { bank: 16 * 12, w: 16, h: 12 }],
  [8, { bank: 32 * 24, w: 32, h: 24 }],
]);

export default class TileMap extends Hooks {
  scale = 3;
  _sprites = null;
  _tmp = null;
  _size = 16; // default to 16px
  _lastSet = null;
  history = [];
  _undoPtr = 0;
  showIndexOverlay = false;

  constructor({ size = 8, sprites }) {
    super();
    const scale = this.scale;
    const { bank, w, h } = sizes.get(size);
    // max bank size: 16k
    this.bank = new Uint8Array(bank);
    this.bank.fill(63); //1024 / size - 1);

    this.ctx = document.createElement('canvas').getContext('2d');

    const el = this.ctx.canvas;

    el.width = w * size * scale;
    el.height = h * size * scale;

    const cancel = trackDown(el, {
      handler: (e) => {
        const { index } = getCoords(
          e,
          this.width,
          this.size * this.scale,
          this.height
        );
        this.set(index);
        this._tmp = null;
      },
      move: (e) => this.hover(e),
    });

    el.addEventListener('mouseout', () => {
      cancel();
      this.clearHover();
    });

    this.sprites = sprites;

    $(`.tile-controls input[name="size"][value="${this.size}"]`).checked = true;
    this.elements = {
      width: $(`.tile-controls input[name="width"]`),
      height: $(`.tile-controls input[name="height"]`),
      scale: $(`.tile-controls input[name="size"]`),
      showIndex: $(`.tile-controls input[name="show-index-overlay"]`),
    };

    this.showIndexOverlay = this.elements.showIndex.checked;
    if (this.showIndexOverlay) this.showIndex();

    $(`.tile-controls input[name="size"]`).on('change', (e) => {
      this.sprites.setScale(parseInt(e.target.value, 10));
    });

    $('.tile-controls input').on('change', () => {
      this.resize({
        w: parseInt(this.elements.width.value, 10),
        h: parseInt(this.elements.height.value, 10),
        size: parseInt(
          this.elements.scale.filter((_) => _.checked)[0].value,
          10
        ),
      });
      this.showIndexOverlay = this.elements.showIndex.checked;
      this.showIndex(!this.showIndexOverlay);
    });

    this.hook(() => {
      if (this.showIndexOverlay) {
        this.showIndex();
      }
    }, 'update-index');

    // triggers dom changes
    this.setDimensions({ width: w, height: h, size });
    this.snapshot();
  }

  get size() {
    return this._size;
  }

  set size(value) {
    if (value !== this._size) {
      this._size = value;

      this.sprites.defaultScale = value;
      if (value === 8) {
        this.sprites.renderSubSprites();
      }
      document.body.dataset.scale = this.sprites.defaultScale;
    }
  }

  clear() {
    const bank = new Uint8Array(this.width * this.height);
    bank.fill(63); //1024 / this.size - 1);
    this.load({ bank });
    this.paint();
  }

  snapshot() {
    this.history.splice(this._undoPtr + 1);
    this.history.push(new Uint8Array(this.bank));
    this._undoPtr = this.history.length - 1;
  }

  undo() {
    const data = this.history[this._undoPtr];

    if (!data) {
      return;
    }
    this._undoPtr--;

    this.bank = data;
    this.trigger();
    this.paint();
  }

  serialize() {
    return {
      bank: Array.from(this.bank),
      scale: this.scale,
      width: this.width,
      height: this.height,
      size: this.size,
    };
  }

  // important: this is not used to change dimensions, only for init
  setDimensions({ width, height, size = this.size, scale = this.scale } = {}) {
    this.elements.width.value = width;
    this.elements.height.value = height;
    this.width = width;
    this.height = height;

    this.size = size;
    this.scale = scale;

    const el = this.ctx.canvas;
    el.width = width * size * scale;
    el.height = height * size * scale;

    $(`.tile-controls input[name="size"][value="${this.size}"]`).checked = true;
  }

  showIndex(remove) {
    if (this.ctx.canvas.parentElement) {
      if (remove) {
        if (this.indexMap)
          this.ctx.canvas.parentElement.removeChild(this.indexMap);
        this.indexMap = null;
        return;
      }
      if (!this.indexMap) {
        this.indexMap = document.createElement('div');
        this.indexMap.id = 'index-map';
        this.ctx.canvas.parentElement.appendChild(this.indexMap);
      }

      this.indexMap.style.width = this.scale * this.size * this.width + 'px';
      this.indexMap.style.height = this.scale * this.size * this.height + 'px';
      this.indexMap.innerHTML = Array.from(this.bank)
        .map((i) => `<span>${i}</span>`)
        .join('');
    }
  }

  resize({ w, h, size }) {
    const { width, height } = this;

    if (w === width && h === height && size === this.size) {
      return;
    }

    this.size = size;

    this.width = w;
    this.height = h;

    const el = this.ctx.canvas;

    // max bank size: 16k
    const bank = new Uint8Array(w * h);
    bank.fill(63); // fill with the last sprite value

    if (w !== width) {
      const adjust = w > width ? width : w;
      for (let i = 0; i < height; i++) {
        // note: i * w = row length
        bank.set(this.bank.slice(i * width, i * width + adjust), i * w);
      }
    } else {
      bank.set(this.bank.slice(0, bank.length));
    }

    this.bank = bank;

    el.width = w * size * this.scale;
    el.height = h * size * this.scale;
    this.snapshot();
    this.paint();
  }

  set sprites(sprites) {
    this._sprites = sprites || dummySpriteSheet;
    this._sprites.defaultScale = this.size;
    // if (sprites) sprites.hook(debounce(() => this.paint(), 1000));
    this.paint();
  }

  get sprites() {
    return this._sprites;
  }

  load({ bank, dimensions = {}, sprites = null }) {
    if (Object.keys(dimensions).length) this.setDimensions(dimensions);

    this.history = [];
    this.bank = bank;
    this.snapshot();

    if (sprites) {
      this._sprites = sprites;
    }
    this.trigger();
  }

  getXY = (i) => {
    const x = i % this.width;
    const y = (i / this.width) | 0;

    return { x, y };
  };

  set(index) {
    if (this._lastSet !== index) {
      this.bank[index] = this.sprites.spriteIndex(this.size);
      this.snapshot();
      this._lastSet = index;
      this.trigger();
      this.paintSingle(index);
    }
  }

  clearHover() {
    if (this._tmp !== null) {
      const index = this._tmp;
      currentTile.innerHTML = `&nbsp;`;

      this.paintSingle(index);
      this._tmp = null;
    }
  }

  hover(e) {
    const { index, x, y } = getCoords(e, this.width, this.size * this.scale);

    if (this._tmp === index) {
      return;
    }

    this.clearHover();

    this._tmp = index;

    currentTile.innerHTML = `X:${x} Y:${y} -- ${this.bank[index]}`;

    this.paintSingle(index, this.sprites.spriteIndex(this.size));
  }

  toBasic() {
    const str = `#autoline
    RUN AT 3
    LAYER 2,1: CLS
    LOAD "MY_SPRITES.spr" BANK 13:; spritesheet
    LOAD "MY_MAP.map" BANK 14:; tile map
    TILE BANK 13:; point tilemap to spritesheet
    TILE DIM 14,0,${this.width},${this.size}:; using tile bank 14, offset 0, tile ${this.width} wide, tile size ${this.size}
    TILE ${this.width},${this.height}:; print tile for ${this.width}x${this.height}
    PAUSE 0
    `
      .split('\n')
      .map((_) => _.trim())
      .join('\n');
    return str;
  }

  paintSingle(i, bankIndex = null) {
    const small = this.size === 8;
    const { x, y } = this.getXY(i);
    if (bankIndex === null) bankIndex = this.bank[i];
    let value = bankIndex;

    if (small) {
      bankIndex = (bankIndex / 4) | 0;
    }

    const sprite = this.sprites.get(bankIndex);

    if (!sprite) {
      console.log({ value, bankIndex, i });
      return;
    }

    sprite.paint(this.ctx, {
      scale: small ? 8 : 16,
      subSprite: value % 4,
      x: x * this.size * this.scale,
      y: y * this.size * this.scale,
      w: this.size * this.scale,
    });
  }

  paint() {
    const small = this.size === 8;
    for (let i = 0; i < this.bank.length; i++) {
      const { x, y } = this.getXY(i);
      let bankIndex = this.bank[i];
      let value = bankIndex;

      if (small) {
        bankIndex = (bankIndex / 4) | 0;
      }

      const sprite = this.sprites.get(bankIndex);

      if (!sprite) {
        console.log({ value, bankIndex, i });
        break;
      }

      sprite.paint(this.ctx, {
        scale: small ? 8 : 16,
        subSprite: value % 4,
        x: x * this.size * this.scale,
        y: y * this.size * this.scale,
        w: this.size * this.scale,
      });
    }
  }
}
