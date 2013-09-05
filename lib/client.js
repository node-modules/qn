/*!
 * qn - lib/client.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com>  (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var debug = require('debug')('qn:client');
var querystring = require('querystring');
var fs = require('fs');
var path = require('path');
var urllib = require('urllib');
var utility = require('utility');
var FormStream = require('formstream');
var bt = require('buffer-type');
var version = require('../package.json').version;

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

Qiniu.prototype.resourceURL = function (result) {
  if (!result) {
    return;
  }

  result.url = this._baseURL + result.key;
  return result;
};

function urlsafe(s) {
  return s.replace(/\//g, '_').replace(/\+/g, '-');
}

Qiniu.prototype._signData = function (data) {
  var signature = utility.hmac('sha1', this.options.secretKey, data, 'base64');
  return urlsafe(signature);
};

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
Qiniu.prototype.uploadToken = function uploadToken(options) {
  options = options || {};
  options.scope = options.scope || this.options.bucket;
  options.deadline = options.deadline || (utility.timestamp() + 3600);
  var flags = options;
  // 步骤2：将 Flags 进行安全编码
  var encodedFlags = utility.base64encode(JSON.stringify(flags), true);

  // 步骤3：将编码后的元数据混入私钥进行签名
  // 步骤4：将签名摘要值进行安全编码
  var encodedSign = this._signData(encodedFlags);

  // 步骤5：连接各字符串，生成上传授权凭证
  return this.options.accessKey + ':' + encodedSign + ':' + encodedFlags;
};

Qiniu.prototype.createError = function (statusCode, data) {
  // http://docs.qiniu.com/api/v6/put.html#error-code
  var msg = data && data.error || ('status ' + statusCode);
  var err = new Error(msg);
  err.code = statusCode;
  switch (statusCode) {
  case 400:
    err.name = 'QiniuRequestParameterError'; // 请求参数错误
    break;
  case 401:
    err.name = 'QiniuAuthFailError'; // 认证授权失败，可能是 AccessKey/SecretKey 错误或 AccessToken 无效
    break;
  case 405:
    err.name = 'QiniuRequestMethodWrongError'; // 请求方式错误，非预期的请求方式
    break;
  case 579:
    err.name = 'QiniuCallbackAppServerError'; // 文件上传成功，但是回调（callback app-server）失败
    break;
  case 599:
    err.name = 'QiniuServerError'; // 服务端操作失败
    break;
  case 608:
    err.name = 'QiniuFileContentChangeError'; // 文件内容被修改
    break;
  case 612:
    err.name = 'QiniuFileNotExistsError'; // 指定的文件不存在或已经被删除
    break;
  case 614:
    err.name = 'QiniuFileExistsError'; // 文件已存在
    break;
  case 631:
    err.name = 'QiniuBucketNotExistsError'; // 指定的存储空间（Bucket）不存在
    break;
  case 701:
    err.name = 'QiniuDataChunkChecksumError'; // 上传数据块校验出错
    break;
  default:
    err.name = 'QiniuUnknowError';
    break;
  }
  return err;
};

Qiniu.prototype._handleResponse = function (err, data, res) {
  if (err) {
    return err;
  }
  var statusCode = res.statusCode;
  if (statusCode >= 400) {
    err = this.createError(statusCode, data);
    return err;
  }
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
Qiniu.prototype.upload = function upload(content, options, callback) {
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
    form.field('key', String(options.key));
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

  debug('upload options: %j, headers: %j', options, headers);
  
  urllib.request(that._uploadURL, reqOptions, function (err, data, res) {
    err = that._handleResponse(err, data, res);
    if (err) {
      return callback(err, data, res);
    }
    
    callback(null, that.resourceURL(data), res);
  });
};

/**
 * Upload a file
 * 
 * @param {String} filepath file full path
 * @param {Object} [options] options use on `upload()`
 * @param {Function(err, result)} callback
 */
Qiniu.prototype.uploadFile = function (filepath, options, callback) {
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

Qiniu.prototype.accessToken = function (pathname, body) {
  // http://docs.qiniu.com/api/v6/rs.html#digest-auth
  var data = pathname + '\n';
  if (body) {
    data += body;
  }
  var encodedSign = this._signData(data);
  return this.options.accessKey + ':' + encodedSign;
};

Qiniu.prototype.encodeEntryURI = function (key) {
  return utility.base64encode(this.options.bucket + ':' + key, true);
};

Qiniu.prototype._rsAction = function (data, callback, rsURL) {
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
    },
    dataType: 'json'
  };
  if (body) {
    options.content = body;
  }
  var that = this;
  urllib.request(url, options, function (err, data, res) {
    err = that._handleResponse(err, data, res);
    if (err) {
      return callback(err, data, res);
    }
    
    callback(null, data, res);
  });
};

Qiniu.prototype.batch = function (ops, callback) {
  var pathname = '/batch';
  var body = querystring.stringify({op: ops});
  this._rsAction({pathname: pathname, body: body}, callback);
};

Qiniu.prototype._batchAction = function (name, items, callback) {
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
Qiniu.prototype.stat = function (key, callback) {
  var pathname = '/stat/' + this.encodeEntryURI(key);
  this._rsAction(pathname, callback);
};

Qiniu.prototype.delete = function (key, callback) {
  var pathname = '/delete/' + this.encodeEntryURI(key);
  this._rsAction(pathname, callback);
};

Qiniu.prototype.move = function (src, dest, callback) {
  var pathname = '/move/' + this.encodeEntryURI(src) + '/' + this.encodeEntryURI(dest);
  this._rsAction(pathname, callback);
};

Qiniu.prototype.copy = function (src, dest, callback) {
  var pathname = '/copy/' + this.encodeEntryURI(src) + '/' + this.encodeEntryURI(dest);
  this._rsAction(pathname, callback);
};

Qiniu.prototype.batchStat = function (keys, callback) {
  this._batchAction('stat', keys, callback);
};

Qiniu.prototype.batchMove = function (items, callback) {
  this._batchAction('move', items, callback);
};

Qiniu.prototype.batchCopy = function (items, callback) {
  this._batchAction('copy', items, callback);
};

Qiniu.prototype.batchDelete = function (keys, callback) {
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
Qiniu.prototype.list = function (options, callback) {
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

module.exports = Qiniu;
