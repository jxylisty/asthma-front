<template>
  <div class="home">
    <h1>哮喘方剂分析系统</h1>
    <p>基于入血预测的中医治疗儿童哮喘作用机制分析</p>

    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="请输入方剂名称..."
        @keyup.enter="handleSearch"
        clearable
      >
        <template #suffix>
          <el-icon class="search-icon"><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <div class="nav-buttons">
      <el-button type="primary" @click="$router.push('/detail')">查看详情</el-button>
      <el-button type="success" @click="$router.push('/expert')">专家模式</el-button>
    </div>
  </div>
</template>

<script>
import { Search } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Search
  },
  data() {
    return {
      searchQuery: ''
    }
  },
  methods: {
    async handleSearch() {
      if (!this.searchQuery.trim()) return

      const loading = this.$loading({
        lock: true,
        text: '正在分析方剂成分...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      })

      await new Promise(resolve => setTimeout(resolve, 1500))

      loading.close()
      this.$router.push('/detail')
    }
  }
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 50px;
}
.search-box {
  margin: 30px auto;
  width: 500px;
}
.nav-buttons {
  margin-top: 30px;
}
.nav-buttons .el-button {
  margin: 0 10px;
}
</style>