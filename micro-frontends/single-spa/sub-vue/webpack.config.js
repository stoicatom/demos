const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/single-spa/sub-vue/`
    : 'http://localhost:9101/'

  return {
    entry: path.resolve(__dirname, './src/main.js'),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'js-app.js',
      // single-spa 子应用编译成 SystemJS 格式,供 import map 加载
      libraryTarget: 'system',
      publicPath,
      clean: true
    },
    module: {
      rules: [
        { test: /\.vue$/, loader: 'vue-loader' },
        { test: /\.css$/, use: ['vue-style-loader', 'css-loader'] }
      ]
    },
    resolve: { extensions: ['.js', '.vue'] },
    plugins: [new VueLoaderPlugin()],
    devServer: {
      port: 9101,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
