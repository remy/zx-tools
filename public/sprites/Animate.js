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
        from: null,
        to: null,
        speed: null,
        effect: null,
        bg: null,
      },
      {
        scale: {
          dom: '#animate-scale',
          callback: (value) => {
            this.scale = value;
            this.trigger('change');
          },
        },
        from: {
          parse: (value) => parseInt(value, 10),
          dom: '#animate input[name="from"]',
          callback: (value) => {
            if (value > controls.to) {
              controls.to = value;
            }
            this.from = value;
            this.trigger('change');
          },
        },
        to: {
          parse: (value) => parseInt(value, 10),
          dom: '#animate input[name="to"]',
          callback: (value) => {
            if (value < controls.from) {
              controls.from = value;
            }
            this.to = value;
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

  set effect(value) {
    this.bounce = value === 'bounce';
    this.loop = value === 'loop';
  }

  get effect() {
    return this.bounce ? 'bounce' : 'loop';
  }

  set scale(value) {
    this._scale = value;
    this.canvas.style.setProperty('--block-size', value * 2 + 'px');
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
    const { to, from, scale, bg, speed, effect, visible } = this;
    return {
      to,
      from,
      scale,
      bg,
      speed,
      effect,
      visible,
    };
  }

  restore(props) {
    ['to', 'from', 'scale', 'bg', 'speed', 'effect'].forEach((prop) => {
      this.controls[prop] = props[prop];
    });

    this.visible = props.visible;
  }

  add(sprite) {
    this.sprites.push(sprite);
  }

  draw() {
    const { from, to, frame, bounce } = this;
    let current;
    let scale = to - from;
    if (bounce && scale !== 0) {
      current = from + Math.abs((frame % (scale * 2)) - scale);
    } else {
      scale++;
      current = from + (frame % scale);
    }
    this.ctx.clearRect(0, 0, 16, 16);
    const sprite = this.sprites.sprites[current];
    if (sprite) {
      this.ctx.drawImage(sprite.canvas, 0, 0, 16, 16);
    }
  }

  tick() {
    requestAnimationFrame((delta) => {
      this.tick();
      if (this.visible && delta - this.lastDraw > 1000 / this.speed) {
        this.draw();
        this.lastDraw = delta;
        this.frame++;
      }
    });
  }

  play() {}

  stop() {}
}
