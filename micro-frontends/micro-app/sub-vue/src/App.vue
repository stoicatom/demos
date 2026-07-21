<template>
  <div class="sub-vue">
    <h2>Vue 3 子应用</h2>
    <router-view />
  </div>
</template>

<script>
export default { name: 'App' }
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
