import CodeMirror from 'codemirror';
import 'codemirror/addon/selection/active-line';
import 'codemirror/addon/edit/closebrackets';
import 'codemirror/addon/mode/simple';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/dialog/dialog';
import 'codemirror/addon/search/searchcursor';
import 'codemirror/addon/search/search';
import './next-basic-lint';
window.CodeMirror = CodeMirror;

export default CodeMirror;
