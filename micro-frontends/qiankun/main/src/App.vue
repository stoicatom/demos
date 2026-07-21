<template>
  <div class="layout">
    <header class="topbar">
      <strong>qiankun 主应用</strong>
      <nav>
        <router-link :to="base">首页</router-link>
        <a :href="base + 'app-vue'">Vue 子应用</a>
        <a :href="base + 'app-react'">React 子应用</a>
      </nav>
      <button @click="ping">向子应用广播 state</button>
    </header>
    <!-- 首页由主应用路由渲染;子应用挂载到 viewport -->
    <router-view />
    <main id="subapp-viewport" class="viewport"></main>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return { base: process.env.BASE_URL }
  },
  methods: {
    ping() {
      window.__QIANKUN_ACTIONS__?.setGlobalState({
        from: 'main',
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
.topbar a,
.topbar :deep(a) {
  color: #9cc0ff;
  text-decoration: none;
}
.topbar button {
  margin-left: auto;
  cursor: pointer;
}
.viewport {
  padding: 20px;
}
</style>
