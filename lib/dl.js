/*!
 * qn - lib/dl.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utils = require('./utils');

exports.downloadToken = function (url) {
  return this.options.accessKey + ':' + utils.signData(this.options.secretKey, url);
};

exports.download = function (key, to, callback) {
  
};

exports.saveAsURL = function (key, name) {
  return this.resourceURL(key) + '?download/' + encodeURIComponent(name);
};
