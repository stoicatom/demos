import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 可移植 base:CI 注入 PUBLIC_BASE_PATH=/demos/,本地 dev 缺省 /
// 主应用最终部署在 <base>micro-frontends/wujie/(注意:不带 <app> 段)
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig({
  base:
    process.env.NODE_ENV === 'production'
      ? `${PUBLIC_BASE_PATH}micro-frontends/wujie/`
      : '/',
  plugins: [vue()],
  server: {
    port: 8200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
