if (!DataView.prototype.getUint64)
  DataView.prototype.getUint64 = function(byteOffset, littleEndian) {
    // split 64-bit number into two 32-bit (4-byte) parts
    const left = this.getUint32(byteOffset, littleEndian);
    const right = this.getUint32(byteOffset + 4, littleEndian);

    // combine the two 32-bit values
    const combined = littleEndian
      ? left + 2 ** 32 * right
      : 2 ** 32 * left + right;

    if (!Number.isSafeInteger(combined))
      console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

    return combined;
  };

if (!DataView.prototype.getUint64)
  DataView.prototype.getInt64 = function(byteOffset, littleEndian) {
    // split 64-bit number into two 32-bit (4-byte) parts
    const left = this.getInt32(byteOffset, littleEndian);
    const right = this.getInt32(byteOffset + 4, littleEndian);

    // combine the two 32-bit values
    const combined = littleEndian
      ? left + 2 ** 32 * right
      : 2 ** 32 * left + right;

    if (!Number.isSafeInteger(combined))
      console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

    return combined;
  };
