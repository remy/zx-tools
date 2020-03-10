class ArrayNode extends Array {
  constructor() {
    super();

    // allow setting any node property via proxy
    return new Proxy(this, {
      set(obj, prop, value) {
        if (prop in HTMLElement.prototype) {
          return obj.filter(el => (el[prop] = value));
        }

        const res = (this[prop] = value);
        return res;
      },
    });
  }

  on(event, handler, options) {
    return this.filter(el => el.addEventListener(event, handler, options));
  }

  emit(type, data) {
    const event = new Event(type, { data });
    return this.filter(el => el.dispatchEvent(event));
  }
}

export const $ = (s, ctx = document) => ArrayNode.from(ctx.querySelectorAll(s));
