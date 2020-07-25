/**
 * Standard DOM event handler
 * @callback eventHandler
 * @param {Event} event
 */

const noop = () => {};

/**
 * Track mouse movement and down
 *
 * @param {Element} element Track events on this node
 * @param {Object} options
 * @param {eventHandler} options.handler Default handler for when user clicks, touches or moves the mouse whilst in a mousedown state
 * @param {eventHandler} [options.move] Fired when mouse is moved in a mouseup state
 * @param {eventHandler} [options.start] Fire when the mouse goes does
 * @param {eventHandler} [options.end] Fire when the mouse goes up
 * @param {eventHandler} [options.out] Fire when the mouse goes up
 * @returns {Function} Cancel function to manually set mousedown state to off
 */
export default function trackDown(
  element,
  { handler = noop, move = noop, start = noop, end = noop, out = noop }
) {
  let down = false;

  element.addEventListener('mouseout', (e) => {
    if (e.target === element) {
      down = false;
      out(e);
    }
  });

  element.addEventListener('click', handler);

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

  element.addEventListener('touchstart', downHandler, true);
  element.addEventListener('mousedown', downHandler, true);
  document.documentElement.addEventListener('mouseup', upHandler, true);
  document.documentElement.addEventListener('touchend', upHandler, true);
  element.addEventListener('mousemove', moveHandler, true);
  element.addEventListener('touchmove', moveHandler, true);

  return () => {
    down = false;
  };
}
