<template>
  <div class="detail">
    <h1>科普详情页 - 降气平哮方</h1>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'Detail',
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    this.initChart()
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer)
      const option = {
        title: {
          text: '降气平哮方 - 疗效指标'
        },
        tooltip: {
          trigger: 'item'
        },
        radar: {
          indicator: [
            { name: '抗炎', max: 100 },
            { name: '平喘', max: 100 },
            { name: '免疫调节', max: 100 },
            { name: '抗过敏', max: 100 },
            { name: '化痰', max: 100 }
          ]
        },
        series: [{
          type: 'radar',
          data: [{
            value: [85, 90, 75, 80, 88],
            name: '疗效指标',
            areaStyle: {
              color: 'rgba(64, 158, 255, 0.3)'
            }
          }]
        }]
      }
      this.chart.setOption(option)
    }
  }
}
</script>

<style scoped>
.detail {
  padding: 20px;
}
.chart-container {
  width: 600px;
  height: 400px;
  margin: 20px auto;
}
</style>