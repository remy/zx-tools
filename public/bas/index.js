import dnd from '../lib/dnd.js';
import { $ } from '../lib/$.js';
import Lexer, { header } from './txt2bas.js';
import CodeMirror from './lib/cm.js';
import { bas2txt, bas2txtLines } from './bas2txt.js';
import './basic-syntax.js';
import save from '../lib/save.js';
import { toHex } from '../lib/to.js';
import { decode } from '../lib/unpack/lib.js';

const lexer = new Lexer();
const ta = $('textarea')[0];
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
      console.log(processedLine);

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
  }
});

function download() {
  const filename = prompt('Filename?', 'untitled.bas');
  if (filename.trim().length > 0) {
    const lines = [];
    let length = 0;
    cm.eachLine(({ text }) => {
      if (text.trim().length > 0) {
        const data = lexer.line(text);
        lines.push(data.basic);
        length += data.basic.length;
      }
    });

    // console.log(length, lines);
    const file = new Uint8Array(length + 128);
    file.set(header(file)); // set the header (128)
    let offset = 128;
    lines.forEach(line => {
      file.set(line, offset);
      offset += line.length;
    });

    // save(file, filename);
    console.log(file);

    const res = bas2txt(file);
    console.log(res);
    cm.setValue(res);
    save(file, filename);
  }
}

$('button').on('click', download);

document.body.onkeydown = e => {
  if (e.key === 'S') {
    download();
    return;
  }
};

CodeMirror.commands.save = download;

dnd(document.body, file => {
  if (file[0] === 0x50) {
    cm.setValue(bas2txt(file));
  } else {
    cm.setValue(decode(file));
  }
});
