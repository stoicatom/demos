import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 可移植 base:CI 注入 PUBLIC_BASE_PATH=/demos/,本地 dev 缺省 /
// 子应用最终部署在 <base>micro-frontends/wujie/sub-react/
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig({
  base:
    process.env.NODE_ENV === 'production'
      ? `${PUBLIC_BASE_PATH}micro-frontends/wujie/sub-react/`
      : '/',
  plugins: [react()],
  server: {
    port: 8202,
    // wujie 要求子应用开启 CORS,主应用才能 fetch 到 HTML/JS
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
