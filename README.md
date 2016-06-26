qn
=======

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/qn.svg?style=flat
[npm-url]: https://npmjs.org/package/qn
[travis-image]: https://img.shields.io/travis/node-modules/qn.svg?style=flat
[travis-url]: https://travis-ci.org/node-modules/qn
[codecov-image]: https://codecov.io/gh/node-modules/qn/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/qn
[david-image]: https://img.shields.io/david/node-modules/qn.svg?style=flat
[david-url]: https://david-dm.org/node-modules/qn
[snyk-image]: https://snyk.io/test/npm/qn/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/qn
[download-image]: https://img.shields.io/npm/dm/qn.svg?style=flat-square
[download-url]: https://npmjs.org/package/qn


Another [qiniu](http://docs.qiniu.com/api/) API client for Node.js.

## Install

```bash
$ npm install qn --save
```

## Usage

### Upload

```js
var qn = require('qn');

var client = qn.create({
  accessKey: 'your access key',
  secretKey: 'your secret key',
  bucket: 'your bucket name',
  origin: 'http://{bucket}.u.qiniudn.com',
  // timeout: 3600000, // default rpc timeout: one hour, optional
  // if your app outside of China, please set `uploadURL` to `http://up.qiniug.com/`
  // uploadURL: 'http://up.qiniu.com/',
});

// upload a file with custom key
client.uploadFile(filepath, {key: 'qn/lib/client.js'}, function (err, result) {
  console.log(result);
  // {
  //   hash: 'FhGbwBlFASLrZp2d16Am2bP5A9Ut',
  //   key: 'qn/lib/client.js',
  //   url: 'http://qtestbucket.qiniudn.com/qn/lib/client.js'
  //   "x:ctime": "1378150371",
  //   "x:filename": "client.js",
  //   "x:mtime": "1378150359",
  //   "x:size": "21944",
  // }
});

// upload a stream
client.upload(fs.createReadStream(filepath), function (err, result) {
  console.log(result);
  // {
  //   hash: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
  //   key: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
  //   url: 'http://qtestbucket.qiniudn.com/FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
  //   "x:filename": "foo.txt",
  // }
});

// you also can upload a string or Buffer directly
client.upload('哈哈', {key: 'haha.txt'}, function (err, result) {
  console.log(result);
  // hash: 'FptOdeKmWhcYHUXa5YmNZxJC934B',
  // key: 'haha.txt',
  // url: 'http://qtestbucket.qiniudn.com/haha.txt',
});

// xVariables
client.upload(filepath, { 'x:foo': 'bar' }, function (err, result) {
  console.log(result);
  // hash: 'FptOdeKmWhcYHUXa5YmNZxJC934B',
  // key: 'foobar.txt',
  // url: 'http://qtestbucket.qiniudn.com/foobar.txt',
  // x:foo: 'bar'
});
```

### uploadToken

```
var token = client.uploadToken();
```

or with options

- scope
- deadline

````
var token = client.uploadToken({
  deadline: utility.timestamp() + 10
});
```

### Download

```js
// download to Buffer
client.download('foo.txt', function (err, content, res) {
  // content is a Buffer instance.
  console.log('content size: %d', content.length);
});

// save as url
var url = client.saveAsURL('qn/test/dl/foo.txt', '哈哈foo.txt');
// http://qtestbucket.qiniudn.com/qn/test/dl/foo.txt?download/%E5%93%88%E5%93%88foo.txt
```

### RS Operations

```js
// stat
client.stat('foo.txt', function (err, stat) {
  console.log(stat);
  // fsize: 8,
  // hash: 'FvnDEnGu6pjzxxxc5d6IlNMrbDnH',
  // mimeType: 'text/plain',
  // putTime: 13783134309588504
});

// move
client.move('foo.txt', 'qn/bar.txt', function (err) {

});

// copy
client.copy('foo.txt', 'qn/bar.txt', function (err) {

});

// delete
client.delete('foo.txt', function (err) {

});

// list
client.list('/', function (err, result) {
  console.log(result);
  // marker: 'eyJjIjowLCJrIjoicW4vYmlnLnR4dCJ9'
  // items: [
  //   {
  //     fsize: 21944,
  //     putTime: 13783144546186030,
  //     key: 'qn/logo.png',
  //     hash: 'FvzqAF1oWlYgQ9t62k_xn_mzZ1Ki',
  //     mimeType: 'image/png'
  //   }, ...
  // ]
});
```

### Image operations

```js
// imageInfo
client.imageInfo('qn/logo.png', function (err, info) {
  console.log(info);
  // { format: 'png', width: 190, height: 150, colorModel: 'nrgba' }
});

// exif
client.exif('qn/logo.png', function (err, exif) {

});

// imageView
var url = client.imageView('qn/logo.png', {mode: 1, width: 100, height: 100, q: 50, format: 'png'});
// http://qtestbucket.qiniudn.com/qn/logo.png?imageView/1/w/100/h/100/q/50/format/png

// imageMogr
var url = client.imageMogr('qn/fixtures/gogopher.jpg', {
  thumbnail: '!50p',
  gravity: 'NorthWest',
  quality: 50,
  rotate: -50,
  format: 'gif'
});
// http://qtestbucket.qiniudn.com/qn/fixtures/gogopher.jpg?imageMogr/v2/auto-orient/thumbnail/!50p/gravity/NorthWest/quality/50/rotate/-50/format/gif

// watermark
var url = client.watermark('qn/logo.png', {
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
// http://qtestbucket.qiniudn.com/qn/fixtures/gogopher.jpg?watermark/2/text/Tm9kZS5qcyDlk4jlk4g=/font/5a6L5L2T/fontsize/500/fill/cmVk/dissolve/100/gravity/SouthEast/dx/100/dy/90
```

### Document Operations

```js
// markdown to html
var url = client.md2html('qn/test/fixtures/readme.md', {
  css: 'http://qtestbucket.qiniudn.com/qn/test/fixtures/github.css'
});
// http://qtestbucket.qiniudn.com/qn/test/fixtures/readme.md?md2html/0/css/aHR0cDovL3F0ZXN0YnVja2V0LnFpbml1ZG4uY29tL3FuL3Rlc3QvZml4dHVyZXMvZ2l0aHViLmNzcw==
```

## TODO

* [x] RS Operations
* [ ] HTTP Keep-alive
* [x] Image Operations
* [ ] Media Operations
* [x] Doc Operations
* [ ] Pipeline Operations
* [x] QR code Operations

## License

(The MIT License)

Copyright (c) 2013 - 2014 fengmk2 &lt;fengmk2@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
