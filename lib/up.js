/*!
 * qn - lib/up.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utility = require('utility');
var debug = require('debug')('qn:up');
var fs = require('fs');
var path = require('path');
var FormStream = require('formstream');
var bt = require('buffer-type');
var utils = require('./utils');
var version = require('../package.json').version;

/**
 * Create uploadToken
 * @see http://docs.qiniu.com/api/v6/put.html#uploadToken
 * 
 * @param {Object} options
 *  - {String} scope 一般指文件要上传到的目标存储空间（Bucket）。
 *                   若为”Bucket”，表示限定只能传到该Bucket（仅限于新增文件）；若为”Bucket:Key”，表示限定特定的文件，可修改该文件。
 *  - {Number} [deadline] 定义 uploadToken 的失效时间，Unix时间戳，精确到秒，缺省为 3600 秒
 *  - {String} [endUser] 给上传的文件添加唯一属主标识，特殊场景下非常有用，比如根据终端用户标识给图片或视频打水印
 *  - {String} [returnUrl] 设置用于浏览器端文件上传成功后，浏览器执行301跳转的URL，一般为 HTML Form 上传时使用。
 *                         文件上传成功后会跳转到 returnUrl?query_string, query_string 会包含 returnBody 内容。
 *                         returnUrl 不可与 callbackUrl 同时使用。 
 *  - {String} [returnBody] 文件上传成功后，自定义从 Qiniu-Cloud-Server 最终返回給终端 App-Client 的数据。
 *                          支持 魔法变量，不可与 callbackBody 同时使用。
 *  - {String} [callbackBody] 文件上传成功后，Qiniu-Cloud-Server 向 App-Server 发送POST请求的数据。
 *                            支持 魔法变量 和 自定义变量，不可与 returnBody 同时使用。
 *  - {String} [callbackUrl] 文件上传成功后，Qiniu-Cloud-Server 向 App-Server 发送POST请求的URL，
 *                           必须是公网上可以正常进行POST请求并能响应 HTTP Status 200 OK 的有效 URL
 *  - {String} [asyncOps] 指定文件（图片/音频/视频）上传成功后异步地执行指定的预转操作。
 *                        每个预转指令是一个API规格字符串，多个预转指令可以使用分号“;”隔开
 * @return {String} upload token string
 */
exports.uploadToken = function uploadToken(options) {
  options = options || {};
  options.scope = options.scope || this.options.bucket;
  options.deadline = options.deadline || (utility.timestamp() + 3600);
  var flags = options;
  // 步骤2：将 Flags 进行安全编码
  var encodedFlags = utility.base64encode(JSON.stringify(flags), true);

  // 步骤3：将编码后的元数据混入私钥进行签名
  // 步骤4：将签名摘要值进行安全编码
  var encodedSign = this.signData(encodedFlags);

  // 步骤5：连接各字符串，生成上传授权凭证
  return this.options.accessKey + ':' + encodedSign + ':' + encodedFlags;
};

/**
 * Upload file content
 * 
 * @param {String|Buffer|Stream} file content string or buffer, or a Stream instance.
 * @param {Object} [options]
 *  - {String} [key] 标识文件的索引，所在的存储空间内唯一。key可包含斜杠，但不以斜杠开头，比如 a/b/c.jpg 是一个合法的key。
 *                   若不指定 key，缺省使用文件的 etag（即上传成功后返回的hash值）作为key；
 *                   此时若 UploadToken 有指定 returnUrl 选项，则文件上传成功后跳转到 returnUrl?query_string, 
 *                   query_string 包含key={FileID}
 *  - {String} [x:custom_field_name] 自定义变量，必须以 x: 开头命名，不限个数。
 *                                   可以在 uploadToken 的 callbackBody 选项中使用 $(x:custom_field_name) 求值。
 *  - {String} [filename]
 *  - {String} [contentType]
 *  - {Number} [size]
 * @param {Function(err, result)} callback
 *  - {Object} result
 *   - {String} hash
 *   - {String} key
 *   - {String} url
 */
exports.upload = function upload(content, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (typeof content === 'string') {
    content = new Buffer(content);
  }

  options = options || {};
  options.filename = options.filename || options.key;
  if (Buffer.isBuffer(content) && !options.filename && !options.contentType) {
    // try to guess contentType from buffer
    var info = bt(content);
    if (info) {
      options.contentType = info.type;
      options.filename = 'file' + info.extension;
    }
  }

  // if (!options.filename) {
  //   options.filename = 'unknowfile';
  // }

  var form = content;
  if (!(content instanceof FormStream)) {
    form = new FormStream();
    if (Buffer.isBuffer(content)) {
      form.buffer('file', content, options.filename, options.contentType);
    } else {
      // stream
      if (content.path) {
        // try to get filename in `stream.path`
        options['x:filename'] = options['x:filename'] || path.basename(content.path);
        if (!options.filename) {
          options.filename = options['x:filename'];
        }
      }
      form.stream('file', content, options.filename, options.contentType, options.size);
    }
  }

  var that = this;
  form.field('token', that.uploadToken());

  if (options.key) {
    form.field('key', this.resourceKey(String(options.key)));
  }

  for (var k in options) {
    if (k.indexOf('x:') === 0) {
      form.field(k, String(options[k]));
    }
  }
  var headers = form.headers();
  headers['User-Agent'] = 'qn/' + version;
  var reqOptions = {
    method: 'POST',
    dataType: 'json',
    headers: headers,
    timeout: options.timeout || that.options.timeout,
    stream: form,
  };

  that._request(that._uploadURL, reqOptions, function (err, data, res) {
    if (err) {
      return callback(err, data, res);
    }
    
    if (data) {
      data.url = that.resourceURL(data.key);
    }
    callback(null, data, res);
  });
};

/**
 * Upload a file
 * 
 * @param {String} filepath file full path
 * @param {Object} [options] options use on `upload()`
 * @param {Function(err, result)} callback
 */
exports.uploadFile = function (filepath, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }

  var that = this;
  fs.stat(filepath, function (err, stat) {
    if (err) {
      return callback(err);
    }

    var form = new FormStream();
    form.file('file', filepath, stat.size);
    options = options || {};
    options['x:filename'] = options['x:filename'] || path.basename(filepath);
    options['x:size'] = options['x:size'] || stat.size;
    if (stat.mtime) {
      options['x:mtime'] = options['x:mtime'] || stat.mtime.getTime() / 1000;
    }
    if (stat.ctime) {
      options['x:ctime'] = options['x:ctime'] || stat.ctime.getTime() / 1000;
    }
    that.upload(form, options, callback);
  });
};
