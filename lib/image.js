/*!
 * qn - lib/image.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utility = require('utility');

exports._getInfo = function (name, key, callback) {
  var url = this.resourceURL(key) + '?' + name;
  this._request(url, callback);
};

/**
 * Get Image base infomation.
 * @param {String} key
 * @param {Function(err, info)} callback
 *  - {Object} info
 *   - {String} format "png", "jpeg", "gif", "bmp", etc.
 *   - {String} colorModel "palette16", "ycbcr", etc.
 *   - {Number} width
 *   - {Number} height
 */
exports.imageInfo = function (key, callback) {
  this._getInfo('imageInfo', key, callback);
};

exports.exif = function (key, callback) {
  this._getInfo('exif', key, callback);
};

/**
 * 生成指定规格的缩略图
 * 
 * @param {String} key
 * @param {Object} options thumbnail options.
 *  - {Number} mode
 *      <mode>=1  表示限定目标缩略图的宽度和高度，放大并从缩略图中央处裁剪为指定 <Width>x<Height> 大小的图片。
 *      <mode>=2  指定 <Width> 和 <Height>，表示限定目标缩略图的长和宽，将缩略图的大小限定在指定的宽高矩形内。
 *      <mode>=2  指定 <Width> 但不指定 <Height>，表示限定目标缩略图的宽度，高度等比缩略自适应。
 *      <mode>=2  指定 <Height> 但不指定 <Width>，表示限定目标缩略图的高度，宽度等比缩略自适应。
 *  - {Number} width
 *  - {Number} height
 *  - {Number} [quality]
 *  - {String} [format] 指定目标缩略图的输出格式，取值范围：jpg, gif, png, webp 等图片格式
 * @return {String} thumbnail url
 */
exports.imageView = function (key, options) {
  var url = this.resourceURL(key) + '?imageView/' + options.mode;
  if (options.width) {
    url += '/w/' + options.width;
  }
  if (options.height) {
    url += '/h/' + options.height;
  }
  if (options.quality) {
    url += '/q/' + options.quality;
  }
  if (options.format) {
    url += '/format/' + options.format;
  }
  return url;
};

/**
 * 高级图像处理接口（第二版）（缩略、裁剪、旋转、转化）
 * 除了能够方便的生成图像缩略图之外，七牛云存储提供了其它高级图像处理接口，包含缩略、裁剪、旋转等一系列的功能.
 * 
 * @param {String} key
 * @param {Object} options
 *  - {String} [thumbnail] 缩略图大小，详解见下。
 *  - {String} [gravity] 位置偏移，只会使其后的裁剪偏移({offset})受到影响。默认值为 NorthWest（左上角）。
 *      可选值：NorthWest, North, NorthEast, West, Center, East, SouthWest, South, SouthEast 。
 *  - {String} [crop] 裁剪大小和偏移，详解见下。
 *  - {Number} [quality] 图片质量，取值范围是[1, 100]。
 *  - {Number} [rotate] 旋转角度。
 *  - {String} [format] 输出格式，可选为jpg, gif, png, bmp, tiff, webp等。
 * @return {String}
 */
exports.imageMogr = function (key, options) {
  var url = this.resourceURL(key) + '?imageMogr/v2/auto-orient';
  for (var k in options) {
    url += '/' + k + '/' + options[k];
  }
  return url;
};

/**
 * 图像水印接口支持两种加水印的方式:图片水印和文字水印。
 * 
 * @param {String} key
 * @param {Object} options
 *  - {Number} mode 
 *  <Mode> = 1 时，表示图片水印：
 *   - {String} image 水印图片，使用图片水印时需指定用于水印的远程图片URL。EncodedImageURL = urlsafe_base64_encode(ImageURL)
 *  <Mode> = 2 时，表示文字水印：
 *   - {String} text 水印文本，文字水印时必须。EncodedText = urlsafe_base64_encode(Text)
 *   - {String} [font] 字体名，若水印文本为非英文字符（比如中文）构成，则必须。EncodedFontName = urlsafe_base64_encode(FontName)
 *   - {Number} [fontsize] 字体大小，0 表示默认，单位: 缇，等于 1⁄20 磅。
 *   - {String} [fill] 字体颜色。EncodedTextColor = urlsafe_base64_encode(TextColor)。
 *       RGB格式，可以是颜色名称（比如 red）或十六进制（比如 #FF0000），
 *       参考 [RGB颜色编码表](http://www.rapidtables.com/web/color/RGB_Color.htm)
 *  - {Number} [dissolve] 透明度，取值范围 1-100，默认值 100，即表示 100%（不透明）。
 *  - {String} [gravity] 位置，默认值为 SouthEast（右下角）。
 *      可选值：NorthWest, North, NorthEast, West, Center, East, SouthWest, South, SouthEast 。
 *  - {Number} [dx] 横向边距，单位：像素（px），默认值为 10。
 *  - {Number} [dy] 纵向边距，单位：像素（px），默认值为 10。
 * @return {String}
 */
exports.watermark = function (key, options) {
  var mode = Number(options.mode) || 1;
  var url = this.resourceURL(key) + '?watermark/' + mode;
  if (mode === 1) {
    url += '/image/' + utility.base64encode(options.image, true);
  } else {
    url += '/text/' + utility.base64encode(options.text, true);
    if (options.font) {
      url += '/font/' + utility.base64encode(options.font, true);
    }
    if (options.fontsize) {
      url += '/fontsize/' + options.fontsize;
    }
    if (options.fill) {
      url += '/fill/' + utility.base64encode(options.fill, true);
    }
  }

  var names = ['dissolve', 'gravity', 'dx', 'dy'];
  for (var i = 0; i < names.length; i++) {
    var name = names[i];
    if (options[name] !== undefined) {
      url += '/' + name + '/' + options[name];
    }
  }

  return url;
};
