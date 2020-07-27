/**
 * @param {string} s string to encode
 * @returns {Uint8Array}
 */
export const encode = (s) => new TextEncoder().encode(s);

/**
 * @param {Uint8Array} data data to decode
 * @returns {string}
 */
export const decode = (data) => new TextDecoder().decode(data);
