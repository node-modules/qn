/*!
 * qn - lib/client.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>  (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var urllib = require('urllib');
var utils = require('./utils');

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

Qiniu.prototype._request = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {dataType: 'json'};
  }
  urllib.request(url, options, function (err, data, res) {
    err = utils.handleResponse(err, data, res);
    if (err) {
      return callback(err, data, res);
    }
    
    callback(null, data, res);
  });
};

['./up', './rs', './image', './other'].forEach(function (name) {
  var proto = require(name);
  for (var k in proto) {
    Qiniu.prototype[k] = proto[k];
  }
});

module.exports = Qiniu;
