import './public-path'
import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './Home.vue'

let app = null
let historyRef = null

function render(props = {}) {
  const { container, onGlobalStateChange } = props

  // 子应用用 hash 路由,规避 GitHub Pages 无 rewrite 的 404
  const router = createRouter({
    history: createWebHashHistory(),
    routes: [{ path: '/', component: Home }]
  })
  historyRef = router

  app = createApp(App)
  app.use(router)

  // 监听主应用下发的全局状态
  if (onGlobalStateChange) {
    onGlobalStateChange((state, prev) => {
      // eslint-disable-next-line no-console
      console.log('[sub-vue] global state', state, prev)
    }, true)
  }

  const mountPoint = container
    ? container.querySelector('#sub-vue-root')
    : '#sub-vue-root'
  app.mount(mountPoint)
}

// 独立运行(非 qiankun 环境)时直接渲染
if (!window.__POWERED_BY_QIANKUN__) {
  render()
}

// qiankun 生命周期
export async function bootstrap() {}

export async function mount(props) {
  render(props)
}

export async function unmount() {
  app?.unmount()
  app = null
  historyRef = null
}
