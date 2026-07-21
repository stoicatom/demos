const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack')
const deps = require('./package.json').dependencies

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/module-federation/remote-react/`
    : 'auto'

  return {
    entry: './src/index.js',
    mode: argv.mode || 'development',
    output: { publicPath, clean: true },
    resolve: { extensions: ['.js', '.jsx'] },
    module: {
      rules: [
        {
          test: /\.jsx$/,
          use: {
            loader: 'builtin:swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'ecmascript', jsx: true },
                transform: { react: { runtime: 'automatic' } }
              }
            }
          }
        }
      ]
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'remote_react',
        filename: 'remoteEntry.js',
        // 暴露 App 组件;host 用 loadRemote('remote_react/App') 消费
        exposes: { './App': './src/App.jsx' },
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, requiredVersion: deps['react-dom'] }
        }
      })
    ],
    devServer: {
      port: 8102,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
