class ArrayNode extends Array {
  constructor() {
    super();

    // allow setting any node property via proxy
    return new Proxy(this, {
      set(obj, prop, value) {
        const type = obj[0];

        if (type && prop in type) {
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

export const $ = (s, ctx = document) => {
  const res = ctx.querySelectorAll(s);

  if (res.length === 0) {
    console.warn(`${s} zero results`);
  }

  return ArrayNode.from(res);
};
