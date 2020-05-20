export default class Hooks {
  hooks = [];

  hook(callback) {
    const exists = this.hooks.findIndex(
      (_) => _.toString() === callback.toString()
    );

    if (exists !== -1) {
      console.log('removing existing hook callback');
      this.hooks.splice(exists, 1);
    }

    this.hooks.push(callback);
  }

  trigger() {
    this.hooks.forEach((callback) => callback());
  }
}
