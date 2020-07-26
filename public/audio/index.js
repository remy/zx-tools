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

const table = document.querySelector('#bank');
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
 *
 * @param {number} value
 * @param {number} max
 * @param {number} pad
 * @returns {{ input: Element, bar: Element }}
 */
function inputBar(value, max, pad) {
  const b = bar(value, max);
  const i = input(value.toString(16).padStart(pad, '0').toUpperCase(), max);

  const bInput = b.querySelector('input');
  const iInput = i.querySelector('input');

  iInput.addEventListener('input', () => {
    bInput.value = iInput.value;
    const event = new Event('input');
    bInput.dispatchEvent(event);
  });

  bInput.addEventListener('input', () => {
    const value = parseInt(bInput.value, 10);
    iInput.value = value.toString(16).padStart(pad, '0').toUpperCase();
  });

  return { input: i, bar: b };
}

/**
 * @param {number} value
 * @param {number} max
 * @returns {Element}
 */
function bar(value, max) {
  const td = document.createElement('td');
  td.className = 'bar';

  const span = document.createElement('span');
  td.appendChild(span);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0;
  input.max = max;

  input.value = value;
  span.appendChild(input);

  const label = document.createElement('label');
  span.appendChild(label);

  const handler = () => {
    const p = (100 / max) * input.value;
    span.dataset.value = input.value;
    label.style.setProperty('--width', `${p}%`);
  };
  input.addEventListener('input', handler);

  handler();

  return td;
}

/**
 * @param {number} value
 * @param {number} max
 * @returns {Element}
 */
function input(value, max) {
  const td = document.createElement('td');
  const input = document.createElement('input');
  td.appendChild(input);
  input.value = value;
  input.size = value.length;
  input.max = max;
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
  table.innerHTML = '';
  effect.frames.forEach((frame, i) => {
    const tr = document.createElement('tr');
    tr.appendChild(td(i.toString().padStart(3, '0')));
    tr.appendChild(bool(frame.t, 'tone'));
    tr.appendChild(bool(frame.n, 'noise'));

    const tone = inputBar(frame.tone, 0xfff, 3);
    const noise = inputBar(frame.noise, 0xff, 2);
    const volume = inputBar(frame.volume, 0xf, 1);

    tr.appendChild(tone.input);
    tr.appendChild(noise.input);
    tr.appendChild(volume.input);

    tr.appendChild(tone.bar);
    tr.appendChild(noise.bar);
    tr.appendChild(volume.bar);

    table.appendChild(tr);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    bank.selected--;
    showEffect(bank.effect);
  }

  if (e.key === 'ArrowRight') {
    bank.selected++;
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
