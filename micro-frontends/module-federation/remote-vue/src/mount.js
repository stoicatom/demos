import { createApp } from 'vue'
import App from './App.vue'

// 框架无关的挂载契约:host 传入 DOM 容器,返回卸载函数
export function mount(container) {
  const app = createApp(App)
  app.mount(container)
  return () => app.unmount()
}
