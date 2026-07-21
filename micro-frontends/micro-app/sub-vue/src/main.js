import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './Home.vue'

// micro-app 下发的 baseroute;独立运行时回退到 '/'
const BASE_ROUTE = window.__MICRO_APP_BASE_ROUTE__ || '/'

// 子应用用 hash 路由,规避 GitHub Pages 无 rewrite 的 404
const router = createRouter({
  history: createWebHashHistory(BASE_ROUTE),
  routes: [{ path: '/', component: Home }]
})

const app = createApp(App)
app.use(router)
app.mount('#sub-vue-root')

// 官方约定:导出 unmount 供主应用卸载子应用时调用
window.unmount = () => {
  app.unmount()
}
