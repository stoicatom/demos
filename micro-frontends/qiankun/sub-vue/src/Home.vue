<template>
  <section>
    <p>这是通过 qiankun HTML Entry 加载的 Vue 3 子应用。</p>
    <p>计数器验证子应用自身状态正常:{{ count }}</p>
    <button @click="count++">+1</button>
  </section>
</template>

<script>
import { ref } from 'vue'
export default {
  name: 'Home',
  setup() {
    const count = ref(0)
    return { count }
  }
}
</script>
