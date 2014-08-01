/*!
 * qn - test/other.test.js
 * Copyright(c) fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var should = require('should');
var urllib = require('urllib');
var pedding = require('pedding');

describe('other.test.js', function () {
  before(function () {
    this.client = require('./qn');
  });

  describe('qrcode()', function () {
    it('should return qrcode url with default params', function (done) {
      var url = this.client.qrcode('foo');
      url.should.match(/\?qrcode$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });
    });

    it('should return qrcode url with mode 0', function (done) {
      done = pedding(3, done);
      var url = this.client.qrcode('foo', 0);
      url.should.match(/\?qrcode\/0$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });

      var url = this.client.qrcode('foo', 2);
      url.should.match(/\?qrcode$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });

      var url = this.client.qrcode('foo', '0');
      url.should.match(/\?qrcode\/0$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });
    });

    it('should return qrcode url with mode 1', function (done) {
      done = pedding(2, done);
      var url = this.client.qrcode('foo', 1);
      url.should.match(/\?qrcode\/1$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });

      var url = this.client.qrcode('foo', '1');
      url.should.match(/\?qrcode\/1$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.header('Content-Type', 'image/png');
        done();
      });
    });
  });
});
