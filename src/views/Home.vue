<template>
  <div class="home">
    <h1>哮喘方剂分析系统</h1>
    <p>基于入血预测的中医治疗儿童哮喘作用机制分析</p>
    <div class="nav-buttons">
      <el-button type="primary" @click="$router.push('/detail')">查看详情</el-button>
      <el-button type="success" @click="$router.push('/expert')">专家模式</el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home {
  text-align: center;
  padding: 50px;
}
.nav-buttons {
  margin-top: 30px;
}
.nav-buttons .el-button {
  margin: 0 10px;
}
</style>