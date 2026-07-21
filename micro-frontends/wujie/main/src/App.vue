<template>
  <div class="layout">
    <header class="topbar">
      <strong>wujie 主应用</strong>
      <nav>
        <button
          :class="{ active: current === 'sub-vue' }"
          @click="current = 'sub-vue'"
        >
          Vue 子应用
        </button>
        <button
          :class="{ active: current === 'sub-react' }"
          @click="current = 'sub-react'"
        >
          React 子应用
        </button>
      </nav>
      <button class="broadcast" @click="broadcast">广播消息</button>
    </header>

    <main class="viewport">
      <!-- alive 保活模式:子应用无需生命周期改造,只需满足 CORS -->
      <WujieVue
        width="100%"
        height="500px"
        :name="current"
        :url="url"
        :sync="false"
        :alive="true"
      />
    </main>
  </div>
</template>

<script>
import { bus } from 'wujie'

// dev:子应用跑在独立端口(跨域);prod:同源子目录,用运行时 BASE 拼接
const isDev = import.meta.env.DEV
const BASE = import.meta.env.BASE_URL

const urls = {
  'sub-vue': isDev
    ? 'http://localhost:8201/'
    : `${location.origin}${BASE}sub-vue/`,
  'sub-react': isDev
    ? 'http://localhost:8202/'
    : `${location.origin}${BASE}sub-react/`
}

export default {
  name: 'App',
  data() {
    return { current: 'sub-vue' }
  },
  computed: {
    url() {
      return urls[this.current]
    }
  },
  methods: {
    broadcast() {
      // 官方 bus 通信:主应用 $emit,子应用 window.$wujie.bus.$on
      bus.$emit('main-message', {
        from: 'main',
        text: '来自主应用的问候',
        ts: Date.now()
      })
    }
  }
}
</script>

<style>
body {
  margin: 0;
  font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.topbar {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 12px 20px;
  background: #16315f;
  color: #fff;
}
.topbar nav {
  display: flex;
  gap: 12px;
}
.topbar nav button {
  cursor: pointer;
  border: 1px solid #9cc0ff;
  background: transparent;
  color: #9cc0ff;
  padding: 6px 14px;
  border-radius: 4px;
}
.topbar nav button.active {
  background: #9cc0ff;
  color: #16315f;
}
.topbar .broadcast {
  margin-left: auto;
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 4px;
  border: none;
}
.viewport {
  padding: 20px;
}
</style>
