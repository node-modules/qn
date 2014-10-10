/**!
 * qn - test/client.test.js
 *
 * Copyright(c) fengmk2 and other contributors.
 * MIT Licensed
 *
 * Authors:
 *   fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 */

'use strict';

/**
 * Module dependencies.
 */

var should = require('should');
var fs = require('fs');
var path = require('path');
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

  describe('options.uploadURL', function () {
    it('should upload from up.qiniug.com work', function (done) {
      var options = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json')));
      options.uploadURL = 'http://up.qiniug.com/';
      var client = qn.create(options);
      client.uploadFile(__filename, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        done();
      });
    });
  });
});
