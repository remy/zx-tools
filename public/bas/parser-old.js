const isNum = x => x >= 48 && x <= 57;

export default function parseLine(line) {
  let chr = null;
  const chrs = line.split('');

  let res = '';

  let hasLineNumber = false;

  while ((chr = chrs.shift())) {
    const chrX = chr.charCodeAt(0);
    if (!hasLineNumber && chr === ' ') {
      continue;
    }

    if (isNum(chrX)) {
      res += chr;
      hasLineNumber = true;
      continue;
    }
  }

  return res;
}
