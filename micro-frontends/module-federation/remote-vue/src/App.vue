<template>
  <div class="remote-vue">
    <h2>Vue 3 远程模块</h2>
    <p>这是 Module Federation 的 Vue remote,通过框架无关的 mount 契约被 React host 加载。</p>
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

<style>
.remote-vue {
  padding: 16px;
  border: 2px dashed #2f9d74;
  border-radius: 8px;
}
.remote-vue h2 {
  color: #2f9d74;
}
</style>
