import debounce from 'lodash.debounce';

/**
 * @class
 */
export default class Hooks {
  /** @type {Function[]}*/
  hooks = [];

  /** @type {Function[]}*/
  originals = [];

  /**
   * Bind a new listen
   *
   * @param {Function} callback
   */
  hook(callback) {
    const debounced = debounce(callback, 50);
    const key = callback.toString();

    const exists = this.originals.findIndex((_) => _.toString() === key);

    if (exists !== -1) {
      this.hooks.splice(exists, 1);
      this.originals.splice(exists, 1);
    }

    this.hooks.push(debounced);
    this.originals.push(callback);
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
