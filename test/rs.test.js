'use strict';

var pedding = require('pedding');
var should = require('should');
var fs = require('fs');
var path = require('path');
var utility = require('utility');
var qn = require('../');

var fixtures = path.join(__dirname, 'fixtures');
var CI_ENV = (process.env.TRAVIS ? 'TRAVIS' : process.env.CI_ENV) + '-' + process.version;
var rsOpFile = 'qn/rs_op.' + CI_ENV + '.txt';
var rsOpFileMove = rsOpFile + '.move.txt';
var rsOpFileCopy = rsOpFile + '.copy.txt';

describe('rs.test.js', function () {
  before(function () {
    this.client = require('./qn');
  });

  beforeEach(function (done) {
    done = pedding(3, done);
    this.client.uploadFile(path.join(fixtures, 'foo.txt'), {key: rsOpFile}, done);
    this.client.delete(rsOpFileMove, function () {
      done();
    });
    this.client.delete(rsOpFileCopy, function () {
      done();
    });
  });

  describe('stat()', function () {
    it('should return stat of ' + rsOpFile, function (done) {
      this.client.stat(rsOpFile, function (err, info) {
        should.not.exist(err);
        should.exist(info);
        info.should.have.keys('fsize', 'hash', 'mimeType', 'putTime');
        info.fsize.should.equal(8);
        info.hash.should.equal('FvnDEnGu6pjzxxxc5d6IlNMrbDnH');
        info.mimeType.should.equal('text/plain');
        info.putTime.should.match(/^\d+$/);
        done();
      });
    });

    it('should return QiniuFileNotExistsError', function (done) {
      this.client.stat('qn/rs_op_not_exists.txt', function (err) {
        should.exist(err);
        err.name.should.equal('QiniuFileNotExistsError');
        done();
      });
    });
  });

  describe('move()', function () {
    it('should move ' + rsOpFile + ' to ' + rsOpFileMove, function (done) {
      this.client.move(rsOpFile, rsOpFileMove, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should return QiniuFileNotExistsError when move not exist file', function (done) {
      this.client.move('qn/rs_op_not_exists.txt', rsOpFileMove, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuFileNotExistsError');
        err.message.should.equal('no such file or directory');
        err.code.should.equal(612);
        done();
      });
    });

    it('should return QiniuFileExistsError when src and dest are same', function (done) {
      var that = this;
      this.client.move(rsOpFile, rsOpFileMove, function (err, result) {
        that.client.move(rsOpFileMove, rsOpFileMove, function (err, result) {
          should.exist(err);
          err.name.should.equal('QiniuFileExistsError');
          done();
        });
      });
    });

    it('should return QiniuFileExistsError', function (done) {
      var that = this;
      that.client.move(rsOpFile, rsOpFileMove, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        that.client.uploadFile(path.join(fixtures, 'foo.txt'), {key: rsOpFile}, function (err) {
          should.not.exist(err);
          that.client.move(rsOpFile, rsOpFileMove, function (err, result) {
            should.exist(err);
            err.name.should.equal('QiniuFileExistsError');
            err.message.should.equal('file exists');
            err.code.should.equal(614);
            done();
          });
        });
      });
    });
  });

  describe('copy', function () {
    it('should copy ' + rsOpFile + ' to ' + rsOpFileCopy, function (done) {
      this.client.copy(rsOpFile, rsOpFileCopy, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should return QiniuFileNotExistsError when copy not exist file', function (done) {
      this.client.copy('qn/rs_op_not_exists.txt', rsOpFileCopy, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuFileNotExistsError');
        err.message.should.equal('no such file or directory');
        err.code.should.equal(612);
        done();
      });
    });

    it('should return QiniuFileExistsError when src and dest are same', function (done) {
      var that = this;
      this.client.copy(rsOpFile, rsOpFileCopy, function (err, result) {
        that.client.copy(rsOpFileCopy, rsOpFileCopy, function (err, result) {
          should.exist(err);
          err.name.should.equal('QiniuFileExistsError');
          err.message.should.equal('file exists');
          done();
        });
      });
    });

    it('should return QiniuFileExistsError', function (done) {
      var that = this;
      that.client.copy(rsOpFile, rsOpFileCopy, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        that.client.uploadFile(path.join(fixtures, 'foo.txt'), {key: rsOpFile}, function (err) {
          should.not.exist(err);
          that.client.copy(rsOpFile, rsOpFileCopy, function (err, result) {
            should.exist(err);
            err.name.should.equal('QiniuFileExistsError');
            err.message.should.equal('file exists');
            err.code.should.equal(614);
            done();
          });
        });
      });
    });
  });

  describe('delete', function () {
    it('should delete "' + rsOpFile + '" file', function (done) {
      this.client.delete(rsOpFile, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should delete "' + '/' + rsOpFile + '" file', function (done) {
      this.client.delete('/' + rsOpFile, function (err, result) {
        should.not.exist(err);
        should.not.exist(result);
        done();
      });
    });

    it('should delete not exists file return QiniuFileNotExistsError', function (done) {
      this.client.delete('qn/rs_op_not_exists.txt', function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuFileNotExistsError');
        err.message.should.equal('no such file or directory');
        err.code.should.equal(612);
        done();
      });
    });
  });

  describe('list()', function () {
    it('should list / files', function (done) {
      done = pedding(3, done);
      this.client.list('/', function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.length.should.above(0);
        result.items.forEach(function (item) {
          // item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
          item.fsize.should.be.a.Number;
          item.putTime.should.be.a.Number;
          item.key.should.be.a.String;
          item.hash.should.be.a.String;
          item.mimeType.should.be.a.String;
        });
        done();
      });

      this.client.list('', function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.length.should.above(0);
        result.items.forEach(function (item) {
          // item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
          item.fsize.should.be.a.Number;
          item.putTime.should.be.a.Number;
          item.key.should.be.a.String;
          item.hash.should.be.a.String;
          item.mimeType.should.be.a.String;
        });
        done();
      });

      this.client.list(function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.instanceof(Array);
        result.items.length.should.above(0);
        result.items.forEach(function (item) {
          // item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
          item.fsize.should.be.a.Number;
          item.putTime.should.be.a.Number;
          item.key.should.be.a.String;
          item.hash.should.be.a.String;
          item.mimeType.should.be.a.String;
        });
        done();
      });
    });

    it('should list /qn limit 5, and next page marker work', function (done) {
      var that = this;
      this.client.list({prefix: '/qn', limit: 5}, function (err, result) {
        should.not.exist(err);
        result.items.should.length(5);
        result.marker.should.be.a.String;
        // next page
        that.client.list({prefix: '/qn', limit: 11, marker: result.marker}, function (err, result2) {
          should.not.exist(err);
          result2.items.should.length(11);
          result2.marker.should.be.a.String;
          done();
        });
      });
    });

    it.skip('should limit 0 equal not limit', function (done) {
      this.client.list({prefix: 'qn/', limit: 0}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.have.property('items').with.be.an.Array;
        result.items.length.should.above(0);
        result.items.forEach(function (item) {
          item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
          item.fsize.should.be.a.Number;
          item.putTime.should.be.a.Number;
          item.key.should.be.a.String;
          item.hash.should.be.a.String;
          item.mimeType.should.be.a.String;
        });
        done();
      });
    });

  });

  describe('batchStat()', function () {
    it('should show 2 files stats', function (done) {
      this.client.batchStat(['qn/logo.png', 'qn/big.txt', 'not-exists-file'], function (err, results) {
        should.not.exist(err);
        should.exist(results);
        results.should.length(3);
        results[0].code.should.equal(200);
        results[0].data.mimeType.should.equal('image/png');
        results[1].code.should.equal(200);
        results[1].data.mimeType.should.equal('text/plain');
        results[2].should.eql({ code: 612, data: { error: 'no such file or directory' } });
        done();
      });
    });
  });

  describe('batchMove()', function () {
    it('should move 2 files', function (done) {
      this.client.batchMove([
        [rsOpFile, rsOpFileMove],
        ['qn/rs_op_batch_notexists.txt', 'qn/rs_op_batch_move_notexists.txt'],
      ], function (err, results) {
        should.not.exist(err);
        should.exist(results);
        results.should.length(2);
        results[0].code.should.equal(200);
        should.not.exist(results[0].data);
        results[1].should.eql({ code: 612, data: { error: 'no such file or directory' } });
        done();
      });
    });
  });

  describe('batchCopy()', function () {
    it('should move 2 files', function (done) {
      this.client.batchCopy([
        [rsOpFile, rsOpFileCopy],
        ['qn/rs_op_batch_notexists.txt', 'qn/rs_op_batch_copy_notexists.txt'],
      ], function (err, results) {
        should.not.exist(err);
        should.exist(results);
        results.should.length(2);
        results[0].code.should.equal(200);
        should.not.exist(results[0].data);
        results[1].code.should.equal(612);
        results[1].data.error.should.equal('no such file or directory');
        done();
      });
    });
  });

  describe('batchDelete()', function () {
    it('should move 2 files', function (done) {
      this.client.batchDelete([
        rsOpFile,
        'qn/rs_op_batch_notexists.txt',
      ], function (err, results) {
        should.not.exist(err);
        should.exist(results);
        results.should.length(2);
        results[0].code.should.equal(200);
        should.not.exist(results[0].data);
        results[1].should.eql({ code: 612, data: { error: 'no such file or directory' } });
        done();
      });
    });
  });
});
