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
var fs = require('fs');
var path = require('path');
var utility = require('utility');
var qn = require('../');
var config = require('./config.json');

var fixtures = path.join(__dirname, 'fixtures');
var imagepath = path.join(path.dirname(__dirname), 'logo.png');
var imageContent = fs.readFileSync(imagepath);

describe('client.test.js', function () {
  before(function () {
    this.client = qn.create(config);
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
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          url: 'http://qtestbucket.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          "x:ctime": "1378150371",
          "x:filename": "logo.png",
          "x:filepath": "/Users/mk2/git/qn/logo.png",
          "x:mtime": "1378150359",
          "x:size": "21944",
        });
        done();
      });
    });

    it('should upload the logo file with key', function (done) {
      this.client.uploadFile(imagepath, {key: 'qn-logo.png'}, function (err, result) {
        should.not.exist(err);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'qn-logo.png',
          url: 'http://qtestbucket.qiniudn.com/qn-logo.png',
          "x:ctime": "1378150371",
          "x:filename": "logo.png",
          "x:filepath": "/Users/mk2/git/qn/logo.png",
          "x:mtime": "1378150359",
          "x:size": "21944",
        });
        done();
      });
    });

    it('should return err when file not exist', function (done) {
      this.client.uploadFile(imagepath + 'notexists', function (err) {
        should.exist(err);
        done();
      });
    });
  });

  describe('upload', function () {
    it('should upload a foo string with filename', function (done) {
      this.client.upload('foo bar 哈哈', {filename: 'foo'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FiuFB_kYboxBnU6VCMirPzLtIpIq',
          key: 'FiuFB_kYboxBnU6VCMirPzLtIpIq',
          url: 'http://qtestbucket.qiniudn.com/FiuFB_kYboxBnU6VCMirPzLtIpIq'
        })
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
          url: 'http://qtestbucket.qiniudn.com/foobar.txt',
          'x:foo': 'bar哈哈',
          "x:ctime": "2013-09-02T19:32:51.000Z",
          "x:filename": "logo.png",
          "x:filepath": "/Users/mk2/git/qn/logo.png",
          "x:mtime": "1378150359000",
          "x:size": "21944",
        })
        done();
      });
    });

    it('should upload empty string', function (done) {
      this.client.upload('', {filename: 'empty'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'Fg==',
          key: 'Fg==',
          url: 'http://qtestbucket.qiniudn.com/Fg=='
        })
        done();
      });
    });

    it('should upload a text content with no filename and no contentType return error', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuClientAuthError');
        err.message.should.equal('file is not specified in multipart');
        done();
      });
    });

    it('should upload a text content with no filename and has contentType return error', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.readFileSync(txtpath), {contentType: 'text/plain'}, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuClientAuthError');
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
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
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
          url: 'http://qtestbucket.qiniudn.com/qn/big.txt'
        })
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
          url: 'http://qtestbucket.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
        })
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
          url: 'http://qtestbucket.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
        })
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
          url: 'http://qtestbucket.qiniudn.com/qn/logo.png'
        })
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
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
        done();
      });
    });

    it.skip('should upload a small text stream with no size', function (done) {
      var txtpath = path.join(fixtures, 'foo.txt');
      this.client.upload(fs.createReadStream(txtpath), {filename: 'foo.txt'}, 
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
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
          url: 'http://qtestbucket.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH'
        })
        done();
      });
    });

    it.skip('should upload a big text stream with no size', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.createReadStream(txtpath), {filename: 'big.txt'}, 
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
        done();
      });
    });

    it.skip('should upload a image stream with no key', function (done) {
      this.client.upload(fs.createReadStream(imagepath), {filename: 'logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
        done();
      });
    });

    it.skip('should upload a image stream with qn/logo.png key', function (done) {
      this.client.upload(fs.createReadStream(imagepath), {key: 'qn/logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'qn/logo.png',
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
        done();
      });
    });

  });
});
