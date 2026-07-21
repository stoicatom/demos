import { h, createApp } from 'vue'
import singleSpaVue from 'single-spa-vue'
import App from './App.vue'

// single-spa-vue 把 Vue 实例包装成 single-spa 生命周期
const vueLifecycles = singleSpaVue({
  createApp,
  appOptions: {
    // 显式挂载到基座 viewport,避免自动建 DOM 时的属性冲突
    el: '#app-viewport',
    render: () => h(App)
  }
})

export const bootstrap = vueLifecycles.bootstrap
export const mount = vueLifecycles.mount
export const unmount = vueLifecycles.unmount
