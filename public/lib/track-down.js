const noop = () => {};

export default function trackDown(
  el,
  { handler = noop, move = noop, start = noop, end = noop }
) {
  let down = false;

  el.addEventListener('mouseout', () => (down = false));
  el.addEventListener('click', handler);

  const downHandler = (e) => {
    down = true;
    start(e);
  };

  const upHandler = (e) => {
    down = false;
    end(e);
  };

  const moveHandler = (e) => {
    if (down) {
      handler(e);
    } else {
      move(e);
    }
  };

  el.addEventListener('touchstart', downHandler, true);
  el.addEventListener('mousedown', downHandler, true);
  el.addEventListener('mouseup', upHandler, true);
  el.addEventListener('touchend', upHandler, true);
  el.addEventListener('mousemove', moveHandler, true);
  el.addEventListener('touchmove', moveHandler, true);

  return () => {
    down = false;
  };
}
