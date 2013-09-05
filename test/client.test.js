/*!
 * qn - test/client.test.js
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
var config = require('./config.json');

var root = path.dirname(__dirname);
var fixtures = path.join(__dirname, 'fixtures');
var imagepath = path.join(path.dirname(__dirname), 'logo.png');
var imageContent = fs.readFileSync(imagepath);
var CI_ENV = (process.env.TRAVIS ? 'TRAVIS' : process.env.CI_ENV) + '-' + process.version;
var rsOpFile = 'qn/rs_op.' + CI_ENV + '.txt';
var rsOpFileMove = rsOpFile + '.move.txt';
var rsOpFileCopy = rsOpFile + '.copy.txt';

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
        result.should.have.keys('hash', 'key', 'url', 'x:ctime', 'x:filename', 'x:mtime', 'x:size');
        result.hash.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.key.should.equal('FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result.url.should.equal('http://qtestbucket.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki');
        result["x:filename"].should.equal('logo.png');
        result["x:ctime"].should.be.match(/^\d+$/);
        result["x:mtime"].should.be.match(/^\d+$/);
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
        result.url.should.equal('http://qtestbucket.qiniudn.com/qn-logo.png');
        result["x:filename"].should.equal('logo.png');
        result["x:ctime"].should.be.match(/^\d+$/);
        result["x:mtime"].should.be.match(/^\d+$/);
        result["x:size"].should.equal('21944');
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

    it('should return file exists error when upload same key', function (done) {
      this.client.upload('foo bar 哈哈2', {key: 'foo'}, function (err, result) {
        should.exist(err);
        err.name.should.equal('QiniuFileExistsError');
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
        err.name.should.equal('QiniuRequestParameterError');
        err.message.should.equal('file is not specified in multipart');
        done();
      });
    });

    it('should upload a text content with no filename and has contentType return error', function (done) {
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
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          "x:filename": "big.txt",
        })
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
          url: 'http://qtestbucket.qiniudn.com/foo_chunked.txt',
          "x:filename": "foo.txt",
        })
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
          url: 'http://qtestbucket.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          "x:filename": "foo.txt",
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
          url: 'http://qtestbucket.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
          "x:filename": "foo.txt",
        })
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
          url: 'http://qtestbucket.qiniudn.com/FhRP7GIsuzMrSOp0AQnVVymMNsXJ',
          "x:filename": "big.txt",
        })
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
          url: 'http://qtestbucket.qiniudn.com/FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          "x:filename": "logo.png",
        })
        done();
      });
    });

    it.skip('should upload a file stream', function (done) {
      var filepath = path.join(root, 'lib', 'client.js');
      this.client.upload(fs.createReadStream(filepath), {filename: filepath, key: 'qn/lib/client.js'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FhGbwBlFASLrZp2d16Am2bP5A9Ut',
          key: 'qn/lib/client.js',
          url: 'http://qtestbucket.qiniudn.com/qn/lib/client.js'
        })
        done();
      });
    });

    it('should upload a image stream with qn/logo.png key', function (done) {
      this.client.upload(fs.createReadStream(imagepath), {key: 'qn/logo_chunked.png'}, function (err, result) {
        should.not.exist(err);
        should.exist(result);
        result.should.eql({
          hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
          key: 'qn/logo_chunked.png',
          url: 'http://qtestbucket.qiniudn.com/qn/logo_chunked.png',
          "x:filename": "logo.png",
        })
        done();
      });
    });

    describe('rs: file op', function () {
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
            info.should.have.keys('fsize', 'hash', 'mimeType', 'putTime')
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

        it('should success when src and dest are same', function (done) {
          var that = this;
          this.client.move(rsOpFile, rsOpFileMove, function (err, result) {
            that.client.move(rsOpFileMove, rsOpFileMove, function (err, result) {
              should.not.exist(err);
              should.not.exist(result);
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
        it('should delete a exists file', function (done) {
          this.client.delete(rsOpFile, function (err, result) {
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
              item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
              item.fsize.should.be.a('number');
              item.putTime.should.be.a('number');
              item.key.should.be.a('string');
              item.hash.should.be.a('string');
              item.mimeType.should.be.a('string');
            });
            done();
          });

          this.client.list('', function (err, result) {
            should.not.exist(err);
            should.exist(result);
            result.should.have.property('items').with.be.an.instanceof(Array);
            result.items.length.should.above(0);
            result.items.forEach(function (item) {
              item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
              item.fsize.should.be.a('number');
              item.putTime.should.be.a('number');
              item.key.should.be.a('string');
              item.hash.should.be.a('string');
              item.mimeType.should.be.a('string');
            });
            done();
          });

          this.client.list(function (err, result) {
            should.not.exist(err);
            should.exist(result);
            result.should.have.property('items').with.be.an.instanceof(Array);
            result.items.length.should.above(0);
            result.items.forEach(function (item) {
              item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
              item.fsize.should.be.a('number');
              item.putTime.should.be.a('number');
              item.key.should.be.a('string');
              item.hash.should.be.a('string');
              item.mimeType.should.be.a('string');
            });
            done();
          });
        });
        
        it('should list /qn limit 2, and next page marker work', function (done) {
          var that = this;
          this.client.list({prefix: '/qn', limit: 2}, function (err, result) {
            should.not.exist(err);
            result.items.should.length(2);
            result.marker.should.be.a('string');
            // next page
            that.client.list({prefix: '/qn', limit: 3, marker: result.marker}, function (err, result2) {
              should.not.exist(err);
              result2.items.should.length(3);
              result2.marker.should.be.a('string');
              done();
            });
          });
        });

        it('should limit 0 equal not limit', function (done) {
          this.client.list({prefix: 'qn/', limit: 0}, function (err, result) {
            should.not.exist(err);
            should.exist(result);
            result.should.have.property('items').with.be.an.instanceof(Array);
            result.items.length.should.above(0);
            result.items.forEach(function (item) {
              item.should.have.keys('fsize', 'putTime', 'key', 'hash', 'mimeType');
              item.fsize.should.be.a('number');
              item.putTime.should.be.a('number');
              item.key.should.be.a('string');
              item.hash.should.be.a('string');
              item.mimeType.should.be.a('string');
            });
            done();
          });
        });

      });

    });

  });

  describe('rs batch operations', function () {
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

    describe('batchStat()', function () {
      it('should show 2 files stats', function (done) {
        this.client.batchStat(['qn/logo.png', 'qn/lib/client.js', 'not-exists-file'], function (err, results) {
          should.not.exist(err);
          should.exist(results);
          results.should.length(3);
          results[0].code.should.equal(200);
          results[0].data.mimeType.should.equal('image/png');
          results[1].code.should.equal(200);
          results[1].data.mimeType.should.equal('application/javascript');
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
          results[1].should.eql({ code: 612, data: { error: 'no such file or directory' } });
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
});
