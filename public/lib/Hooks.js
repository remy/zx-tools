export default class Hooks {
  hooks = [];

  /**
   * Bind a new listen
   *
   * @param {Function} callback
   */
  hook(callback) {
    const exists = this.hooks.findIndex(
      (_) => _.toString() === callback.toString()
    );

    if (exists !== -1) {
      this.hooks.splice(exists, 1);
    }

    this.hooks.push(callback);
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
