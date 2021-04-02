import { transparent } from './lib/colour';
import Bind from '../lib/bind';
import Hooks from '../lib/Hooks';

/**
 * @typedef { import("./Sprite").default } Sprite
 * @typedef { import("./SpriteSheet").default } SpriteSheet
 */

/**
 * @class
 */
export default class Animate extends Hooks {
  /** @type {SpriteSheet} */
  sprites = [];

  speed = 0;
  loop = false;
  bounce = false;
  composite = false;
  bg = transparent;
  from = 0;
  to = 0;
  _w = 1;
  _h = 1;
  _scale = 16;
  frame = 0;

  /**
   *
   * @param {SpriteSheet} sprites
   */
  constructor(sprites) {
    super();
    this.sprites = sprites;
    this.root = document.querySelector('#animate');
    this.canvas = document.querySelector('#animate canvas');
    this.ctx = this.canvas.getContext('2d');

    let controls = {};

    controls = new Bind(
      {
        scale: this.scale,
        from: null, // null means read from html
        frames: null,
        speed: null,
        effect: null,
        bg: null,
        w: null,
        h: null,
        skip: null,
      },
      {
        w: {
          dom: '#comp-width',
          callback: (value) => (this.w = value),
        },
        h: {
          dom: '#comp-height',
          callback: (value) => (this.h = value),
        },
        skip: {
          dom: '#comp-skip',
          parse: (value) => parseInt(value, 10),
          callback: (value) => {
            this.skip = value;
            this.trigger('change');
          },
        },
        scale: {
          dom: '#animate-scale',
          callback: (value) => {
            this.scale = value;
            this.trigger('change');
          },
        },
        from: {
          parse: (value) => parseInt(value, 10),
          dom: '#animate input[name="animate-from"]',
          callback: (value) => {
            this.from = value;
            this.trigger('change');
          },
        },
        frames: {
          parse: (value) => parseInt(value, 10),
          dom: '#animate input[name="animate-frames"]',
          callback: (value) => {
            this.frames = value;
            this.trigger('change');
          },
        },
        speed: {
          dom: '#animate input[name="speed"]',
          callback: (value) => {
            this.speed = value;
            this.trigger('change');
          },
        },
        effect: {
          dom: '#animate input[name="effect"]',
          callback: (value) => {
            this.effect = value;
            this.trigger('change');
          },
        },
        bg: {
          dom: '#animate input[name="bg"]',
          callback: (value) => {
            this.canvas.style.background = value || '#fff';
            this.bg = value;
            this.trigger('change');
          },
        },
      }
    );

    this.controls = controls;

    this.root.hidden = true;

    this.lastDraw = 0;
    this.tick();
  }

  set h(value) {
    value = parseInt(value, 10);
    this._h = value;
    this.ctx.canvas.height = value * this.scale;
    this.canvas.style.setProperty(
      '--block-size-h',
      value * this.scale * 2 + 'px'
    );
  }

  get h() {
    return this._h;
  }

  set w(value) {
    value = parseInt(value, 10);
    this._w = value;
    this.ctx.canvas.width = value * this.scale;
    this.canvas.style.setProperty(
      '--block-size-w',
      value * this.scale * 2 + 'px'
    );
  }

  get size() {
    return this._w * this._h;
  }

  get w() {
    return this._w;
  }

  set effect(value) {
    this.bounce = value === 'bounce';
    this.loop = value === 'loop';
  }

  get effect() {
    return this.bounce ? 'bounce' : 'loop';
  }

  set scale(value) {
    this._scale = value;
    const { w, h } = this;
    // this.canvas.style.setProperty('--block-size', value * 2 + 'px');
    this.h = h;
    this.w = w;
  }

  get scale() {
    return this._scale;
  }

  set visible(value) {
    this.root.hidden = !value;
    document.body.dataset.animate = value;

    this.trigger('change');
  }

  get visible() {
    return !this.root.hidden;
  }

  serialize() {
    const {
      frames,
      from,
      scale,
      bg,
      speed,
      effect,
      visible,
      h,
      w,
      skip,
    } = this;
    return {
      frames,
      from,
      scale,
      bg,
      speed,
      effect,
      visible,
      h,
      w,
      skip,
    };
  }

  restore(props) {
    [
      'frames',
      'from',
      'scale',
      'bg',
      'speed',
      'effect',
      'h',
      'w',
      'skip',
    ].forEach((prop) => {
      this.controls[prop] = props[prop];
    });

    this.visible = props.visible;
  }

  draw() {
    const { from, frames, frame, bounce, w } = this;
    let skip = this.skip + 1;
    let current;

    if (bounce && frames > 1) {
      let scale = (frames - 1) * this.size;
      current = from + Math.abs((frame % (scale * 2)) - scale);
    } else {
      let scale = frames * this.size;
      current = from + (frame % scale);
    }

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.width);
    for (let i = 0; i < this.size; i++) {
      const sprite = this.sprites.sprites[current + i * skip];
      if (sprite) {
        // this.ctx.drawImage(sprite.canvas, 0, 0, 16, 16);
        const x = (i % w) * this.scale;
        const y = ((i / w) | 0) * this.scale;

        sprite.paint(this.ctx, { x, y, w: this.scale });
      }
    }
  }

  tick() {
    requestAnimationFrame((delta) => {
      if (this.visible && delta - this.lastDraw > 1000 / this.speed) {
        this.draw();
        this.lastDraw = delta;
        this.frame += this.size;
      }
      this.tick();
    });
  }
}
