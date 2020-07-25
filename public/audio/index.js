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

track(table, {
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
 * @param {number} value
 * @param {number} max
 * @returns {Element}
 */
function bar(value, max) {
  const td = document.createElement('td');
  td.className = 'bar';
  const span = document.createElement('span');
  td.appendChild(span);
  span.dataset.value = value;
  span.dataset.max = max;
  span.style.width = `${(100 / max) * value}%`;
  span.title = `${value}/${max}`;
  span.innerHTML = '&nbsp;';
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
    tr.appendChild(td(frame.t ? 'T' : '-'));
    tr.appendChild(td(frame.n ? 'N' : '-'));
    tr.appendChild(
      input(frame.tone.toString(16).padStart(3, '0').toUpperCase())
    );
    tr.appendChild(
      input(frame.noise.toString(16).padStart(2, '0').toUpperCase())
    );
    tr.appendChild(input(frame.volume.toString(16).toUpperCase()));
    tr.appendChild(bar(frame.tone, 0xfff));
    tr.appendChild(bar(frame.noise, 0xff));
    tr.appendChild(bar(frame.volume, 0xff));

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
