import { Bank } from './afx';
import track from '../lib/track-down';
import drop from '../lib/dnd';
import save from '../lib/save.js';

/**
 * @typedef { import("./afx").Effect } Effect
 */

/** @type {Bank|null} */
let bank = null;

let emptyBanks = new Set();

let table = document.querySelector('table');
const nameEl = document.querySelector('#name');
const position = document.querySelector('#position');

/** @type {boolean|null} */
let startState = { filter: null, checked: null };

/**
 * Converts a number to hex in upper case and padded
 *
 * @param {number} value
 * @param {number} [length]
 * @returns {string} Hex encoded string
 */
function padHex(value, length) {
  return value.toString(16).padStart(length, '0').toUpperCase();
}

/**
 * Pad start helper
 *
 * @param {number} value
 * @param {number} length
 * @returns {string}
 */
function pad(value, length) {
  return value.toString().padStart(length, '0');
}

/**
 * track handler
 *
 * @param {Event} event
 */
const handler = (event) => {
  let { target, layerX } = event;
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

      handleRangeAdjust({ target: input });
      event.preventDefault();
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
      startState.filter = name;
      startState.checked = !target.checked;
    }

    if (target.type === 'checkbox') {
      target.checked = startState.checked;
      target.dispatchEvent(new CustomEvent('update', { bubbles: true }));
    }
  },
  end() {
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
 * @param {string} name
 * @returns {Element}
 */
function bool(value, name) {
  const td = document.createElement('td');
  td.className = 'bool';
  const input = document.createElement('input');
  const label = document.createElement('label');
  td.appendChild(input);
  td.appendChild(label);
  label.className = name;
  input.type = 'checkbox';
  input.checked = value;
  input.name = name;
  return td;
}

/**
 * Render the effect frames
 *
 * @param {Effect} effect
 */
function showEffect(effect) {
  nameEl.value = effect.name;
  position.textContent = `${pad(bank.selected + 1, 3)}/${pad(
    bank.effects.length,
    3
  )}`;

  // old school!
  const root = document.forms[0];
  const trs = table.querySelector('tbody').childNodes;

  const toneMax = 16 ** maxForInput('tone') - 1;
  const noiseMax = 16 ** maxForInput('noise') - 1;
  const volumeMax = 16 ** maxForInput('volume') - 1;

  for (let i = 0; i < 0xff; i++) {
    emptyBanks.delete(i);
    const frame = effect.frames.get(i);
    const offset = i * 8; // 8 input elements
    if (frame) {
      trs[i].dataset.volume = frame.volume;
      root[offset + 0].checked = frame.t;
      root[offset + 1].checked = frame.n;
      root[offset + 2].value = padHex(frame.tone, 3);
      root[offset + 3].value = padHex(frame.noise, 2);
      root[offset + 4].value = padHex(frame.volume, 1);
      root[offset + 5].value = frame.tone;
      root[offset + 6].value = frame.noise;
      root[offset + 7].value = frame.volume;
      root[offset + 5].parentElement.dataset.value = frame.tone;
      root[offset + 6].parentElement.dataset.value = frame.noise;
      root[offset + 7].parentElement.dataset.value = frame.volume;
      root[offset + 5].nextSibling.style.setProperty(
        '--width',
        `${(100 / toneMax) * frame.tone}%`
      );
      root[offset + 6].nextSibling.style.setProperty(
        '--width',
        `${(100 / noiseMax) * frame.noise}%`
      );
      root[offset + 7].nextSibling.style.setProperty(
        '--width',
        `${(100 / volumeMax) * frame.volume}%`
      );
    } else {
      if (emptyBanks.has(i)) {
        continue;
      }
      emptyBanks.add(i);
      trs[i].dataset.volume = 0;
      root[offset + 0].checked = false;
      root[offset + 1].checked = false;
      root[offset + 2].value = padHex(0, 3);
      root[offset + 3].value = padHex(0, 2);
      root[offset + 4].value = padHex(0, 1);
      root[offset + 5].value = 0;
      root[offset + 6].value = 0;
      root[offset + 7].value = 0;
      root[offset + 5].parentElement.dataset.value = 0;
      root[offset + 6].parentElement.dataset.value = 0;
      root[offset + 7].parentElement.dataset.value = 0;
      root[offset + 5].nextSibling.style = '';
      root[offset + 6].nextSibling.style = '';
      root[offset + 7].nextSibling.style = '';
    }
  }
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
function handleCheckboxUpdate({ target }) {
  const root = target.closest('tr');
  const frame = bank.effect.get(parseInt(root.dataset.frame, 10));
  const name = target.name;

  console.log('here', target.type);

  if (target.type === 'checkbox') {
    frame[name] = target.checked;
    return;
  }
}

/**
 * @param {Event} event
 * @param {Element} event.target
 */
function handleRangeAdjust({ target }) {
  const root = target.closest('tr');
  const frame = bank.effect.get(parseInt(root.dataset.frame, 10));
  const name = target.name;

  // just in case
  if (target.type !== 'text' && target.type !== 'range') return;

  const bar = root.querySelector(`.bar input[name="${name}"]`).parentNode;
  const text = root.querySelector(`input[name="${name}"][type="text"]`);
  const range = root.querySelector(`input[name="${name}"][type="range"]`);
  const maxLength = maxForInput(name);
  const max = 16 ** maxLength - 1;
  let value = parseInt(target.value, 10);

  if (target.type === 'text') {
    value = parseInt('0x' + target.value.slice(-maxLength), 16);
    range.value = value;
  }

  if (name === 'volume') {
    root.dataset.volume = value;
  }

  if (isNaN(value)) value = 0;
  text.value = value.toString(16).padStart(maxLength, '0').toUpperCase();

  frame[name] = value;

  // handle the bar change
  bar.dataset.value = value;
  const p = (100 / max) * value;
  bar.querySelector('label').style.setProperty('--width', `${p}%`);
}

table.addEventListener('input', handleRangeAdjust);
table.addEventListener('change', handleCheckboxUpdate);
table.addEventListener('update', handleCheckboxUpdate);

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    play(bank.effect);
  }

  if (e.key === 'D') {
    const data = bank.effect.play();
    save(data, (bank.effect.name || 'untitled') + '.wav');
  }

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
 * @param {Effect} effect
 */
function play(effect) {
  const data = effect.play();
  if (!window.AudioContext) {
    if (!window.webkitAudioContext) {
      alert(
        'Your browser does not support any AudioContext and cannot play back this audio.'
      );
      return;
    }
    window.AudioContext = window.webkitAudioContext;
  }

  const context = new AudioContext();

  context.decodeAudioData(data.buffer, function (buffer) {
    // Create a source node from the buffer
    var source = context.createBufferSource();
    source.buffer = buffer;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);
    // Play immediately
    source.start(0);
  });
}

/**
 * Generates the initial empty audio slots. Note that I've reduced this to
 * 256 slots instead of the normal 4096 - because the browser poops itself.
 */
function init() {
  const root = document.createElement('tbody');
  const template = document.createElement('tr');
  template.dataset.volume = 0;

  template.appendChild(bool(false, 't'));
  template.appendChild(bool(false, 'n'));

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
    emptyBanks.add(i);
    const node = template.cloneNode(true);
    node.prepend(td(i.toString().padStart(3, '0'), 'pos' + i, 'pos'));
    node.dataset.frame = i;
    root.appendChild(node);
  }

  table.querySelector('tbody').replaceWith(root);
}

drop(document.documentElement, (data, file) => {
  if (file.name.toLowerCase().endsWith('.afx')) {
    // then it's a single effect - let's add it
    bank.addEffect(data);
  } else {
    // assume it's a bank

    bank = new Bank(data);
  }
  showEffect(bank.effect);
});

fetch('/assets/mummy.afb')
  .then((res) => res.arrayBuffer())
  .then((data) => {
    bank = new Bank(data);
    window.bank = bank;

    init();
    showEffect(bank.effect);
  });
