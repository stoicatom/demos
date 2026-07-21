const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

// 可移植 base:CI 注入 /demos/,本地 dev 缺省 /
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  // root-config 部署在 <base>micro-frontends/single-spa/
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/single-spa/`
    : '/'

  return {
    entry: path.resolve(__dirname, './src/root-config.js'),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'root-config.js',
      publicPath,
      clean: true
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env'] }
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.ejs',
        // 把运行时子路径注入模板,供 importmap 拼接
        templateParameters: { publicPath },
        inject: false
      })
    ],
    devServer: {
      port: 9100,
      allowedHosts: 'all',
      historyApiFallback: true,
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
