/**
 * @typedef {object} Event
 * @property {Function} bind
 * @property {Function} unbind
 * @property {Function} trigger
 */

/**
 * @returns {Event}
 */
export default function Event() {
  /** @type {Event} */
  var self = {};

  /** @type {Function[]} */
  var listeners = [];

  /**
   * @param {Function} callback
   */
  self.bind = function (callback) {
    listeners.push(callback);
  };

  /**
   * @param {Function} callback
   */
  self.unbind = function (callback) {
    for (var i = listeners.length - 1; i >= 0; i--) {
      if (listeners[i] == callback) listeners.splice(i, 1);
    }
  };

  /**
   * @returns {boolean} whether the event was triggered
   */
  self.trigger = function () {
    var args = arguments;
    /* event is considered 'cancelled' if any handler returned a value of false
      (specifically false, not just a falsy value). Exactly what this means is
      up to the caller - we just return false */
    var cancelled = false;
    for (var i = 0; i < listeners.length; i++) {
      cancelled = cancelled || listeners[i].apply(null, args) === false;
    }
    return !cancelled;
  };

  return self;
}
