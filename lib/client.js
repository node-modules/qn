/*!
 * qn - lib/client.js
 *
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>  (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var urllib = require('urllib');
var utility = require('utility');
var Agent = require('agentkeepalive');
var utils = require('./utils');

var keepaliveAgent = new Agent({
  maxSockets: 100,
  maxFreeSockets: 10,
  keepAliveTimeout: 30000 // free socket keepalive for 30 seconds
});

var DEFAULT_TIMEOUT = 36000000;

function Qiniu(options) {
  if (!options || !options.accessKey || !options.secretKey || !options.bucket) {
    throw new TypeError('required accessKey, secretKey and bucket');
  }

  if (options.domain) {
    console.error('`qn` package: options.domain deprecated, use options.origin instead');
    options.origin = options.domain;
  }

  options.origin = options.origin || null;
  options.timeout = options.timeout || DEFAULT_TIMEOUT;
  options.downloadTimeout = options.downloadTimeout || DEFAULT_TIMEOUT;
  this.options = options;
  this._uploadURL = options.uploadURL || 'http://up.qiniu.com/';

  this._baseURL = options.origin || 'http://' + options.bucket + '.qiniudn.com';
  if (this._baseURL[this._baseURL.length - 1] !== '/') {
    this._baseURL += '/';
  }
  this._rsURL = 'http://rs.qbox.me';
}

Qiniu.create = function create(options) {
  return new Qiniu(options);
};

Qiniu.prototype.resourceKey = function (key) {
  if (key && key[0] === '/') {
    key = key.replace(/^\/+/, '');
  }
  return key;
};

Qiniu.prototype.resourceURL = function (key) {
  if (!key) {
    return;
  }

  return this._baseURL + this.resourceKey(key);
};

Qiniu.prototype.signData = function (data) {
  var signature = utility.hmac('sha1', this.options.secretKey, data, 'base64');
  return utils.urlsafe(signature);
};

Qiniu.prototype._request = function (url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {
      dataType: 'json'
    };
  }
  // use global default timeout if options.timeout not set.
  options.timeout = options.timeout || this.options.timeout;
  options.agent = keepaliveAgent;
  urllib.request(url, options, function (err, data, res) {
    err = utils.handleResponse(err, data, res);
    if (err) {
      return callback(err, data, res);
    }
    callback(null, data, res);
  });
};

['./up', './rs', './image', './doc', './dl', './other'].forEach(function (name) {
  var proto = require(name);
  for (var k in proto) {
    Qiniu.prototype[k] = proto[k];
  }
});

module.exports = Qiniu;
