import { createApp } from 'vue'
import microApp from '@micro-zoe/micro-app'
import App from './App.vue'

createApp(App).mount('#app')

// 官方入口:启动 micro-app(默认懒加载,预取由属性/配置控制)
microApp.start()
