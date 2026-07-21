const path = require('path')

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/single-spa/sub-react/`
    : 'http://localhost:9102/'

  return {
    entry: path.resolve(__dirname, './src/main.js'),
    output: {
      path: path.resolve(__dirname, './dist'),
      filename: 'js-app.js',
      // single-spa 子应用编译成 SystemJS 格式
      libraryTarget: 'system',
      publicPath,
      clean: true
    },
    // React 打进子应用自身 bundle(demo 简化;生产可用 import map 共享 system 格式的 React)
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader',
          options: { presets: ['@babel/preset-env', '@babel/preset-react'] }
        }
      ]
    },
    resolve: { extensions: ['.js', '.jsx'] },
    devServer: {
      port: 9102,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
