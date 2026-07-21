<template>
  <div class="sub-vue">
    <h2>Vue 3 子应用</h2>
    <p>这是通过 single-spa + SystemJS import map 加载的 Vue 3 子应用。</p>
    <p>计数器:{{ count }}</p>
    <button @click="count++">+1</button>
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'App',
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>

<style scoped>
.sub-vue {
  padding: 16px;
  border: 2px dashed #2f9d74;
  border-radius: 8px;
}
h2 {
  color: #2f9d74;
}
</style>
