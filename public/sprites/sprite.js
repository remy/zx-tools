export default class Sprite {
  constructor(data, offset) {
    this.data = data.slice(offset, 256);
  }
}
