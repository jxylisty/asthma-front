<template>
  <div class="detail">
    <h1>科普详情页</h1>
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import axios from 'axios'

export default {
  name: 'Detail',
  data() {
    return {
      chart: null,
      prescriptionData: null
    }
  },
  mounted() {
    this.initChart()
    this.fetchPrescriptionData()
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer)
    },
    async fetchPrescriptionData() {
      try {
        const response = await axios.get('http://localhost:8000/api/prescriptions/小青龙汤')
        this.prescriptionData = response.data
        this.updateChart()
      } catch (error) {
        console.error('获取数据失败:', error)
      }
    },
    updateChart() {
      if (!this.prescriptionData) return

      const radarData = this.prescriptionData.radar_data
      const option = {
        title: {
          text: `${this.prescriptionData.prescription_name} - 疗效指标`
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
            value: [
              radarData.anti_inflammatory,
              radarData.anti_asthmatic,
              radarData.immune_regulation,
              radarData.anti_allergic,
              radarData.phlegm_resolving
            ],
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