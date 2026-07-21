import { createApp } from 'vue'
import WujieVue from 'wujie-vue3'
import App from './App.vue'

const app = createApp(App)
// 官方接入:注册 WujieVue 全局组件,模板中即可使用 <WujieVue />
app.use(WujieVue)
app.mount('#app')
