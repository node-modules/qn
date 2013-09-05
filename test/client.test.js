/*!
 * qn - test/client.test.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var qn = require('../');

describe('client.test.js', function () {
  it('should throw TypeError', function () {
    (function () {
      qn.create();
    }).should.throw('required accessKey, secretKey and bucket');
    (function () {
      qn.create({});
    }).should.throw('required accessKey, secretKey and bucket');
    (function () {
      qn.create({accessKey: 'accessKey', bucket: 'bucket'});
    }).should.throw('required accessKey, secretKey and bucket');
  });
});
