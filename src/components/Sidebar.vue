<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <el-icon class="logo-icon"><Search /></el-icon>
        <span class="logo-text">哮喘方剂分析</span>
      </div>
    </div>

    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      router
      background-color="transparent"
      text-color="#bfcbd9"
      active-text-color="#409eff"
      :unique-opened="true"
    >
      <el-menu-item index="/">
        <el-icon><HomeFilled /></el-icon>
        <span>搜索界面</span>
      </el-menu-item>

      <el-menu-item index="/prescriptions">
        <el-icon><Notebook /></el-icon>
        <span>方剂列表</span>
      </el-menu-item>

      <el-sub-menu index="/detail">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>详情分析</span>
        </template>
        <el-menu-item index="/detail">方剂详情</el-menu-item>
        <el-menu-item index="/expert">专家模式</el-menu-item>
      </el-sub-menu>

      <el-menu-item index="/node-editor">
        <el-icon><Connection /></el-icon>
        <span>节点编排</span>
      </el-menu-item>

      <el-menu-item index="/settings">
        <el-icon><Setting /></el-icon>
        <span>系统设置</span>
      </el-menu-item>
    </el-menu>

    <div class="sidebar-footer">
      <div class="version-info">v1.0.0</div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Search, HomeFilled, Notebook, Document, Connection, Setting } from '@element-plus/icons-vue'

const route = useRoute()

const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.sidebar {
  width: 220px;
  height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  font-size: 24px;
  color: #409eff;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
}

.sidebar-menu {
  flex: 1;
  padding: 16px 0;
}

.sidebar-menu :deep(.el-menu-item),
.sidebar-menu :deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 4px 12px;
  border-radius: 8px;
}

.sidebar-menu :deep(.el-menu-item:hover),
.sidebar-menu :deep(.el-sub-menu__title:hover) {
  background: rgba(64, 158, 255, 0.1);
}

.sidebar-menu :deep(.el-menu-item.is-active),
.sidebar-menu :deep(.el-sub-menu.is-active .el-sub-menu__title) {
  background: rgba(64, 158, 255, 0.2);
}

.sidebar-menu :deep(.el-sub-menu__icon-arrow) {
  color: rgba(191, 203, 217, 0.6);
}

.sidebar-menu :deep(.el-menu-item-group) {
  padding: 0;
}

.sidebar-menu :deep(.el-menu-item-group__title) {
  padding: 8px 20px 8px 48px;
  font-size: 12px;
  color: rgba(191, 203, 217, 0.4);
}

.sidebar-menu :deep(.el-sub-menu .el-menu-item) {
  padding-left: 56px !important;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.version-info {
  font-size: 12px;
  color: rgba(191, 203, 217, 0.4);
  text-align: center;
}
</style>