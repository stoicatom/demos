const { defineConfig } = require('@vue/cli-service')

// 可移植 base:CI 注入 PUBLIC_BASE_PATH=/demos/,本地 dev 缺省 /
// 主应用最终部署在 <base>micro-frontends/qiankun/
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'
const publicPath =
  process.env.NODE_ENV === 'production'
    ? `${PUBLIC_BASE_PATH}micro-frontends/qiankun/`
    : '/'

module.exports = defineConfig({
  publicPath,
  transpileDependencies: true,
  devServer: {
    port: 7100,
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
