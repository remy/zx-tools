import dnd from '../lib/dnd.js';
import { $ } from '../lib/$.js';
import Lexer, { asTap, plus3DOSHeader } from './txt2bas.js';
import CodeMirror from './lib/cm.js';
import { bas2txt, bas2txtLines } from './bas2txt.js';
import './basic-syntax.js';
import save from '../lib/save.js';
import { decode } from '../lib/unpack/lib.js';
import { generateBlock } from '../lib/audio/index.js';
import { createWavFromBuffer } from '../lib/audio/make-wav.js';

function localSave() {
  sessionStorage.setItem('code', cm.getValue());
}

const lexer = new Lexer();
const ta = $('textarea')[0];
const code = sessionStorage.getItem('code');
if (code) {
  ta.value = code;
}

const cm = CodeMirror.fromTextArea(ta, {
  mode: 'text/x-basic',
});

cm.on('keydown', (cm, event) => {
  if (event.key === 'Enter') {
    const cursor = cm.getCursor();
    const line = cm.getLine(cursor.line);

    if (line.trim() === '') {
      return;
    }

    const data = lexer.line(line);

    try {
      const processedLine = bas2txtLines(data.basic).trim();

      // first remove the line
      cm.replaceRange(
        '',
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: line.length }
      );

      // then add it back
      cm.replaceRange(
        processedLine,
        { line: cursor.line, ch: 0 },
        { line: cursor.line, ch: processedLine.length }
      );
      // event.preventDefault();
    } catch (e) {
      console.error(e);
    }

    localSave();
  }
});

$('button').on('click', e => {
  const { action } = e.target.dataset;
  download(action);
});

function download(action) {
  const filename = prompt('Program name?', 'untitled');

  if (!filename || filename.trim().length === 0) {
    return;
  }

  const lines = [];
  let length = 0;
  cm.eachLine(({ text }) => {
    if (text.trim().length > 0) {
      const data = lexer.line(text);
      lines.push(data);
      length += data.basic.length;
    }
  });

  lines.sort((a, b) => {
    return a.lineNumber < b.lineNumber ? -1 : 1;
  });

  let offset = 0;
  const basic = new Uint8Array(length);
  lines.forEach(line => {
    basic.set(line.basic, offset);
    offset += line.basic.length;
  });

  const res = bas2txtLines(basic);
  cm.setValue(res);

  if (action === '3dos') {
    const file = new Uint8Array(length + 128);
    file.set(plus3DOSHeader(file)); // set the header (128)
    file.set(basic, 128);

    save(file, filename + '.bas');
  }

  if (action === 'tap') {
    const file = asTap(basic, filename);
    save(file, filename + '.tap');
  }

  if (action === 'wav') {
    const param1 = new DataView(basic.buffer).getUint16(0, false); // ?
    const res = generateBlock({
      type: 'PROGRAM',
      ctx: new window.AudioContext(),
      data: basic,
      param1,
      filename,
    });

    const wav = createWavFromBuffer(res.getChannelData(0), 44100);

    const bufferLists = [];
    while (!wav.eof()) {
      bufferLists.push(wav.getBuffer(1000));
    }

    save(bufferLists, filename + '.wav');
  }
}

CodeMirror.commands.save = () => download('tap');

dnd(document.body, file => {
  if (file[0] === 0x50) {
    cm.setValue(bas2txt(file));
  } else {
    cm.setValue(decode(file));
  }
  localSave();
});
