/*!
 * qn - lib/utils.js
 *
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var utility = require('utility');

exports.createError = function (statusCode, data) {
  // http://docs.qiniu.com/api/v6/put.html#error-code
  var msg = data && data.error || ('status ' + statusCode);
  var err = new Error(msg);
  err.code = statusCode;
  if (err.code === 599 && msg === 'file exists') {
    err.code = 614;
  }
  switch (err.code) {
  case 400:
    err.name = 'QiniuRequestParameterError'; // 请求参数错误
    break;
  case 401:
    err.name = 'QiniuAuthFailError'; // 认证授权失败，可能是 AccessKey/SecretKey 错误或 AccessToken 无效
    break;
  case 404:
    err.name = 'QiniuNotFoundError';
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

exports.handleResponse = function (err, data, res) {
  if (err) {
    return err;
  }
  var statusCode = res.statusCode;
  if (statusCode >= 400) {
    err = exports.createError(statusCode, data);
    return err;
  }
};

exports.urlsafe = function (s) {
  return s.replace(/\//g, '_').replace(/\+/g, '-');
};
