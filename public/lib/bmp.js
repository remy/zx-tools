/**
 * @author shaozilee
 *
 * Bmp format decoder,support 1bit 4bit 8bit 24bit bmp
 *
 */

/*
// unpack
<a2$sig
I$size
I$reserved
I$offset
I$headerSize
I$width
I$height
S$planes
S$bitPP
I$compress
I$rawSize
I$hr
I$vr
I$colors
I$importantColors
*/

export default function BmpDecoder(buffer, is_with_alpha) {
  this.pos = 2;
  this.buffer = new DataView(buffer.buffer);
  this.is_with_alpha = !!is_with_alpha;
  this.bottom_up = true;
  this.flag = buffer.slice(0, 2);

  if (this.flag[0] !== 66 || this.flag[1] !== 77)
    throw new Error('Invalid BMP File');
  this.parseHeader();
  this.parseRGBA();
}

BmpDecoder.prototype.parseHeader = function () {
  this.fileSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.reserved = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.offset = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.headerSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.width = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.height = this.buffer.getInt32(this.pos, true);
  this.pos += 4;
  this.planes = this.buffer.getUint16(this.pos, true);
  this.pos += 2;
  this.bitPP = this.buffer.getUint16(this.pos, true);
  this.pos += 2;
  this.compress = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.rawSize = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.hr = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.vr = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.colors = this.buffer.getUint32(this.pos, true);
  this.pos += 4;
  this.importantColors = this.buffer.getUint32(this.pos, true);
  this.pos += 4;

  if (this.bitPP === 16 && this.is_with_alpha) {
    this.bitPP = 15;
  }
  if (this.bitPP < 15) {
    var len = this.colors === 0 ? 1 << this.bitPP : this.colors;
    this.palette = new Array(len);
    for (var i = 0; i < len; i++) {
      var blue = this.buffer.getUint8(this.pos++);
      var green = this.buffer.getUint8(this.pos++);
      var red = this.buffer.getUint8(this.pos++);
      var quad = this.buffer.getUint8(this.pos++);
      this.palette[i] = {
        red,
        green,
        blue,
        quad,
      };
    }
  }
  if (this.height < 0) {
    this.height *= -1;
    this.bottom_up = false;
  }
};

BmpDecoder.prototype.parseRGBA = function () {
  var bitn = 'bit' + this.bitPP;
  var len = this.width * this.height * 4;
  this.data = new ArrayBuffer(len);
  this[bitn]();
};

BmpDecoder.prototype.bit1 = function () {
  var xlen = Math.ceil(this.width / 8);
  var mode = xlen % 4;
  var y = this.height >= 0 ? this.height - 1 : -this.height;
  for (y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;
    for (var x = 0; x < xlen; x++) {
      var b = this.buffer.getUint8(this.pos++);
      var location = line * this.width * 4 + x * 8 * 4;
      for (var i = 0; i < 8; i++) {
        if (x * 8 + i < this.width) {
          var rgb = this.palette[(b >> (7 - i)) & 0x1];

          this.data[location + i * 4] = 0;
          this.data[location + i * 4 + 1] = rgb.blue;
          this.data[location + i * 4 + 2] = rgb.green;
          this.data[location + i * 4 + 3] = rgb.red;
        } else {
          break;
        }
      }
    }

    if (mode != 0) {
      this.pos += 4 - mode;
    }
  }
};

BmpDecoder.prototype.bit4 = function () {
  //RLE-4
  let i;
  if (this.compress == 2) {
    this.data.fill(0xff);

    var location = 0;
    var lines = this.bottom_up ? this.height - 1 : 0;
    var low_nibble = false; //for all count of pixel

    while (location < this.data.length) {
      var a = this.buffer.getUint8(this.pos++);
      var b = this.buffer.getUint8(this.pos++);
      //absolute mode
      if (a == 0) {
        if (b == 0) {
          //line end
          if (this.bottom_up) {
            lines--;
          } else {
            lines++;
          }
          location = lines * this.width * 4;
          low_nibble = false;
          continue;
        } else if (b == 1) {
          //image end
          break;
        } else if (b == 2) {
          //offset x,y
          var x = this.buffer.getUint8(this.pos++);
          var y = this.buffer.getUint8(this.pos++);
          if (this.bottom_up) {
            lines -= y;
          } else {
            lines += y;
          }

          location += y * this.width * 4 + x * 4;
        } else {
          var c = this.buffer.getUint8(this.pos++);
          for (i = 0; i < b; i++) {
            if (low_nibble) {
              this.setPixelData(c & 0x0f, location);
            } else {
              this.setPixelData((c & 0xf0) >> 4, location);
            }

            if (i & 1 && i + 1 < b) {
              c = this.buffer.getUint8(this.pos++);
            }

            low_nibble = !low_nibble;
          }

          if ((((b + 1) >> 1) & 1) == 1) {
            this.pos++;
          }
        }
      } else {
        //encoded mode
        for (i = 0; i < a; i++) {
          if (low_nibble) {
            this.setPixelData(b & 0x0f, location);
          } else {
            this.setPixelData((b & 0xf0) >> 4, location);
          }
          low_nibble = !low_nibble;
        }
      }
    }
  } else {
    var xlen = Math.ceil(this.width / 2);
    var mode = xlen % 4;
    let x, y, b, location;
    for (y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;
      for (x = 0; x < xlen; x++) {
        b = this.buffer.getUint8(this.pos++);
        location = line * this.width * 4 + x * 2 * 4;

        var before = b >> 4;
        var after = b & 0x0f;

        var rgb = this.palette[before];
        this.data[location] = 0;
        this.data[location + 1] = rgb.blue;
        this.data[location + 2] = rgb.green;
        this.data[location + 3] = rgb.red;

        if (x * 2 + 1 >= this.width) break;

        rgb = this.palette[after];

        this.data[location + 4] = 0;
        this.data[location + 4 + 1] = rgb.blue;
        this.data[location + 4 + 2] = rgb.green;
        this.data[location + 4 + 3] = rgb.red;
      }

      if (mode != 0) {
        this.pos += 4 - mode;
      }
    }
  }
};

BmpDecoder.prototype.setPixelData = function (rgbIndex, location) {
  var rgb = this.palette[rgbIndex];
  this.data[location] = 0;
  this.data[location + 1] = rgb.blue;
  this.data[location + 2] = rgb.green;
  this.data[location + 3] = rgb.red;
  location += 4;
  return location;
};

BmpDecoder.prototype.bit8 = function () {
  //RLE-8
  if (this.compress == 1) {
    this.data.fill(0xff);

    let i;

    var location = 0;
    var lines = this.bottom_up ? this.height - 1 : 0;

    while (location < this.data.length) {
      var a = this.buffer.getUint8(this.pos++);
      var b = this.buffer.getUint8(this.pos++);
      //absolute mode
      if (a == 0) {
        if (b == 0) {
          //line end
          if (this.bottom_up) {
            lines--;
          } else {
            lines++;
          }
          location = lines * this.width * 4;
          continue;
        } else if (b == 1) {
          //image end
          break;
        } else if (b == 2) {
          //offset x,y
          var x = this.buffer.getUint8(this.pos++);
          var y = this.buffer.getUint8(this.pos++);
          if (this.bottom_up) {
            lines -= y;
          } else {
            lines += y;
          }

          location += y * this.width * 4 + x * 4;
        } else {
          for (i = 0; i < b; i++) {
            var c = this.buffer.getUint8(this.pos++);
            this.setPixelData(c, location);
          }
          if (b & (1 == 1)) {
            this.pos++;
          }
        }
      } else {
        //encoded mode
        for (i = 0; i < a; i++) {
          this.setPixelData(b, location);
        }
      }
    }
  } else {
    var mode = this.width % 4;
    let x, y, b, location;
    for (y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;
      for (x = 0; x < this.width; x++) {
        b = this.buffer.getUint8(this.pos++);
        location = line * this.width * 4 + x * 4;
        if (b < this.palette.length) {
          var rgb = this.palette[b];

          this.data[location] = 0;
          this.data[location + 1] = rgb.blue;
          this.data[location + 2] = rgb.green;
          this.data[location + 3] = rgb.red;
        } else {
          this.data[location] = 0;
          this.data[location + 1] = 0xff;
          this.data[location + 2] = 0xff;
          this.data[location + 3] = 0xff;
        }
      }
      if (mode != 0) {
        this.pos += 4 - mode;
      }
    }
  }
};

BmpDecoder.prototype.bit15 = function () {
  var dif_w = this.width % 3;
  var _11111 = parseInt('11111', 2),
    _1_5 = _11111;
  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;
    for (var x = 0; x < this.width; x++) {
      var B = this.buffer.getUint16(this.pos, true);
      this.pos += 2;
      var blue = (((B & _1_5) / _1_5) * 255) | 0;
      var green = ((((B >> 5) & _1_5) / _1_5) * 255) | 0;
      var red = ((((B >> 10) & _1_5) / _1_5) * 255) | 0;
      var alpha = B >> 15 ? 0xff : 0x00;

      var location = line * this.width * 4 + x * 4;

      this.data[location] = alpha;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    }
    //skip extra bytes
    this.pos += dif_w;
  }
};

BmpDecoder.prototype.bit16 = function () {
  var dif_w = (this.width % 2) * 2;
  //default xrgb555
  this.maskRed = 0x7c00;
  this.maskGreen = 0x3e0;
  this.maskBlue = 0x1f;
  this.mask0 = 0;

  if (this.compress == 3) {
    this.maskRed = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskGreen = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskBlue = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.mask0 = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
  }

  var ns = [0, 0, 0];
  for (var i = 0; i < 16; i++) {
    if ((this.maskRed >> i) & 0x01) ns[0]++;
    if ((this.maskGreen >> i) & 0x01) ns[1]++;
    if ((this.maskBlue >> i) & 0x01) ns[2]++;
  }
  ns[1] += ns[0];
  ns[2] += ns[1];
  ns[0] = 8 - ns[0];
  ns[1] -= 8;
  ns[2] -= 8;

  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;
    for (var x = 0; x < this.width; x++) {
      var B = this.buffer.getUint16(this.pos, true);
      this.pos += 2;

      var blue = (B & this.maskBlue) << ns[0];
      var green = (B & this.maskGreen) >> ns[1];
      var red = (B & this.maskRed) >> ns[2];

      var location = line * this.width * 4 + x * 4;

      this.data[location] = 0;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    }
    //skip extra bytes
    this.pos += dif_w;
  }
};

BmpDecoder.prototype.bit24 = function () {
  for (var y = this.height - 1; y >= 0; y--) {
    var line = this.bottom_up ? y : this.height - 1 - y;
    for (var x = 0; x < this.width; x++) {
      //Little Endian rgb
      var blue = this.buffer.getUint8(this.pos++);
      var green = this.buffer.getUint8(this.pos++);
      var red = this.buffer.getUint8(this.pos++);
      var location = line * this.width * 4 + x * 4;
      this.data[location] = 0;
      this.data[location + 1] = blue;
      this.data[location + 2] = green;
      this.data[location + 3] = red;
    }
    //skip extra bytes
    this.pos += this.width % 4;
  }
};

/**
 * add 32bit decode func
 * @author soubok
 */
BmpDecoder.prototype.bit32 = function () {
  //BI_BITFIELDS
  if (this.compress == 3) {
    this.maskRed = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskGreen = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.maskBlue = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    this.mask0 = this.buffer.getUint32(this.pos, true);
    this.pos += 4;
    for (var y = this.height - 1; y >= 0; y--) {
      var line = this.bottom_up ? y : this.height - 1 - y;
      for (var x = 0; x < this.width; x++) {
        //Little Endian rgba
        var alpha = this.buffer.getUint8(this.pos++);
        var blue = this.buffer.getUint8(this.pos++);
        var green = this.buffer.getUint8(this.pos++);
        var red = this.buffer.getUint8(this.pos++);
        var location = line * this.width * 4 + x * 4;
        this.data[location] = alpha;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
    }
  } else {
    let x, y, line, blue, green, red, alpha, location;
    for (y = this.height - 1; y >= 0; y--) {
      line = this.bottom_up ? y : this.height - 1 - y;
      for (x = 0; x < this.width; x++) {
        //Little Endian argb
        blue = this.buffer.getUint8(this.pos++);
        green = this.buffer.getUint8(this.pos++);
        red = this.buffer.getUint8(this.pos++);
        alpha = this.buffer.getUint8(this.pos++);
        location = line * this.width * 4 + x * 4;
        this.data[location] = alpha;
        this.data[location + 1] = blue;
        this.data[location + 2] = green;
        this.data[location + 3] = red;
      }
    }
  }
};

BmpDecoder.prototype.getData = function () {
  return this.data;
};
