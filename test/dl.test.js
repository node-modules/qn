/*!
 * qn - test/dl.test.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var fs = require('fs');
var should = require('should');

describe('dl.test.js', function () {
  var filepath = path.join(__dirname, 'fixtures', 'foo.txt');
  var fooData = fs.readFileSync(filepath);
  before(function () {
    this.client = require('./qn');
  });

  before(function (done) {
    this.client.uploadFile(filepath, {key: 'qn/test/dl/foo.txt'}, done);
  });

  describe('download()', function () {
    it('should download a file', function (done) {
      this.client.download('qn/test/dl/foo.txt', function (err, data) {
        should.not.exist(err);
        data.should.length(fooData.length);
        data.toString().should.equal(fooData.toString());
        done();
      });
    });

    it('should download /qn/test/dl/foo.txt file', function (done) {
      this.client.download('/qn/test/dl/foo.txt', function (err, data) {
        should.not.exist(err);
        data.should.length(fooData.length);
        data.toString().should.equal(fooData.toString());
        done();
      });
    });

    it('should download a not exists file', function (done) {
      this.client.download('qn/test/dl/foo_not_exists.txt', function (err, data) {
        should.exist(err);
        err.name.should.equal('QiniuNotFoundError');
        err.message.should.equal('status 404');
        done();
      });
    });
  });

});
