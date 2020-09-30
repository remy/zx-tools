import debounce from 'lodash.debounce';

/**
 * @class
 */
export default class Hooks {
  /** @type {Function[]}*/
  hooks = [];

  /**
   * Bind a new listen
   *
   * @param {Function} callback
   */
  hook(callback) {
    const debounced = debounce(callback, 50);
    const exists = this.hooks.findIndex(
      (_) => _.toString() === debounced.toString()
    );

    if (exists !== -1) {
      this.hooks.splice(exists, 1);
    }

    this.hooks.push(debounced);
  }

  /**
   * Trigger the linked hooks
   *
   * @param {any} args
   */
  trigger(...args) {
    this.hooks.forEach((callback) => callback(...args));
  }
}
