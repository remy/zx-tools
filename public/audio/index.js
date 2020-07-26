import { SoundBackend, SoundGenerator } from './vendor/sound';
import { Bank } from './afx';
import track from '../lib/track-down';

/**
 * @typedef { import("./afx").Effect } Effect
 */

// const soundBackend = SoundBackend();

/** @type {Bank|null} */
let bank = null;

// soundBackend.notifyReady = (arg) => {
//   console.log('notifyReady(' + arg + ')');
// };

// const soundGenerator = SoundGenerator({
//   soundBackend,
//   model: {
//     clockSpeed: 3546900,
//     frameLength: 70908,
//   },
// });

// window.soundBackend = soundBackend;
// window.soundGenerator = soundGenerator;

// console.log(soundBackend.setAudioState(true));
// console.log(soundBackend.isEnabled);

let table = document.querySelector('table');
const nameEl = document.querySelector('#name');
const position = document.querySelector('#position');

/** @type {boolean|null} */
let startState = { filter: null, checked: null };

/**
 * track handler
 *
 * @param {Event} e
 */
const handler = ({ target, layerX }) => {
  if (target.nodeName === 'LABEL') {
    target = target.parentNode;
  }

  if (target.classList.contains('bar')) {
    const name = target.name || target.dataset.name;

    if (name === startState.filter || startState.filter === null) {
      const p = ((100 / target.clientWidth) * layerX) / 100;
      const max = 16 ** maxForInput(name);
      const value = (p * max) | 0;
      const input = target.querySelector('input');
      input.value = value;

      handleInput({ target: input });
    }
  }
};
track(table, {
  moveStart(e) {
    /** @type Element */
    let target = e.target;
    if (target.nodeName === 'LABEL') {
      target = target.parentNode;
    }
    const name = target.name || target.dataset.name;
    if (startState.filter !== null && name !== startState.filter) {
      return;
    }

    if (startState.filter === null) {
      console.log(
        'setting filter to ' + name,
        target.name,
        target.dataset.name,
        target
      );

      startState.filter = name;
      startState.checked = !target.checked;
    }

    if (target.type === 'checkbox') {
      target.checked = startState.checked;
    }
  },
  end(e) {
    console.log('end on ', e.target);

    startState = { checked: null, filter: null };
  },
  handler,
  start: handler,
});

/**
 * @param {string} text
 * @param {string} id
 * @param {string} [className]
 * @returns {Element}
 */
function td(text, id, className) {
  const td = document.createElement('td');
  td.id = id;
  td.textContent = text;
  if (className) td.className = className;
  return td;
}

/**
 * @param {string} name
 * @param {number} value
 * @param {number} pad
 * @returns {{ input: Element, bar: Element }}
 */
function inputBar(name, value, pad) {
  const b = bar(name, value);
  const i = input(name, value.toString(16).padStart(pad, '0').toUpperCase());

  return { input: i, bar: b };
}

/**
 * @param {string} name
 * @param {number} value
 * @returns {Element}
 */
function bar(name, value) {
  const max = 16 ** maxForInput(name) - 1;
  const td = document.createElement('td');

  const span = document.createElement('span');
  span.className = 'bar';
  td.appendChild(span);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0;
  input.max = max;
  input.name = name;

  input.value = value;
  span.appendChild(input);
  span.dataset.name = name;

  const label = document.createElement('label');
  label.style.setProperty('--width', `${(100 / max) * input.value}%`);

  span.appendChild(label);
  span.dataset.value = value;

  return td;
}

/**
 * @param {string} name
 * @param {number} value
 * @returns {Element}
 */
function input(name, value) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  td.appendChild(input);
  input.value = value;
  input.type = 'text';
  input.name = name;
  input.size = value.length;
  return td;
}

/**
 *
 * @param {boolean} value
 * @param {string} className
 * @returns {Element}
 */
function bool(value, className) {
  const td = document.createElement('td');
  td.className = 'bool';
  const input = document.createElement('input');
  const label = document.createElement('label');
  td.appendChild(input);
  td.appendChild(label);
  label.className = className;
  input.type = 'checkbox';
  input.checked = value;
  input.name = className;
  return td;
}

/**
 * Render the effect frames
 *
 * @param {Effect} effect
 */
function showEffect(effect) {
  nameEl.value = effect.name;
  position.textContent = `${(bank.selected + 1)
    .toString()
    .padStart(3, '0')}/${bank.effects.length.toString().padStart(3, '0')}`;
  const root = document.createElement('tbody');
  effect.frames.forEach((frame, i) => {
    const tr = document.createElement('tr');
    tr.appendChild(td(i.toString().padStart(3, '0')));
    tr.appendChild(bool(frame.t, 'tone'));
    tr.appendChild(bool(frame.n, 'noise'));

    const tone = inputBar('tone', frame.tone, 3);
    const noise = inputBar('noise', frame.noise, 2);
    const volume = inputBar('volume', frame.volume, 1);

    tr.appendChild(tone.input);
    tr.appendChild(noise.input);
    tr.appendChild(volume.input);

    tr.appendChild(tone.bar);
    tr.appendChild(noise.bar);
    tr.appendChild(volume.bar);

    root.appendChild(tr);
  });

  table.querySelector('tbody').replaceWith(root);
}

/**
 * @param {string} name enum of volume, noise, tone
 * @returns {number}
 */
function maxForInput(name) {
  if (name === 'volume') return 1;
  if (name === 'noise') return 2;
  if (name === 'tone') return 3;
}

document.body.addEventListener('focusout', (e) => {
  const { target } = e;
  if (target.type === 'text' && target.id !== 'name') {
    if (target.value.trim() === '') {
      target.value = 0;
      // const event = new Event('input');
      // target.dispatchEvent(event);
    }
  }
});

/**
 * @param {Event} event
 * @param {Element} event.target
 */
function handleInput({ target }) {
  const input = target;
  const root = input.closest('tr');
  const name = input.name;
  const bar = root.querySelector(`.bar input[name="${name}"]`).parentNode;
  const text = root.querySelector(`input[name="${name}"][type="text"]`);
  const range = root.querySelector(`input[name="${name}"][type="range"]`);
  const maxLength = maxForInput(name);
  const max = 16 ** maxLength - 1;
  let value = parseInt(input.value, 10);

  if (input.type === 'text') {
    value = parseInt('0x' + input.value.slice(-maxLength), 16);
    range.value = value;
  }

  if (name === 'volume') {
    root.dataset.volume = value;
  }

  if (isNaN(value)) value = 0;
  text.value = value.toString(16).padStart(maxLength, '0').toUpperCase();

  // handle the bar change
  const p = (100 / max) * value;
  bar.dataset.value = value;
  bar.querySelector('label').style.setProperty('--width', `${p}%`);
  console.log(bar);
}

table.addEventListener('input', handleInput);

document.addEventListener('keydown', (e) => {
  if (e.key === '=' || e.key === '+') {
    bank.selected++;
    showEffect(bank.effect);
  }

  if (e.key === '-' || e.key === '_') {
    bank.selected--;
    showEffect(bank.effect);
  }
});

/**
 * Generates the initial empty audio slots. Note that I've reduced this to
 * 256 slots instead of the normal 4096 - because the browser poops itself.
 */
function init() {
  const root = document.createElement('tbody');
  const template = document.createElement('tr');
  template.dataset.volume = 0;

  template.appendChild(bool(false, 'tone'));
  template.appendChild(bool(false, 'noise'));

  const tone = inputBar('tone', 0, 3);
  const noise = inputBar('noise', 0, 2);
  const volume = inputBar('volume', 0, 1);

  template.appendChild(tone.input);
  template.appendChild(noise.input);
  template.appendChild(volume.input);

  template.appendChild(tone.bar);
  template.appendChild(noise.bar);
  template.appendChild(volume.bar);

  for (let i = 0; i < 0xff; i++) {
    const node = template.cloneNode(true);
    node.prepend(td((i + 1).toString().padStart(3, '0'), 'pos' + i, 'pos'));
    root.appendChild(node);
  }

  table.querySelector('tbody').replaceWith(root);
}

fetch('/assets/mummy.afb')
  .then((res) => res.arrayBuffer())
  .then((data) => {
    bank = new Bank(data);
    window.bank = bank;

    // showEffect(bank.effect);
    init();
  });
