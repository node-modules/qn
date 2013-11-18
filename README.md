qn [![Build Status](https://secure.travis-ci.org/fengmk2/qn.png)](http://travis-ci.org/fengmk2/qn) [![Coverage Status](https://coveralls.io/repos/fengmk2/qn/badge.png)](https://coveralls.io/r/fengmk2/qn) [![Build Status](https://drone.io/github.com/fengmk2/qn/status.png)](https://drone.io/github.com/fengmk2/qn/latest)
=======

[![NPM](https://nodei.co/npm/qn.png?downloads=true&stars=true)](https://nodei.co/npm/qn)

![logo](https://raw.github.com/fengmk2/qn/master/logo.png)

Another [qiniu](http://docs.qiniu.com/api/) API client for Node.js.

## Install

```bash
$ npm install qn
```

## Usage

### Upload

```js
var qn = require('qn');

var client = qn.create({
  accessKey: 'your access key',
  secretKey: 'your secret key',
  bucket: 'your bucket name',
  domain: 'http://{bucket}.u.qiniudn.com',
  // timeout: 3600000, // default rpc timeout: one hour, optional
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
client.upload('哈哈', {filename: 'haha.txt'}, function (err, result) {
  console.log(result);
  // hash: 'FptOdeKmWhcYHUXa5YmNZxJC934B',
  // key: 'foobar.txt',
  // url: 'http://qtestbucket.qiniudn.com/foobar.txt',
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

* [√] RS Operations
* [ ] HTTP Keep-alive
* [√] Image Operations
* [ ] Media Operations
* [√] Doc Operations
* [ ] Pipeline Operations
* [√] QR code Operations

## Authors

```bash
$ git summary

 project  : qn
 repo age : 3 days
 active   : 4 days
 commits  : 22
 files    : 30
 authors  :
    22  fengmk2                 100.0%
```

## License

(The MIT License)

Copyright (c) 2013 fengmk2 &lt;fengmk2@gmail.com&gt;

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
