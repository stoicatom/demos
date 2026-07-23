import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { registerMicroApps, initGlobalState, start } from 'qiankun'
import App from './App.vue'
import Home from './Home.vue'

// Vue CLI 运行时注入的 publicPath:dev 为 '/',prod 为 '/demos/micro-frontends/qiankun/'
const BASE = process.env.BASE_URL

const router = createRouter({
  history: createWebHistory(BASE),
  routes: [{ path: '/', component: Home }]
})

createApp(App).use(router).mount('#app')

// GitHub Pages 404 fallback:从 ?redirect= 恢复路由状态
const params = new URLSearchParams(location.search)
const redirect = params.get('redirect')
if (redirect) {
  // 清除 query 参数并跳转到原路径(qiankun 会根据 activeRule 激活子应用)
  history.replaceState(null, '', BASE + redirect.replace(/^\//, ''))
}

// 开发环境子应用跑在独立端口(跨域);生产环境为同源子目录
const isDev = process.env.NODE_ENV !== 'production'
const subVueEntry = isDev ? '//localhost:7101' : `${BASE}sub-vue/`
const subReactEntry = isDev ? '//localhost:7102' : `${BASE}sub-react/`

// 注册微应用:entry / activeRule 均基于运行时 BASE 拼接,零硬编码。
// activeRule 用 app-vue / app-react,与子应用静态目录 sub-vue / sub-react 区分开,
// 避免生产环境路由前缀与子应用静态资源目录路径冲突。
registerMicroApps([
  {
    name: 'qiankun-sub-vue',
    entry: subVueEntry,
    container: '#subapp-viewport',
    activeRule: `${BASE}app-vue`
  },
  {
    name: 'qiankun-sub-react',
    entry: subReactEntry,
    container: '#subapp-viewport',
    activeRule: `${BASE}app-react`
  }
])

// 官方全局状态:主子应用共享登录态等
const actions = initGlobalState({ user: 'atom', from: 'main' })
actions.onGlobalStateChange((state, prev) => {
  // eslint-disable-next-line no-console
  console.log('[main] global state changed', state, prev)
})
// 暴露给主应用组件使用
window.__QIANKUN_ACTIONS__ = actions

start({
  prefetch: 'all',
  sandbox: { experimentalStyleIsolation: true }
})
