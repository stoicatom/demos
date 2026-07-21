<template>
  <section>
    <p>这是通过 micro-app(iframe 沙箱)加载的 Vue 3 子应用。</p>
    <p>计数器验证子应用自身状态正常:{{ count }}</p>
    <button @click="count++">+1</button>

    <div class="data-box">
      <strong>收到主应用数据(addDataListener):</strong>
      <pre v-if="received">{{ received }}</pre>
      <em v-else>暂无,点击主应用「发送数据给子应用」试试</em>
    </div>
  </section>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'Home',
  setup() {
    const count = ref(0)
    const received = ref('')

    // micro-app EventCenter:监听主应用下发的数据
    const listener = (data) => {
      received.value = JSON.stringify(data, null, 2)
    }

    onMounted(() => {
      // 独立运行时 window.microApp 不存在,用可选链兜底
      window.microApp?.addDataListener(listener)
      // 也可主动拉取已有数据
      const init = window.microApp?.getData()
      if (init) received.value = JSON.stringify(init, null, 2)
    })

    onUnmounted(() => {
      window.microApp?.removeDataListener(listener)
    })

    return { count, received }
  }
}
</script>

<style scoped>
.data-box {
  margin-top: 16px;
  padding: 12px;
  background: #f4faf7;
  border-radius: 6px;
}
pre {
  margin: 8px 0 0;
  color: #2f9d74;
}
</style>
