const toBinary = (n, size = 8) => {
  return n.toString(2).padStart(size, 0);
};

export function draw(data) {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.canvas.width = 8;
  ctx.canvas.height = 8;

  const imageData = ctx.getImageData(0, 0, 8, 8);
  imageData.data.fill(255);
  for (let i = 0; i < 8; i++) {
    const binary = toBinary(data[i]).split('');
    for (let j = 0; j < 8; j++) {
      if (binary[j] === '1') {
        const index = (i * 8 + j) * 4;
        imageData.data[index] = imageData.data[index + 1] = imageData.data[
          index + 2
        ] = 0;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);

  return ctx.canvas;
}

export function drawChr(i, data) {
  const chr = data.slice(i * 8, i * 8 + 8);
  return draw(chr);
}

export function string({ str, data, node }) {
  str.split('').forEach((c) => {
    const i = c.charCodeAt(0) - 32;
    node.appendChild(drawChr(i, data));
  });
}

export function charset(data) {
  const res = [];
  for (let i = 0; i < data.length / 8; i++) {
    const chr = data.slice(i * 8, i * 8 + 8);
    if (chr.length === 8) res.push(draw(chr));
  }

  return res;
}
