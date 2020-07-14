import { Unpack } from '@remy/unpack';

export default function fontMetrics(data) {
  const unpack = new Unpack(data);

  const header = unpack.parse(
    `c4$sig
    S$tableCount
    S$range
    S$selector
    S$shift`,
    data
  );

  const tables = [];
  for (let i = 0; i < header.tableCount; i++) {
    tables.push(unpack.parse(`>a4$tag I$checksum I$offset I$length`));
  }

  const result = {
    emSquare: null,
    capitalHeight: null,
    descender: null,
    ascender: null,
    lineGap: null,
  };

  for (let i = 0; i < tables.length; i++) {
    const { tag, offset } = tables[i];
    unpack.offset = offset;

    if (tag === 'hhea') {
      const res = unpack.parse('>i$version s$ascent s$descent s$lineGap');
      result.descender = Math.abs(res.descent) / 1000;
      result.ascender = Math.abs(res.ascent) / 1000;
      result.lineGap = res.lineGap;
    }
    if (tag === 'head') {
      const res = unpack.parse(
        '>i$version i$rev I$checksum I$magic S$flags S$unitsPerEm'
      );
      result.emSquare = res.unitsPerEm / 1000;
    }

    if (tag === 'OS/2') {
      const res = unpack.parse(
        '>x32 c10$panose I4$ulCharRange a4$vendorId SSS s$typoAscent s$typoDescent s$typoLineGap S$winA S$winD I2$cp s$xHeight s$capHeight'
      );
      result.capitalHeight = res.capHeight / 1000;
    }
  }

  return result;
}

export function computeHeightFromMetrics(height, metrics) {
  // var lineHeightNormal = metrics.ascender + metrics.descender + metrics.lineGap;
  let distanceTop = metrics.ascender - metrics.capitalHeight;
  // let contentArea = lineHeightNormal * computedFontSize;
  let computedFontSize = height / metrics.capitalHeight;
  let vAlign = (metrics.descender - distanceTop) * computedFontSize;
  let computedLineHeight = height - vAlign;

  if (metrics.emSquare === metrics.ascender) {
    return { lineHeight: height, fontSize: height };
  }

  return { lineHeight: computedLineHeight, fontSize: computedFontSize };
}
