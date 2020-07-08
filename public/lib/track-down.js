const noop = () => {};

/**
 * Track mouse movement and down
 * @param {Element} element Track events on this node
 * @param {Object} options
 * @param {Function} options.handler Default handler for when user clicks, touches or moves the mouse whilst in a mousedown state
 * @param {Function} [options.move] Fired when mouse is moved in a mouseup state
 * @param {Function} [options.start] Fire when the mouse goes does
 * @param {Function} [options.end] Fire when the mouse goes up
 * @returns {Function} Cancel function to manually set mousedown state to off
 */
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
