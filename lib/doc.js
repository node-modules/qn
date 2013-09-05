/*!
 * qn - lib/doc.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utility = require('utility');

/**
 * Markdown 转 HTML
 * 
 * @param {String} key
 * @param {Object} [options]
 *  - {Number} mode 0 表示转为完整的 HTML(head+body) 输出; 1 表示只转为HTML Body，缺省值：0
 *  - {String} css CSS 样式的URL
 * @return {String}
 */
exports.md2html = function (key, options) {
  var url = this.resourceURL(key) + '?md2html';
  options = options || {};
  if (options.mode) {
    url += '/' + options.mode;
  }
  if (options.css) {
    if (!options.mode) {
      url += '/0';
    }
    url += '/css/' + utility.base64encode(options.css, true);
  }
  return url;
};
