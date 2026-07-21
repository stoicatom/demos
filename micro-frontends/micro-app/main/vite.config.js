import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 可移植 base:CI 注入 PUBLIC_BASE_PATH=/demos/,本地 dev 缺省 /
// 主应用最终部署在 <base>micro-frontends/micro-app/(不带 <app> 后缀)
const PUBLIC_BASE_PATH = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig({
  base:
    process.env.NODE_ENV === 'production'
      ? `${PUBLIC_BASE_PATH}micro-frontends/micro-app/`
      : '/',
  plugins: [
    vue({
      // 让 Vue 编译器把 <micro-app> 当作自定义元素,不做组件解析
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'micro-app'
        }
      }
    })
  ],
  server: {
    port: 8300,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  }
})
