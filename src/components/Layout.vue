<template>
  <div class="layout-container">
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Sidebar from './Sidebar.vue'
</script>

<style scoped>
.layout-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 220px;
  min-height: 100vh;
}
</style>