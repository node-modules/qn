/*!
 * qn - lib/client.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>  (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

function Qiniu(options) {
  if (!options || !options.accessKey || !options.secretKey || !options.bucket) {
    throw new TypeError('required accessKey, secretKey and bucket');
  }

  options.domain = options.domain || null;
  options.timeout = options.timeout || 36000000;
  this.options = options;
  this._uploadURL = 'http://up.qiniu.com/';

  this._baseURL = options.domain || 'http://' + options.bucket + '.qiniudn.com';
  if (this._baseURL[this._baseURL.length - 1] !== '/') {
    this._baseURL += '/';
  }
  this._rsURL = 'http://rs.qbox.me';
}

Qiniu.create = function create(options) {
  return new Qiniu(options);
};

Qiniu.prototype.resourceURL = function (key) {
  if (!key) {
    return;
  }

  return this._baseURL + key;
};

['./up', './rs', './other'].forEach(function (name) {
  var proto = require(name);
  for (var k in proto) {
    Qiniu.prototype[k] = proto[k];
  }
});

module.exports = Qiniu;
