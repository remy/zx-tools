console.clear();

const p = 8;
const n = 5;

const pixels = Array.from({ length: p * 4 * n }, () =>
  Array.from({ length: p })
).flat();

console.log('-'.repeat(60));

const width = pixels.length / 4 / p;

/*
p1 = 0-3, 20-23, 40-43, 60-63
p2 = 4-7
*/

for (let i = 0; i < pixels.length; i += 4) {
  const row = ((i / 4 / p) | 0) % p;
  const offset = (i / 4) % p;
  const spriteIndex = (i / 4 / (p * p)) | 0;
  const dataIndex = (spriteIndex * p + row * width + offset) * 4;

  if (spriteIndex === 5) console.log({ dataIndex, row, offset, spriteIndex });
}
