/*!
 * qn - lib/dl.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('qn:dl');
var utility = require('utility');

function deadline() {
  return utility.timestamp() + 3600;
}

exports.downloadToken = function (url) {
  return this.options.accessKey + ':' + this.signData(url);
};

/**
 * Download a file
 * 
 * @param {String} key
 * @param {Object} [options]
 *  - {Number} [timeout] default is `global.options.downloadTimeout` one hour.
 *  - {WriteStream} [writeStream] writable stream to save response data.
 *       If you use this, callback's data should be null.
 *       We will just `pipe(ws, {end: true})`.
 * @param {Function(err, content, res)} callback
 */
exports.download = function (key, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  options = options || {};
  options.timeout = options.timeout || this.downloadTimeout;

  var url = this.resourceURL(key) + '?e=' + deadline();
  var token = this.downloadToken(url);
  url += '&token=' + token;
  debug('download %s, timeout %d', url, options.timeout);

  this._request(url, options, callback);
};

exports.saveAsURL = function (key, name) {
  return this.resourceURL(key) + '?download/' + encodeURIComponent(name);
};
