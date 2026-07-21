import { registerApplication, start } from 'single-spa'

// root-config 部署路径前缀(webpack publicPath 注入);dev 为 '/'
// __webpack_public_path__ 由 webpack 运行时提供,形如 /demos/micro-frontends/single-spa/
// eslint-disable-next-line camelcase, no-undef
const BASE = __webpack_public_path__ || '/'

// activeWhen 需带 base 前缀,才能在子路径部署时正确匹配
const prefix = (route) => (location) =>
  location.pathname.startsWith(`${BASE}${route}`)

registerApplication({
  name: '@mf-demo/sub-vue',
  app: () => System.import('@mf-demo/sub-vue'),
  activeWhen: prefix('vue')
})

registerApplication({
  name: '@mf-demo/sub-react',
  app: () => System.import('@mf-demo/sub-react'),
  activeWhen: prefix('react')
})

// Vue3 router 要求开启 urlRerouteOnly(官方说明)
start({ urlRerouteOnly: true })
