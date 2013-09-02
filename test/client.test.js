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

  describe('upload', function () {
    it('should upload a foo string', function (done) {
      this.client.upload('foo bar 哈哈', function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FiuFB_kYboxBnU6VCMirPzLtIpIq',
          key: 'FiuFB_kYboxBnU6VCMirPzLtIpIq'
        })
        done();
      });
    });

    it('should upload a image content with no key', function (done) {
      this.client.upload(imageContent, {filename: 'logo.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
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
          key: 'qn/logo.png'
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
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
        })
        done();
      });
    });

    it.skip('should upload a big text stream with no size', function (done) {
      var txtpath = path.join(fixtures, 'big.txt');
      this.client.upload(fs.createReadStream(txtpath), 
        {filename: 'big.txt'}, 
      function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          key: 'FhRP7GIsuzMrSOp0AQnVVymMNsXJ'
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
          key: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki'
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
          key: 'qn/logo.png'
        })
        done();
      });
    });

  });
});
