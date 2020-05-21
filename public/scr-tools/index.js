import drop from '../lib/dnd.js';
import { pixelsForSCR } from './lib/scr.js';
import { $ } from '../lib/$.js';
import save from '../lib/save.js';
import { dither } from './lib/retrofy.js';

const result = $('#result')[0];

function basename(filename) {
  return filename.split('.').slice(0, -1).join('.');
}

function container(filename, altDownload) {
  const isSCR = filename.toUpperCase().endsWith('.SCR');

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const div = document.createElement('div');
  div.className = 'container';
  div.appendChild(canvas);

  const button = document.createElement('button');
  div.appendChild(button);
  button.onclick = async () => {
    const file = await new Promise((resolve) => canvas.toBlob(resolve));

    save(file, basename(filename) + '.png');
  };
  button.innerText = 'Download PNG';

  if (!isSCR) {
    const button = document.createElement('button');
    div.appendChild(button);
    button.onclick = async () => {
      save(altDownload, basename(filename) + '.scr');
    };
    button.innerText = 'Download SCR';
  }

  result.prepend(div);
  return ctx;
}

async function fileHandler(data, filename, type) {
  if (filename.toUpperCase().endsWith('.SCR')) {
    pixelsForSCR(data, container(filename));
  } else {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const res = await dither({ url });
    pixelsForSCR(res, container(filename, res));
    URL.revokeObjectURL(url);
  }
}

drop(document.body, fileHandler);

$('input').on('change', (event) => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = (event) =>
    fileHandler(new Uint8Array(event.target.result), file.name, file.type);
  reader.readAsArrayBuffer(file);
});
