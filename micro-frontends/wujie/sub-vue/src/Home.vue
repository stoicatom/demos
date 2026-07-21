<template>
  <div class="sub-vue">
    <h2>Vue 3 子应用</h2>
    <p>
      计数器:<button @click="count++">count is {{ count }}</button>
    </p>
    <div class="msg">
      <strong>收到主应用消息:</strong>
      <span v-if="lastMsg">{{ lastMsg.text }}（ts: {{ lastMsg.ts }}）</span>
      <em v-else>暂无,点主应用「广播消息」按钮</em>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return { count: 0, lastMsg: null }
  },
  mounted() {
    // wujie 注入 window.$wujie;独立运行时可能不存在,做兜底
    window.$wujie?.bus.$on('main-message', this.onMainMessage)
  },
  beforeUnmount() {
    window.$wujie?.bus.$off('main-message', this.onMainMessage)
  },
  methods: {
    onMainMessage(payload) {
      this.lastMsg = payload
    }
  }
}
</script>

<style>
.sub-vue {
  margin: 12px;
  padding: 20px;
  border: 2px dashed #2f9d74;
  border-radius: 8px;
  color: #2f9d74;
}
.sub-vue button {
  cursor: pointer;
}
.sub-vue .msg {
  margin-top: 16px;
  color: #333;
}
</style>
