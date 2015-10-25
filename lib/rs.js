/*!
 * qn - lib/rs.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('qn:rs');
var querystring = require('querystring');
var utility = require('utility');
var utils = require('./utils');

exports.accessToken = function (pathname, body) {
  // http://docs.qiniu.com/api/v6/rs.html#digest-auth
  var data = pathname + '\n';
  if (body) {
    data += body;
  }
  var encodedSign = this.signData(data);
  return this.options.accessKey + ':' + encodedSign;
};

exports.encodeEntryURI = function (key) {
  key = this.resourceKey(key);
  return utility.base64encode(this.options.bucket + ':' + key, true);
};

exports._rsAction = function (data, callback, rsURL) {
  var pathname = null;
  var body = null;
  if (typeof data === 'string') {
    pathname = data;
  } else {
    pathname = data.pathname;
    body = data.body;
  }
  var url = (rsURL || this._rsURL) + pathname;
  var options = {
    method: 'POST',
    headers: {
      Authorization: 'QBox ' + this.accessToken(pathname, body),
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': body ? body.length : 0
    },
    dataType: 'json'
  };
  if (body) {
    options.content = body;
  }
  debug('rs action %s %j', url, options);
  this._request(url, options, callback);
};

exports.batch = function (ops, callback) {
  var pathname = '/batch';
  var body = querystring.stringify({op: ops});
  this._rsAction({pathname: pathname, body: body}, callback);
};

exports._batchAction = function (name, items, callback) {
  var ops = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var pathname;
    if (typeof item === 'string') {
      pathname = '/' + name + '/' + this.encodeEntryURI(item);
    } else {
      pathname = '/' + name + '/' + this.encodeEntryURI(item[0]) + '/' + this.encodeEntryURI(item[1]);
    }
    ops.push(pathname);
  }
  this.batch(ops, callback);
};

/**
 * Get file stat
 *
 * @param {String} key
 * @param {Function(err, stat)} callback
 *  - {Object} stat
 *   - {Number} fsize
 *   - {String} hash
 *   - {String} mimeType
 *   - {Number} putTime
 */
exports.stat = function (key, callback) {
  var pathname = '/stat/' + this.encodeEntryURI(key);
  this._rsAction(pathname, callback);
};

exports.delete = function (key, callback) {
  var pathname = '/delete/' + this.encodeEntryURI(key);
  debug('delete key:%s, entryURI:%s', key, pathname);
  this._rsAction(pathname, callback);
};

exports.move = function (src, dest, callback) {
  var pathname = '/move/' + this.encodeEntryURI(src) + '/' + this.encodeEntryURI(dest);
  this._rsAction(pathname, callback);
};

exports.copy = function (src, dest, callback) {
  var pathname = '/copy/' + this.encodeEntryURI(src) + '/' + this.encodeEntryURI(dest);
  this._rsAction(pathname, callback);
};

exports.fetch = function (url, key, callback) {
  var encodedURL = utility.base64encode(url);
  var pathname = '/fetch/' + encodedURL + '/to/' + this.encodeEntryURI(key);
  this._rsAction(pathname, callback, 'http://iovip.qbox.me');
};

exports.batchStat = function (keys, callback) {
  this._batchAction('stat', keys, callback);
};

exports.batchMove = function (items, callback) {
  this._batchAction('move', items, callback);
};

exports.batchCopy = function (items, callback) {
  this._batchAction('copy', items, callback);
};

exports.batchDelete = function (keys, callback) {
  this._batchAction('delete', keys, callback);
};

/**
 * List current bucket files with options.
 *
 * 请求某个存储空间（bucket）下的文件列表，
 * 如果有前缀，可以按前缀（prefix）进行过滤；
 * 如果前一次返回marker就表示还有资源，下一步请求需要将marker参数填上。
 *
 * @param {String|Object} [prefix|options]
 *  - {String} prefix 指定要过滤出来的前缀, 默认 '/'
 *  - {String} marker 为服务器上次导出时返回的标记，没有可以不填
 *  - {Number} limit 单次查询返回的最大条目数，最大不超过1000
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} marker
 *   - {Array} items Stat items list
 *    - {Number} putTime
 *    - {String} hash
 *    - {Number} fsize
 *    - {String} mimeType
 */
exports.list = function (options, callback) {
  var t = typeof options;
  if (t === 'function') {
    callback = options;
    options = null;
  } else if (t === 'string') {
    options = {prefix: options};
  }
  options = options || {};
  if (options.prefix && options.prefix[0] === '/') {
    options.prefix = options.prefix.substring(1);
  }

  options.bucket = this.options.bucket;
  var pathname = '/list?' + querystring.stringify(options);
  this._rsAction(pathname, callback, 'http://rsf.qbox.me');
};
