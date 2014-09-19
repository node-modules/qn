/*!
 * qn - test/image.test.js
 * Copyright(c) 2013 fengmk2 <fengmk2@gmail.com> (http://fengmk2.github.com)
 * MIT Licensed
 */

"use strict";

/**
 * Module dependencies.
 */

var path = require('path');
var should = require('should');
var pedding = require('pedding');
var urllib = require('urllib');
urllib.TIMEOUT = 10000;

describe('image.test.js', function () {
  before(function () {
    this.client = require('./qn');
  });

  before(function (done) {
    this.client.uploadFile(path.join(__dirname, 'fixtures', 'gogopher.jpg'), {key: 'qn/fixtures/gogopher.jpg'}, done);
  });

  describe('imageInfo()', function () {
    it('should return image info', function (done) {
      this.client.imageInfo('qn/logo.png', function (err, info) {
        should.not.exist(err);
        info.should.have.keys('format', 'width', 'height', 'colorModel');
        info.should.eql({ format: 'png', width: 190, height: 150, colorModel: 'nrgba' });
        done();
      });
    });

    it('should return QiniuNotFoundError when get not exists image info', function (done) {
      this.client.imageInfo('qn/logo_not_exists.png', function (err, info) {
        should.exist(err);
        err.name.should.equal('QiniuNotFoundError');
        // err.message.should.equal('Not Found');
        done();
      });
    });
  });

  describe('exif()', function () {
    it('should return image exif', function (done) {
      this.client.exif('qn/fixtures/gogopher.jpg', function (err, info) {
        should.not.exist(err);
        should.exist(info);
        info.should.have.property('ApertureValue');
        info.ApertureValue.should.eql({ val: '5.00 EV (f/5.7)', type: 5 });
        done();
      });
    });

    it('should return QiniuNotFoundError when get not exists exif info', function (done) {
      this.client.exif('qn/fixtures/gogopher_no_exists.jpg', function (err, info) {
        should.exist(err);
        err.name.should.equal('QiniuNotFoundError');
        // err.message.should.equal('E404');
        done();
      });
    });
  });

  describe('imageView()', function () {
    it('should return thumbnail url', function (done) {
      var url = this.client.imageView('qn/fixtures/gogopher.jpg', {mode: 1, width: 50, height: 50});
      url.should.match(/\?imageView\/1\/w\/50\/h\/50$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'image/jpeg');
        done();
      });
    });

    it('should return error when file is not image', function (done) {
      var url = this.client.imageView('qn/big.txt', {mode: 1, width: 50, height: 50});
      url.should.match(/\?imageView\/1\/w\/50\/h\/50$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        data.toString().should.equal('{"error":"unsupported format:image: unknown format"}');
        res.should.status(400);
        done();
      });
    });

    it('should return png thumbnail url', function (done) {
      var url = this.client.imageView('qn/fixtures/gogopher.jpg', {mode: 1, width: 50, height: 50, format: 'png'});
      url.should.match(/\?imageView\/1\/w\/50\/h\/50\/format\/png$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'image/png');
        done();
      });
    });

    it('should return gif quality:50 thumbnail url', function (done) {
      var url = this.client.imageView('qn/fixtures/gogopher.jpg', {mode: 1, width: 50, height: 50, quality: 50, format: 'gif'});
      url.should.match(/\?imageView\/1\/w\/50\/h\/50\/q\/50\/format\/gif$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'image/gif');
        done();
      });
    });
  });

  describe('imageMogr()', function () {
    it('should rotate a image', function (done) {
      var url = this.client.imageMogr('qn/logo.png', {
        thumbnail: '!50p',
        gravity: 'NorthWest',
        quality: 50,
        rotate: -50,
        format: 'gif'
      });
      url.should.match(/\?imageMogr\/v2\/auto\-orient\/thumbnail\/\!50p\/gravity\/NorthWest\/quality\/50\/rotate\/\-50\/format\/gif$/);
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'image/gif');
        done();
      });
    });
  });

  describe('watermark()', function () {
    it('should return text watermark image', function (done) {
      var url = this.client.watermark('qn/logo.png', {
        mode: 2,
        text: 'Node.js 哈哈',
        font: '宋体',
        fontsize: 500,
        fill: 'red',
        dissolve: 100,
        gravity: 'SouthEast',
        dx: 100,
        dy: 90
      });
      url.should.containEql('?watermark/2/text/Tm9kZS5qcyDlk4jlk4g=/font/5a6L5L2T/fontsize/500/fill/cmVk/dissolve/100/gravity/SouthEast/dx/100/dy/90');
      urllib.request(url, function (err, data, res) {
        should.not.exist(err);
        data.length.should.above(0);
        res.should.status(200);
        res.should.have.header('Content-Type', 'image/png');
        done();
      });
    });
  });
});
