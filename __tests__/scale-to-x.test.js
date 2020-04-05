import { test } from 'tap';

function scale(res, zoom = 0) {
  return Math.abs(res - ((0xff >> (zoom + 3)) << 3));
}

test('x: 16', (t) => {
  t.same(scale(232, 0), 16);
  t.same(scale(104, 1), 16);
  t.same(scale(8, 4), 0);
  t.same(scale(248, 0), 0);

  t.same(scale(208, 0), 40);
  t.same(scale(80, 1), 40);
  t.same(scale(16, 2), 40);
  t.same(scale(-16, 3), 40);
  t.same(scale(-32, 4), 40);

  t.end();
});
