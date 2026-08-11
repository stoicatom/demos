/*
 * @Author: lorain lorainwings@gmail.com
 * @Date: 2022-08-19 20:53:59
 * @LastEditors: lorain lorainwings@gmail.com
 * @LastEditTime: 2022-08-20 00:51:03
 * @FilePath: /demos/node/node-server/http-static-server.js
 * @Description: 静态服务器
 */

const http = require('http')
const url = require('url')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')

const server = http.createServer((req, res) => {
    if (path.normalize(decodeURIComponent(pathname)) !== decodeURIComponent(pathname)) {
        res.statusCode = 403;
        res.end();
        return;
    }
  const { pathname, query } = url.parse(req.url)
  const name = decodeURIComponent(pathname)
  const assets = path.join(__dirname, 'assets', name)

  fs.stat(assets, (err, info) => {
    if (err) {
      res.statusCode = 404
      res.end('oops! Not Fount!')
      return
    }

    if (info.isFile()) {
      // 流式读取
      /* 访问路径  localhost:1234/index.html */
      res.setHeader('Content-Type', `${mime.lookup(assets)};charset=utf-8`)
      const rs = fs.createReadStream(assets)
      rs.pipe(res)
    } else if (info.isDirectory()) {
      // 一次性读取
      /* 访问路径 localhost:1234/www */
      const absp = path.join(assets, '章若楠.html')
      fs.readFile(absp, (err, chunk) => {
        res.setHeader('Content-Type', `${mime.lookup(assets)};charset=utf-8`)
        res.end(chunk)
      })
    }
  })
})

server.listen(1234, () => {
  console.log('静态服务已开启')
})
