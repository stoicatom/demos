<template>
  <div class="layout">
    <header class="topbar">
      <strong>micro-app 主应用</strong>
      <nav>
        <button :class="{ active: current === 'sub-vue' }" @click="current = 'sub-vue'">
          Vue 子应用
        </button>
        <button :class="{ active: current === 'sub-react' }" @click="current = 'sub-react'">
          React 子应用
        </button>
      </nav>
      <button class="send" @click="sendData">发送数据给子应用</button>
    </header>

    <main class="viewport">
      <!--
        Vite 产物为原生 ESM(type=module),无法被 with 作用域沙箱拦截,
        官方要求 Vite 子应用必须加 iframe 属性切到 iframe 沙箱。
        name 唯一标识子应用,url 为子应用入口,baseroute 下发给子应用路由。
      -->
      <micro-app
        v-if="current === 'sub-vue'"
        name="sub-vue"
        :url="subVueUrl"
        baseroute="/sub-vue"
        iframe
      ></micro-app>
      <micro-app
        v-else
        name="sub-react"
        :url="subReactUrl"
        baseroute="/sub-react"
        iframe
      ></micro-app>
    </main>
  </div>
</template>

<script>
import microApp from '@micro-zoe/micro-app'

// 运行时拼接子应用 url,零硬编码:
// dev 走各自独立端口;prod 为主应用 base 下的同级子目录
const isDev = import.meta.env.DEV
const BASE = import.meta.env.BASE_URL
const subVueUrl = isDev
  ? 'http://localhost:8301/'
  : `${location.origin}${BASE}sub-vue/`
const subReactUrl = isDev
  ? 'http://localhost:8302/'
  : `${location.origin}${BASE}sub-react/`

export default {
  name: 'App',
  data() {
    return {
      current: 'sub-vue',
      subVueUrl,
      subReactUrl,
      count: 0
    }
  },
  methods: {
    sendData() {
      // 官方 EventCenter:向当前激活子应用下发数据
      this.count += 1
      microApp.setData(this.current, {
        msg: `来自主应用的问候 #${this.count}`,
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
  background: #b0111f;
  color: #fff;
}
.topbar nav {
  display: flex;
  gap: 8px;
}
.topbar nav button {
  border: 1px solid #ffb3ba;
  background: transparent;
  color: #ffd9dc;
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
}
.topbar nav button.active {
  background: #fff;
  color: #b0111f;
  font-weight: 600;
}
.topbar .send {
  margin-left: auto;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 4px;
  border: none;
}
.viewport {
  padding: 20px;
}
</style>
