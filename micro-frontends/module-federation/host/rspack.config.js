const rspack = require('@rspack/core')
const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack')
const deps = require('./package.json').dependencies

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  // host 部署在 <base>micro-frontends/module-federation/host/
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/module-federation/host/`
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
        name: 'host',
        // remote 地址运行时注入(见 src/bootstrap.js 的 registerRemotes),这里不写死
        remotes: {},
        shared: {
          react: { singleton: true, requiredVersion: deps.react },
          'react-dom': { singleton: true, requiredVersion: deps['react-dom'] }
        }
      }),
      new rspack.HtmlRspackPlugin({ template: './public/index.html' })
    ],
    devServer: {
      port: 8100,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
