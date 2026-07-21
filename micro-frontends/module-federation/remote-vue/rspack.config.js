const { ModuleFederationPlugin } = require('@module-federation/enhanced/rspack')
const { VueLoaderPlugin } = require('vue-loader')
const deps = require('./package.json').dependencies

const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production'
  const publicPath = isProd
    ? `${PUBLIC_BASE_PATH}micro-frontends/module-federation/remote-vue/`
    : 'auto'

  return {
    entry: './src/index.js',
    mode: argv.mode || 'development',
    output: { publicPath, clean: true },
    resolve: { extensions: ['.js', '.vue'] },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          // Rspack 内置 CSS 与 vue-loader 协作需开启此项
          options: { experimentalInlineMatchResource: true }
        },
        { test: /\.css$/, type: 'css' }
      ]
    },
    experiments: { css: true },
    plugins: [
      new VueLoaderPlugin(),
      new ModuleFederationPlugin({
        name: 'remote_vue',
        filename: 'remoteEntry.js',
        // 暴露一个框架无关的 mount 函数,host(React)也能挂载 Vue 应用
        exposes: { './mount': './src/mount.js' },
        shared: {
          vue: { singleton: true, requiredVersion: deps.vue }
        }
      })
    ],
    devServer: {
      port: 8101,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' }
    }
  }
}
