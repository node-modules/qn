'use strict';

/**
 * QR Code
 * @param {String} key
 * @param {Number} [mode] 可选值0或1，缺省为0。0表示以当前url生成二维码，1表示以当前URL中的数据生成二维码。
 * @param {Number} [level] 冗余度，可选值 L、M、Q，或 H，缺省为 L
 * @return {String} qr code url
 */
exports.qrcode = function (key, mode, level) {
  var url = this.resourceURL(key) + '?qrcode';
  if (mode !== null && mode !== undefined) {
    mode = Number(mode) || 0;
    if (mode === 0 || mode === 1) {
      url += '/' + mode;
      if (level) {
        url += '/level/' + level;
      }
    }
  }
  return url;
};

// TODO: fop
