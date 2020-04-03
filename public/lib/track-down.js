const noop = () => {};

export default function trackDown(
  el,
  { handler = noop, move = noop, start = noop, end = noop }
) {
  let down = false;

  el.addEventListener('mouseout', () => (down = false));
  el.addEventListener('click', handler);
  el.addEventListener(
    'mousedown',
    e => {
      start(e);
      down = true;
    },
    true
  );
  el.addEventListener(
    'mouseup',
    e => {
      down = false;
      end(e);
    },
    true
  );
  el.addEventListener(
    'mousemove',
    e => {
      if (down) {
        handler(e);
      } else {
        move(e);
      }
    },
    true
  );

  return () => {
    down = false;
  };
}
