import { SoundBackend, SoundGenerator } from './vendor/sound';
import { Bank } from './afx';
import track from '../lib/track-down';

const soundBackend = SoundBackend();

/** @type {Bank|null} */
let bank = null;

soundBackend.notifyReady = (arg) => {
  console.log('notifyReady(' + arg + ')');
};

const soundGenerator = SoundGenerator({
  soundBackend,
  model: {
    clockSpeed: 3546900,
    frameLength: 70908,
  },
});

window.soundBackend = soundBackend;
window.soundGenerator = soundGenerator;

console.log(soundBackend.setAudioState(true));
console.log(soundBackend.isEnabled);

let table = document.querySelector('table');
const nameEl = document.querySelector('#name');
const position = document.querySelector('#position');

/** @type {boolean|null} */
let startCheckState = { filter: '', checked: null };

track(table, {
  moveStart(e) {
    if (e.target.nodeName === 'INPUT' && e.target.type === 'checkbox') {
      if (startCheckState.checked === null) {
        startCheckState.checked = !e.target.checked;
        startCheckState.filter = e.target.name;
      }
      if (e.target.name === startCheckState.filter) {
        e.target.checked = startCheckState.checked;
      }
    }
  },
  end() {
    startCheckState = { checked: null };
  },
  handler(e) {
    if (e.target.classList.contains('bar')) {
      console.log('track');
    }
  },
});

/**
 * @param {string} text
 * @returns {Element}
 */
function td(text) {
  const td = document.createElement('td');
  td.textContent = text;
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
  td.className = 'bar';

  const span = document.createElement('span');
  td.appendChild(span);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0;
  input.max = max;
  input.name = name;

  input.value = value;
  span.appendChild(input);

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
  if (e.target.type === 'text') {
    if (e.target.value.trim() === '') {
      e.target.value = 0;
      const event = new Event('input');
      e.target.dispatchEvent(event);
    }
  }
});

table.addEventListener('input', (e) => {
  const input = e.target;
  const root = input.closest('tr');
  const bar = root.querySelector(`.bar span input[name="${input.name}"]`)
    .parentNode;
  const text = root.querySelector(`input[name="${input.name}"][type="text"]`);
  const range = root.querySelector(`input[name="${input.name}"][type="range"]`);
  const maxLength = maxForInput(input.name);
  const max = 16 ** maxLength - 1;
  let value = parseInt(input.value, 10);

  if (input.type === 'text') {
    value = parseInt('0x' + input.value.slice(-maxLength), 16);
    range.value = value;
  }

  if (isNaN(value)) value = 0;
  text.value = value.toString(16).padStart(maxLength, '0').toUpperCase();

  // handle the bar change
  const p = (100 / max) * value;
  bar.dataset.value = value;
  bar.querySelector('label').style.setProperty('--width', `${p}%`);
  console.log(value, p, max, maxLength);
});

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

fetch('/assets/mummy.afb')
  .then((res) => res.arrayBuffer())
  .then((data) => {
    bank = new Bank(data);
    window.bank = bank;
    showEffect(bank.effect);
  });
