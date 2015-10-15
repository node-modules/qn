/*!
 * qn - test/up.test.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var pedding = require('pedding');
var should = require('should');
var fs = require('fs');
var path = require('path');
var utility = require('utility');
var qn = require('../');

var root = path.dirname(__dirname);
var fixtures = path.join(__dirname, 'fixtures');
var imagepath = path.join(path.dirname(__dirname), 'logo.png');
var imageContent = fs.readFileSync(imagepath);

describe('up.test.js', function () {
  before(function () {
    this.client = require('./qn');
  });

  describe('TypeError', function () {
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

  describe('uploadToken()', function () {
    it('should return a upload token with default empty options', function () {
      var token = this.client.uploadToken();
      should.exist(token);
    });

    it('should return a upload token with a deadline', function () {
      var token = this.client.uploadToken({
        deadline: utility.timestamp() + 10
      });
      should.exist(token);
    });
  });

  describe('uploadFile()', function () {
    it('should upload the logo file', function (done) {
      this.client.uploadFile(imagepath, function (err, result) {
        should.not.exist(err);
        result.should.have.keys('hash', 'key', 'url', 'x:ctime', 'x:filename', 'x:mtime', 'x:size');
        result.hash.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.key.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.url.should.containEql('.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result["x:filename"].should.equal('logo.png');
        result["x:ctime"].should.be.match(/^[\d\.]+$/);
        result["x:mtime"].should.be.match(/^[\d\.]+$/);
        result["x:size"].should.equal('21944');
        done();
      });
    });

    it('should upload the logo file with key', function (done) {
      this.client.uploadFile(imagepath, {key: 'qn-logo.png'}, function (err, result) {
        should.not.exist(err);
        result.should.have.keys('hash', 'key', 'url', 'x:ctime', 'x:filename', 'x:mtime', 'x:size');
        result.hash.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.key.should.equal('qn-logo.png');
        result.url.should.containEql('.qiniudn.com/qn-logo.png');
        result["x:filename"].should.equal('logo.png');
        result["x:ctime"].should.be.match(/^[\d\.]+$/);
        result["x:mtime"].should.be.match(/^[\d\.]+$/);
        result["x:size"].should.equal('21944');
        done();
      });
    });

    it('should upload the logo file with key: /qn/test/logo.png', function (done) {
      var that = this;
      this.client.uploadFile(imagepath, {key: '/qn/test/logo.png'}, function (err, result) {
        should.not.exist(err);
        result.should.have.keys('hash', 'key', 'url', 'x:ctime', 'x:filename', 'x:mtime', 'x:size');
        result.hash.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.key.should.equal('qn/test/logo.png');
        result.url.should.equal('http://qiniu-sdk-test.qiniudn.com/qn/test/logo.png');
        result["x:filename"].should.equal('logo.png');
        result["x:ctime"].should.be.match(/^[\d\.]+$/);
        result["x:mtime"].should.be.match(/^[\d\.]+$/);
        result["x:size"].should.equal('21944');

        that.client.list('/qn/test/', function (err, result) {
          should.not.exist(err);
          result.items.length.should.above(0);
          done();
        });
      });
    });

    it('should return err when file not exist', function (done) {
      this.client.uploadFile(imagepath + 'notexists', function (err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('upload()', function () {
    it('should upload a foo string with filename', function (done) {
      this.client.upload('foo bar 哈哈', {filename: 'foo'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.hash.should.equal('FiuFB_kYboxBnU6VCMirPzLtIpIq');
        result.key.should.equal('FiuFB_kYboxBnU6VCMirPzLtIpIq');
        result.url.should.containEql('.qiniudn.com/FiuFB_kYboxBnU6VCMirPzLtIpIq');
        done();
      });
    });

    it('should success when upload same key and same content', function (done) {
      this.client.upload('foo bar 哈哈', {filename: 'foo', key: 'foo'}, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuFileExistsError');
        err.code.should.equal(614);
        err.message.should.equal('file exists');
        done();
      });
    });

    it('should upload a foobar string with key and x:headers', function (done) {
      this.client.upload('foo foo bar 哈哈', {
        key: 'foobar.txt',
        'x:foo': 'bar哈哈',
        "x:filepath":"/Users/mk2/git/qn/logo.png",
        "x:filename":"logo.png",
        "x:size": 21944,
        "x:mtime": Date.parse("2013-09-02T19:32:39.000Z"),
        "x:ctime": "2013-09-02T19:32:51.000Z"
      }, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FptOdeKmWhcYHUXa5YmNZxJC934B',
          key: 'foobar.txt',
          url: 'http://qiniu-sdk-test.qiniudn.com/foobar.txt',
          'x:foo': 'bar哈哈',
          "x:ctime": "2013-09-02T19:32:51.000Z",
          "x:filename": "logo.png",
          "x:filepath": "/Users/mk2/git/qn/logo.png",
          "x:mtime": "1378150359000",
          "x:size": "21944",
        });
        done();
      });
    });

    it('should upload empty string', function (done) {
      this.client.upload('', {filename: 'empty'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ',
          key: 'Fto5o-5ea0sNMlW_75VgGJCv2AcJ',
          url: 'http://qiniu-sdk-test.qiniudn.com/Fto5o-5ea0sNMlW_75VgGJCv2AcJ'
        });
        done();
      });
    });

    it.skip('should upload a text content with no filename and no contentType return error', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), function (err, result) {
        console.log(result);
        should.exist(err);
        err.name.should.equal('QiniuRequestParameterError');
        err.message.should.equal('file is not specified in multipart');
        done();
      });
    });

    it.skip('should upload a text content with no filename and has contentType return error', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), {contentType: 'text/plain'}, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuRequestParameterError');
        err.message.should.equal('file is not specified in multipart');
        done();
      });
    });

    it('should upload a text content with filename', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), {filename: 'big.txt'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          url: 'http://qiniu-sdk-test.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        });
        done();
      });
    });

    it('should upload a text content with key', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), {key: 'qn/big.txt'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'qn/big.txt',
          url: 'http://qiniu-sdk-test.qiniudn.com/qn/big.txt'
        });
        done();
      });
    });

    it('should upload a image content with no filename and no contentType', function (done) {
      this.client.upload(imageContent, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          url: 'http://qiniu-sdk-test.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
        });
        done();
      });
    });

    it('should upload a image content with filename', function (done) {
      this.client.upload(imageContent, {filename: 'logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          url: 'http://qiniu-sdk-test.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
        });
        done();
      });
    });

    it('should upload a image content with qn/logo.png key', function (done) {
      this.client.upload(imageContent, {key: 'qn/logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'qn/logo.png',
          url: 'http://qiniu-sdk-test.qiniudn.com/qn/logo.png'
        });
        done();
      });
    });

    it('should upload a big text stream with size', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.createReadStream(txtpath),
        {filename: 'big.txt', size: fs.statSync(txtpath).size},
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          url: 'http://qiniu-sdk-test.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          "x:filename": "big.txt",
        });
        done();
      });
    });

    it('should upload a small text stream with no size', function (done) {
      var txtpath = path.join(fixtures, 'foo.txt');
      this.client.upload(fs.createReadStream(txtpath), {filename: 'foo', key: 'foo_chunked.txt'},
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          key: 'foo_chunked.txt',
          url: 'http://qiniu-sdk-test.qiniudn.com/foo_chunked.txt',
          "x:filename": "foo.txt",
        });
        done();
      });
    });

    it('should upload a small text stream with no size and no options', function (done) {
      var txtpath = path.join(fixtures, 'foo.txt');
      this.client.upload(fs.createReadStream(txtpath), function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          key: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          url: 'http://qiniu-sdk-test.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          "x:filename": "foo.txt",
        });
        done();
      });
    });

    it('should upload a small text stream with size', function (done) {
      var txtpath = path.join(fixtures, 'foo.txt');
      var size = fs.statSync(txtpath).size;
      this.client.upload(fs.createReadStream(txtpath), {filename: 'foo.txt', size: size},
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          key: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          url: 'http://qiniu-sdk-test.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          "x:filename": "foo.txt",
        });
        done();
      });
    });

    it('should upload a big text stream with no size', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.createReadStream(txtpath), {filename: 'big.txt'},
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          url: 'http://qiniu-sdk-test.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          "x:filename": "big.txt",
        });
        done();
      });
    });

    it('should upload a image stream with no key', function (done) {
      this.client.upload(fs.createReadStream(imagepath), {filename: 'logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          url: 'http://qiniu-sdk-test.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          "x:filename": "logo.png",
        });
        done();
      });
    });

    it('should upload a file stream', function (done) {
      var filepath = path.join(root, 'lib', 'client.js');
      var that = this;
      that.client.delete('qn/lib/client.js', function () {
        that.client.upload(fs.createReadStream(filepath), {filename: filepath, key: 'qn/lib/client.js'}, function (err, result) {
          should.not.exist(err);
          should.exist(result);
          result.key.should.equal('qn/lib/client.js');
          // result.should.eql({
          //   hash: 'FhGbwBlFASLrZp2d16Am2bP5A9Ut',
          //   key: 'qn/lib/client.js',
          //   url: 'http://qtestbucket.qiniudn.com/qn/lib/client.js'
          // })
          done();
        });
      });
    });

    it('should upload a image stream with qn/logo.png key', function (done) {
      this.client.upload(fs.createReadStream(imagepath), {key: 'qn/logo_chunked.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'qn/logo_chunked.png',
          url: 'http://qiniu-sdk-test.qiniudn.com/qn/logo_chunked.png',
          "x:filename": "logo.png",
        });
        done();
      });
    });
  });
});
