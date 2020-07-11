import dnd from '../lib/dnd.js';
import { $ } from '../lib/$.js';
import CodeMirror from '../lib/cm.js';
import {
  line2bas,
  file2txt,
  line2txt,
  file2bas,
  formatText,
  statements,
} from 'txt2bas';
import './basic-syntax.js';
import save from '../lib/save.js';
import { decode } from '../lib/unpack/lib.js';
import { generateBlock } from '../lib/audio/index.js';
import { createWavFromBuffer } from '../lib/audio/make-wav.js';
import { load } from '../lib/load-basic.js';

function localSave() {
  sessionStorage.setItem('code', cm.getValue());
}

const ta = $('textarea')[0];
const code = sessionStorage.getItem('code');
if (code) {
  ta.value = code;
}

const cm = CodeMirror.fromTextArea(ta, {
  mode: 'text/x-basic',
  lineWrapping: true,
  viewportMargin: Infinity,
  styleActiveLine: true,
  autoCloseBrackets: true,
  lint: true,
});

cm.getWrapperElement().addEventListener('click', (e) => {
  if (e.altKey) {
    let onToken = e.target.classList.contains('cm-goto');

    if (onToken) {
      const fnSearch = e.target.classList.contains('cm-goto-fn');
      let needle = e.target.innerText.trim();

      const seed = needle;
      if (fnSearch) {
        needle = 'DEFPROC ' + needle + '(';
      } else {
        if (needle.startsWith('%')) {
          needle = needle.substring(1);
        }
        needle += ' ';
      }

      let target = null;
      cm.eachLine((line) => {
        const { text } = line;
        if (fnSearch) {
          if (text.includes(needle)) target = cm.getLineNumber(line);
        } else if (text.startsWith(needle)) {
          target = cm.getLineNumber(line);
        }
      });

      if (target !== null) {
        cm.setCursor({ line: target, ch: needle.toString().length });
      } else {
        console.log(`No ${fnSearch ? 'function' : 'line'} matching ${seed}`);
      }
    }
  }
});

cm.on('keydown', (cm, event) => {
  if (event.altKey) {
    document.body.classList.add('goto');
  } else {
    document.body.classList.remove('goto');
  }
  if (event.key === 'Enter') {
    const cursor = cm.getCursor();
    const currentLine = cursor.line;
    const line = cm.getLine(currentLine);

    if (line.trim() === '' || cursor.ch === 0) {
      return;
    }

    const autoline = cm
      .getValue()
      .split('\n')
      .find((_) => _.startsWith('#autoline'));

    const newLine = line2bas(line, autoline ? 10 : null);

    if (autoline) {
      const newLineText = formatText(line, autoline);

      cm.replaceRange(
        newLineText,
        { line: currentLine, ch: 0 },
        { line: currentLine }
      );
      localSave();
      return;
    }

    try {
      const s = statements(cm.getValue(), { keepDirectives: true });
      const newLineText = formatText(line, autoline);

      const scroll = cm.getScrollerElement().scrollTop;

      let content = '\n';
      if (event.shiftKey) {
        const lineNumber = newLine.lineNumber;
        const index = s.findIndex((_) => _.lineNumber === lineNumber);
        const next =
          index + 1 > s.length ? lineNumber + 10 : s[index + 1].lineNumber;

        let d = lineNumber + (((next - lineNumber) / 2) | 0);
        if ((d !== next) & (d !== lineNumber)) {
          if (d - lineNumber > 10) d = lineNumber + 10;
          content = `${d}  `;
          cm.replaceRange('\n', { line: currentLine + 1, ch: 0 });
        }
      }

      cm.replaceRange(
        newLineText,
        { line: currentLine, ch: 0 },
        { line: currentLine }
      );

      cm.replaceRange(content, {
        line: currentLine + 1,
        ch: content.length - 1,
      });
      cm.setCursor({
        line: currentLine + 1,
        ch: content.length - 1,
      });

      // microtick to put the scrollbar back
      Promise.resolve(0).then(() => {
        cm.getScrollerElement().scrollTop = scroll;
      });

      event.preventDefault();
    } catch (e) {
      console.error(e);
    }

    localSave();
  }
});

$('button').on('click', (e) => {
  const { action } = e.target.dataset;
  download(action);
});

function download(action) {
  const filename = prompt('Program name?', 'untitled');

  if (!filename || filename.trim().length === 0) {
    return;
  }

  if (action === 'wav') {
    const basic = file2bas(cm.getValue(), action, filename, false);
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
    cm.setValue(line2txt(basic));
  } else if (action === 'bank') {
    const file = file2bas(cm.getValue(), { bank: true });
    save(file, filename + '.bank');
  } else {
    let file = file2bas(cm.getValue(), action, filename);
    save(file, filename + (action === '3dos' ? '.bas' : '.tap'));
    // cm.setValue(file2txt(file));
  }
}

CodeMirror.commands.save = () => download('3dos');

dnd(document.body, (file) => {
  if (file[0] === 0x13) {
    cm.setValue(file2txt(file, 'tap'));
  } else if (file[0] === 0x50) {
    cm.setValue(file2txt(file, '3dos'));
  } else {
    cm.setValue(decode(file));
  }
  localSave();
});

if (window.location.search) {
  load().then((file) => {
    if (file) {
      const chr1 = file[0];

      if (chr1 === 0x13) {
        cm.setValue(file2txt(file, 'tap'));
      } else if (chr1 === 0x50) {
        cm.setValue(file2txt(file, '3dos'));
      } else {
        cm.setValue(decode(file));
      }
    }
  });
}
