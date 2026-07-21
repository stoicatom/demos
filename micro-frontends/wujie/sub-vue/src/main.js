import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import Home from './Home.vue'

// hash 路由:规避 GitHub Pages 无 rewrite 时的刷新 404
const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/', component: Home }]
})

createApp(App).use(router).mount('#app')
