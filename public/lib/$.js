/**
 * Class representing array-like NodeCollection
 * @extends Array
 * @augments NodeList
 */
class NodeListArray extends Array {
  /**
   * Create a new ArrayNode
   * @constructor
   * @augments NodeList
   */
  constructor() {
    super();

    // allow setting any node property via proxy
    return new Proxy(this, {
      get(obj, prop) {
        const type = obj[0];

        if (type && prop in type) {
          return type[prop];
        }

        return obj[prop];
      },

      set(obj, prop, value) {
        const type = obj[0];

        if (type && prop in type) {
          return obj.filter((el) => (el[prop] = value));
        }

        const res = (this[prop] = value);
        return res;
      },
    });
  }

  /**
   * Bind event to the collection for a given event type
   * @param {String} event Event name
   * @param {Function} handler Event handler
   * @param {Object} options Standard addEventListener options
   */
  on(event, handler, options) {
    return this.filter((el) => el.addEventListener(event, handler, options));
  }

  /**
   * Trigger the given event on all attached handlers
   * @param {String} event
   * @param {*} data
   * @returns {Array} filtered result of dispatchEvent
   */
  emit(event, data) {
    const e = new Event(event, { data });
    return this.filter((el) => el.dispatchEvent(e));
  }
}

/**
 * Query the DOM for an array like collection of nodes
 * @param {String} selector CSS selector
 * @param {Element} [context=document] Query context
 * @returns {NodeListArray} New array-like node list
 */
export const $ = (selector, context = document) => {
  const res = context.querySelectorAll(selector);

  if (res.length === 0) {
    console.warn(`${selector} zero results`);
  }

  return NodeListArray.from(res);
};
