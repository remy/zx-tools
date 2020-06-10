import matrices from './matrices.js';

const colorMap = [
  [0, 0, 0xff],
  [0xff, 0, 0],
  [0xff, 0, 0xff],
  [0, 0xff, 0],
  [0, 0xff, 0xff],
  [0xff, 0xff, 0],
  [0xff, 0xff, 0xff],
  [0, 0, 0],
  [0, 0, 0xd7],
  [0xd7, 0, 0],
  [0xd7, 0, 0xd7],
  [0, 0xd7, 0],
  [0, 0xd7, 0xd7],
  [0xd7, 0xd7, 0],
  [0xd7, 0xd7, 0xd7],
];

function getDistance(current, match) {
  const redDifference = current[0] - match[0];
  const greenDifference = current[1] - match[1];
  const blueDifference = current[2] - match[2];

  return (
    redDifference * redDifference +
    greenDifference * greenDifference +
    blueDifference * blueDifference
  );
}

// feels expensive, but https://www.cyotek.com/blog/finding-nearest-colors-using-euclidean-distance
function defaultFindColor(rgb) {
  let shortestDistance;
  let index;

  index = -1;
  shortestDistance = Number.MAX_SAFE_INTEGER;

  for (let i = 0; i < colorMap.length; i++) {
    const match = colorMap[i];
    const distance = getDistance(rgb, match);

    if (distance < shortestDistance) {
      index = i;
      shortestDistance = distance;
    }
  }

  return [...colorMap[index], 255];
}

const defaults = {
  step: 4,
  channels: 4,
  diffusionFactor: 0.9,
  clip: () => {},
  findColor: defaultFindColor,
  matrix: matrices.floydSteinberg,
};

export default class Dither {
  constructor(options) {
    this.options = { ...defaults, ...options };
  }

  static get defaultFindColor() {
    return defaultFindColor;
  }

  static get matrices() {
    return matrices;
  }

  dither(buffer, width, settings = {}) {
    let i, k, ref, x, y;
    const options = { ...this.options, ...settings };

    const d = [];
    for (
      i = k = 0, ref = buffer.length;
      0 <= ref ? k <= ref : k >= ref;
      i = 0 <= ref ? ++k : --k
    ) {
      d.push(buffer[i]);
    }
    const height = buffer.length / (options.channels * width);
    const result = [];
    y = 0;
    while (y < height) {
      x = 0;
      while (x < width) {
        this.handlePixel(x, y, d, result, width, options);
        x += options.step;
      }
      y += options.step;
    }
    return result;
  }

  calculateIndex(x, y, width, channels) {
    return channels * x + channels * y * width;
  }

  handlePixel(x, y, d, result, width, options) {
    var currentColor, i, j, k, l, newColor, q, ref, ref1;
    i = this.calculateIndex(x, y, width, options.channels);
    currentColor = [];
    for (
      j = k = 0, ref = options.channels;
      0 <= ref ? k < ref : k > ref;
      j = 0 <= ref ? ++k : --k
    ) {
      currentColor.push(d[i + j]);
    }
    newColor = options.findColor(currentColor);
    q = [];
    for (
      j = l = 0, ref1 = options.channels;
      0 <= ref1 ? l < ref1 : l > ref1;
      j = 0 <= ref1 ? ++l : --l
    ) {
      q[j] = (d[i + j] - newColor[j]) * options.diffusionFactor;
    }
    this.diffuseError(d, q, x, y, width, options);
    return this.applyNewColor(result, width, newColor, i, options);
  }

  diffuseError(d, q, x, y, width, options) {
    var channelOffset, entry, index, k, l, len, ref, ref1, results;
    ref = options.matrix;
    results = [];
    for (k = 0, len = ref.length; k < len; k++) {
      entry = ref[k];
      index = this.calculateIndex(
        x + options.step * entry.x,
        y + options.step * entry.y,
        width,
        options.channels
      );
      for (
        channelOffset = l = 0, ref1 = options.channels;
        0 <= ref1 ? l < ref1 : l > ref1;
        channelOffset = 0 <= ref1 ? ++l : --l
      ) {
        d[index + channelOffset] += entry.factor * q[channelOffset];
      }
      results.push(options.clip(d, index));
    }
    return results;
  }

  applyNewColor(buffer, width, newColor, i, options) {
    var di, dx, dy, j, k, ref, results;
    results = [];
    for (
      dx = k = 0, ref = options.step;
      0 <= ref ? k < ref : k > ref;
      dx = 0 <= ref ? ++k : --k
    ) {
      results.push(
        (function() {
          var l, ref1, results1;
          results1 = [];
          for (
            dy = l = 0, ref1 = options.step;
            0 <= ref1 ? l < ref1 : l > ref1;
            dy = 0 <= ref1 ? ++l : --l
          ) {
            di = i + options.channels * dx + options.channels * width * dy;
            results1.push(
              (function() {
                var m, ref2, results2;
                results2 = [];
                for (
                  j = m = 0, ref2 = options.channels;
                  0 <= ref2 ? m < ref2 : m > ref2;
                  j = 0 <= ref2 ? ++m : --m
                ) {
                  results2.push((buffer[di + j] = newColor[j]));
                }
                return results2;
              })()
            );
          }
          return results1;
        })()
      );
    }
    return results;
  }
}
