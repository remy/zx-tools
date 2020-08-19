const fn = (i, expect) => {
  const width = 32;
  const base = ((i / 16) | 0) * width;

  let res = base + (i % 16);

  const adjust = (i / 256) | 0; // ?

  [res, adjust]; // ?
  res -= 256 * 2 * adjust; // ?
  res += adjust * 16;

  if (res !== expect) throw new Error([i, res]);

  return res;
};

fn(0, 0); // ?
fn(1, 1); // ?
fn(15, 15); // ?
fn(16, 32); // ?
fn(31, 32 + 15); // ?
fn(256, 16); // ?
fn(257, 17); // ?
fn(256 * 2 + 1, 17); // ?
