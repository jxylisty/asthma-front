<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

#app {
  width: 100%;
  min-height: 100vh;
}

/* Element Plus 暗色主题适配 */
.el-dialog {
  border-radius: 16px !important;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.6);
}

/* 选中文字颜色 */
::selection {
  background: rgba(64, 158, 255, 0.3);
  color: inherit;
}
</style>