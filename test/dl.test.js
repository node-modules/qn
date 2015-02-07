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
var urllib = require('urllib');

var CI_ENV = (process.env.TRAVIS ? 'TRAVIS' : process.env.CI_ENV) + '-' + process.version;

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

    it('should download content to a stream', function (done) {
      var savePath = path.join(__dirname, 'tmp_qn_logo.png_' + CI_ENV);
      var stream = fs.createWriteStream(savePath);
      this.client.download('/qn/test/logo.png', {writeStream: stream}, function (err, data, res) {
        should.not.exist(err);
        should.not.exist(data);
        res.should.status(200);
        fs.statSync(savePath).size.should.equal(21944);
        done();
      });
    });
  });

  describe('saveAsURL()', function () {
    it('should return a saveAs URL', function (done) {
      var url = this.client.saveAsURL('qn/test/dl/foo.txt', '哈哈foo.txt');
      url.should.equal(this.client.saveAsURL('/qn/test/dl/foo.txt', '哈哈foo.txt'));
      url.should.containEql('.qiniudn.com/qn/test/dl/foo.txt?download/%E5%93%88%E5%93%88foo.txt');
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.toString().should.equal(fooData.toString());
        res.should.have.header('content-disposition');
        done();
      });
    });
  });
});
