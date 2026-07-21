<template>
  <section class="home">
    <h1>qiankun 微前端 Demo</h1>
    <p>
      这是基座(主应用),基于 Vue CLI + qiankun 2.10.16。点击顶部导航可加载不同技术栈的子应用:
    </p>
    <ul>
      <li>Vue 子应用 —— 演示 HTML Entry 加载与 initGlobalState 通信</li>
      <li>React 子应用 —— 演示技术栈无关与样式隔离</li>
    </ul>
    <p class="hint">切换导航时,观察控制台的全局状态变更日志。</p>
  </section>
</template>

<script>
export default { name: 'Home' }
</script>

<style scoped>
.home {
  max-width: 720px;
}
.hint {
  color: #666;
}
</style>
