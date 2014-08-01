/*!
 * qn - test/doc.test.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var urllib = require('urllib');
var path = require('path');

describe('doc.test.js', function () {
  before(function () {
    this.client = require('./qn');
  });

  before(function (done) {
    var that = this;
    that.client.uploadFile(path.join(__dirname, 'fixtures', 'readme.md'), {key: 'qn/test/fixtures/readme.md'}, function () {
      that.client.uploadFile(path.join(__dirname, 'fixtures', 'github.css'), {key: 'qn/test/fixtures/github.css'}, done);
    });
  });

  describe('md2html()', function () {
    it('should convert markdown to html', function (done) {
      var url = this.client.md2html('qn/test/fixtures/readme.md');
      url.should.containEql('.qiniudn.com/qn/test/fixtures/readme.md?md2html');
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'text/html');
        done();
      });
    });

    it('should convert markdown to html with css', function (done) {
      var url = this.client.md2html('qn/test/fixtures/readme.md', {
        css: 'http://qiniu-sdk-test.qiniudn.com/qn/test/fixtures/github.css'
      });
      url.should.containEql('.qiniudn.com/qn/test/fixtures/readme.md?md2html/0/css/aHR0cDovL3Fpbml1LXNkay10ZXN0LnFpbml1ZG4uY29tL3FuL3Rlc3QvZml4dHVyZXMvZ2l0aHViLmNzcw==');
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'text/html');
        done();
      });
    });

    it('should convert markdown to only body html', function (done) {
      var url = this.client.md2html('qn/test/fixtures/readme.md', {mode: 1});
      url.should.containEql('.qiniudn.com/qn/test/fixtures/readme.md?md2html/1');
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'text/html');
        done();
      });
    });
  });
});
