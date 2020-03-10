import drop from '../lib/dnd.js';
import { load, pixelsForSCR, loadBlinkAttributes, download } from './scr.js';
import { $ } from '../lib/$.js';

function fileHandler(data) {
  console.log(data);

  const canvas = $('#preview')[0];

  const ctx = canvas.getContext('2d');

  pixelsForSCR(data, ctx);
}

drop(document.body, fileHandler);
$('input').on('change', event => {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = event => fileHandler(new Uint8Array(event.target.result));
  reader.readAsArrayBuffer(droppedFile);
});
