import CodeMirror from 'codemirror';
import { validateTxt } from 'txt2bas';

const parseError = (text) => {
  text = text.split('\n')[0];
  const matches = text.match(/^(.*?)(?: at: (\d+):(\d+))?#(\d+)/);
  if (!matches) {
    console.error(`Failed to parse "${text}"`);
    return null;
  }

  matches.shift(); // full match
  const message = matches.shift();
  const line = matches.pop();
  let start = 0;
  let end = null;
  if (matches.length) {
    start = matches.shift() || 0;
    end = matches.shift() || null;
  }

  return { message, start, end, line };
};

CodeMirror.registerHelper('lint', 'basic', function (text, _, cm) {
  const found = [];

  try {
    const res = validateTxt(text);
    res.forEach((error) => {
      const data = parseError(error);
      if (data) {
        let { line, start, end, message } = data;
        if (!end) {
          end = cm.getLine(line - 1).length;
        }
        found.push({
          from: CodeMirror.Pos(line - 1, start - 1),
          to: CodeMirror.Pos(line - 1, end - 1),
          message,
        });
      }
    });
  } catch (e) {
    // console.log('linting error', e);
  }

  return found;
});
