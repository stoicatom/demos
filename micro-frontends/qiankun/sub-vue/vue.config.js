const { defineConfig } = require('@vue/cli-service')
const { name } = require('./package.json')

// 独立运行/构建时的 publicPath;被 qiankun 加载时会被 public-path.js 运行时覆盖
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'
const publicPath =
  process.env.NODE_ENV === 'production'
    ? `${PUBLIC_BASE_PATH}micro-frontends/qiankun/sub-vue/`
    : '//localhost:7101'

module.exports = defineConfig({
  publicPath,
  transpileDependencies: true,
  devServer: {
    port: 7101,
    allowedHosts: 'all',
    headers: {
      // qiankun 用 fetch 拉取子应用资源,必须允许跨域
      'Access-Control-Allow-Origin': '*'
    }
  },
  configureWebpack: {
    output: {
      // 打包成 umd,qiankun 才能识别子应用导出的生命周期
      library: `${name}-[name]`,
      libraryTarget: 'umd',
      chunkLoadingGlobal: `webpackJsonp_${name}`
    }
  }
})
