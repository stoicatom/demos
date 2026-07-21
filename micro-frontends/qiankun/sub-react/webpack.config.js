const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { name } = require('./package.json')

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/qiankun/sub-react/`
    : 'http://localhost:7102/'

  return {
    entry: path.resolve(__dirname, './src/index.js'),
    output: {
      path: path.resolve(__dirname, './dist'),
      publicPath,
      // 打包成 umd,导出 qiankun 生命周期
      library: `${name}`,
      libraryTarget: 'umd',
      chunkLoadingGlobal: `webpackJsonp_${name.replace(/[@/-]/g, '_')}`,
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      ]
    },
    resolve: { extensions: ['.js', '.jsx'] },
    plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
    devServer: {
      port: 7102,
      historyApiFallback: true,
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
