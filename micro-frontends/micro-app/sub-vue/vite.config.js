import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 可移植 base:CI 注入 PUBLIC_BASE_PATH=/demos/,本地 dev 缺省 /
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig({
  base:
    process.env.NODE_ENV === 'production'
      ? `${PUBLIC_BASE_PATH}micro-frontends/micro-app/sub-vue/`
      : '/',
  plugins: [vue()],
  server: {
    port: 8301,
    headers: {
      // micro-app 通过 fetch 拉取子应用资源,必须允许跨域
      'Access-Control-Allow-Origin': '*'
    }
  }
})
