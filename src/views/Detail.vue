<template>
  <div class="detail-container">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <div class="logo" @click="$router.push('/')">
        <el-icon><HomeFilled /></el-icon>
        <span>哮喘方剂智能分析系统</span>
      </div>
      <el-button type="primary" class="expert-btn" @click="$router.push('/expert')">
        <el-icon><Setting /></el-icon>
        切换至专家/开发者模式
      </el-button>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 模块 A：方剂全景特征卡 -->
      <div class="module-a card">
        <div class="card-header">
          <h2>方剂全景特征</h2>
          <div class="header-actions">
            <el-tag type="success" effect="dark">南京中医药大学附属医院 经验方</el-tag>
            <el-button class="speech-btn" :class="{ speaking: isSpeakingHerbs }" size="small" @click="toggleSpeakHerbs">
              <el-icon><VideoPause v-if="isSpeakingHerbs" /><Mic v-else /></el-icon>
              {{ isSpeakingHerbs ? '停止' : '播报' }}
            </el-button>
          </div>
        </div>
        <div class="prescription-info">
          <h1 class="prescription-name">{{ prescriptionInfo?.name || '加载中...' }}</h1>
          <div class="syndrome-tag">
            <el-tag v-if="prescriptionInfo?.indication_type" type="warning" effect="plain">证型：{{ prescriptionInfo.indication_type }}</el-tag>
          </div>
        </div>
        <div class="herb-section">
          <h3>药材组成</h3>
          <div class="herb-grid">
            <el-tooltip
              v-for="herb in herbs"
              :key="herb.name"
              placement="top"
              effect="light"
              :width="280"
            >
              <template #content>
                <div class="herb-tooltip">
                  <div class="tooltip-title">{{ herb.name }}</div>
                  <div class="tooltip-desc">{{ herb.description }}</div>
                </div>
              </template>
              <div class="herb-item">
                <div class="herb-icon">{{ herb.name.charAt(0) }}</div>
                <span>{{ herb.name }}</span>
              </div>
            </el-tooltip>
          </div>
        </div>
      </div>

      <!-- 模块 B：成分入血预测战力面板 -->
      <div class="module-b card">
        <div class="card-header">
          <h2>成分入血预测战力面板</h2>
          <div class="header-actions">
            <el-tag type="info" effect="plain">PU 学习算法预测结果</el-tag>
            <el-button class="speech-btn" :class="{ speaking: isSpeakingCompounds }" size="small" @click="toggleSpeakCompounds">
              <el-icon><VideoPause v-if="isSpeakingCompounds" /><Mic v-else /></el-icon>
              {{ isSpeakingCompounds ? '停止' : '播报' }}
            </el-button>
          </div>
        </div>
        <div class="compound-list">
          <div
            v-for="(compound, index) in compounds"
            :key="compound.name"
            class="compound-item"
          >
            <div class="compound-header">
              <span class="compound-rank">TOP {{ index + 1 }}</span>
              <span class="compound-name">{{ compound.name }}</span>
              <span class="compound-prob">{{ compound.probability }}%</span>
            </div>
            <el-progress
              :percentage="compound.probability"
              :stroke-width="12"
              :color="getProgressColor(compound.probability)"
              class="compound-progress"
            />
            <div class="compound-desc">
              <el-icon><InfoFilled /></el-icon>
              {{ compound.description }}
            </div>
          </div>
        </div>
      </div>

      <!-- 模块 C：干预效能雷达图 -->
      <div class="module-c card">
        <div class="card-header">
          <h2>干预效能雷达图</h2>
          <div class="header-actions">
            <el-tooltip placement="top" effect="light">
              <template #content>
                <div class="radar-tip">
                  注：本指数基于网络药理学 KEGG 通路富集分析映射算法得出
                </div>
              </template>
              <el-icon class="info-icon"><QuestionFilled /></el-icon>
            </el-tooltip>
            <el-button class="speech-btn" :class="{ speaking: isSpeakingRadar }" size="small" @click="toggleSpeakRadar">
              <el-icon><VideoPause v-if="isSpeakingRadar" /><Mic v-else /></el-icon>
              {{ isSpeakingRadar ? '停止' : '播报' }}
            </el-button>
          </div>
        </div>
        <div ref="radarChart" class="radar-chart"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import * as echarts from 'echarts'
import { HomeFilled, Setting, InfoFilled, QuestionFilled, Mic, VideoPause } from '@element-plus/icons-vue'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'
import { getPrescriptionDetail, getPrescriptionRadar, getPrescriptionCompounds } from '../api'

const { speak, stop } = useSpeech()
const { speechVoice, speechRate, speechPitch, speechEnabled } = useSettings()

const router = useRouter()
const route = useRoute()
const radarChart = ref(null)

// 响应式数据
const prescriptionInfo = ref(null)
const herbs = ref([])
const compounds = ref([])
const radarData = ref([])

const isSpeakingHerbs = ref(false)
const isSpeakingCompounds = ref(false)
const isSpeakingRadar = ref(false)

// 从路由获取方剂ID
const prescriptionId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

// 加载方剂详情数据
async function loadDetail() {
  let id = prescriptionId.value

  // 如果没有ID参数，尝试通过关键词搜索
  if (!id && route.query.keyword) {
    try {
      const { search } = await import('../api')
      const results = await search(route.query.keyword)
      if (results && results.length > 0) {
        id = results[0].id
      }
    } catch (e) {
      console.error('搜索方剂失败:', e)
    }
  }

  if (!id) return

  try {
    // 并行请求三个接口
    const [detail, radar, compoundResult] = await Promise.all([
      getPrescriptionDetail(id),
      getPrescriptionRadar(id),
      getPrescriptionCompounds(id, 0.5)
    ])

    // 处理方剂详情
    prescriptionInfo.value = detail
    herbs.value = (detail.herbs || []).map(h => ({
      name: h.name,
      description: h.info_desc || ''
    }))

    // 处理雷达数据：归一化到 0-100
    const radarRaw = radar || []
    const maxCount = Math.max(...radarRaw.map(r => r.count), 1)
    radarData.value = radarRaw.map(r => ({
      name: r.efficacy_type,
      value: Math.round((r.count / maxCount) * 100)
    }))

    // 处理化合物数据
    const compoundItems = (compoundResult && compoundResult.items) ? compoundResult.items : []
    compounds.value = compoundItems.map(c => ({
      name: `${c.name} (来源: ${c.herb_name || '未知'})`,
      probability: c.blood_prob ? Math.round(c.blood_prob * 100 * 10) / 10 : 0,
      description: `ccTCM概率: ${c.prob_cctcm ? (c.prob_cctcm * 100).toFixed(1) + '%' : '无'} | HERB概率: ${c.prob_herb ? (c.prob_herb * 100).toFixed(1) + '%' : '无'}`
    }))

    // 数据加载完毕后初始化雷达图
    initRadarChart()
  } catch (e) {
    console.error('加载方剂详情失败:', e)
  }
}

function toggleSpeakHerbs() {
  if (!speechEnabled.value) return

  if (isSpeakingHerbs.value) {
    stop()
    isSpeakingHerbs.value = false
  } else {
    stopOtherSpeaking()
    const indication = prescriptionInfo.value?.indication_type || '未知'
    const text = `${prescriptionInfo.value?.name || '方剂'}。证型：${indication}。药材组成：${herbs.value.map(h => h.name).join('、')}。${herbs.value.map(h => `${h.name}：${h.description}`).join('。')}`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingHerbs.value = true
  }
}

function toggleSpeakCompounds() {
  if (!speechEnabled.value) return

  if (isSpeakingCompounds.value) {
    stop()
    isSpeakingCompounds.value = false
  } else {
    stopOtherSpeaking()
    const text = `成分入血预测战力面板。${compounds.value.map((c, i) => `第${i + 1}位，${c.name}，预测概率${c.probability}%，${c.description}`).join('。')}`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingCompounds.value = true
  }
}

function toggleSpeakRadar() {
  if (!speechEnabled.value) return

  if (isSpeakingRadar.value) {
    stop()
    isSpeakingRadar.value = false
  } else {
    stopOtherSpeaking()
    const text = `干预效能雷达图。${radarData.value.map(d => `${d.name}：${d.value}分`).join('。')}`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingRadar.value = true
  }
}

function stopOtherSpeaking() {
  stop()
  isSpeakingHerbs.value = false
  isSpeakingCompounds.value = false
  isSpeakingRadar.value = false
}

// 获取进度条颜色
function getProgressColor(percentage) {
  if (percentage >= 90) return '#f56c6c'
  if (percentage >= 80) return '#e6a23c'
  return '#409eff'
}

// 初始化雷达图
function initRadarChart() {
  if (!radarChart.value || radarData.value.length === 0) return

  const chart = echarts.init(radarChart.value)

  const option = {
    color: ['#409eff'],
    radar: {
      indicator: radarData.value.map(item => ({
        name: item.name,
        max: 100
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#666',
        fontSize: 13
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(64, 158, 255, 0.2)'
        }
      },
      splitArea: {
        areaStyle: {
          color: ['rgba(64, 158, 255, 0.05)', 'rgba(64, 158, 255, 0.1)']
        }
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(64, 158, 255, 0.3)'
        }
      }
    },
    series: [{
      type: 'radar',
      data: [{
        value: radarData.value.map(item => item.value),
        name: '干预效能',
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 2,
          color: '#409eff'
        },
        areaStyle: {
          color: 'rgba(64, 158, 255, 0.35)'
        },
        itemStyle: {
          color: '#409eff'
        }
      }]
    }]
  }

  chart.setOption(option)

  // 窗口大小变化时重绘
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  loadDetail()
})
</script>

<style scoped>
.detail-container {
  min-height: 100vh;
  background: var(--bg-gradient);
}

/* 顶部导航栏 */
.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 40px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  cursor: pointer;
}

.logo:hover {
  color: #409eff;
}

.logo .el-icon {
  font-size: 24px;
}

.expert-btn {
  font-size: 14px;
}

/* 主内容区 */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 24px;
  padding: 24px 40px;
  max-width: 1600px;
  margin: 0 auto;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.speech-btn {
  color: #909399;
  transition: all 0.3s ease;
}

.speech-btn:hover {
  color: #409eff;
}

.speech-btn.speaking {
  color: #67c23a;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.card-header h2 {
  font-size: 18px;
  color: #303133;
  margin: 0;
}

.info-icon {
  color: #909399;
  cursor: pointer;
  font-size: 18px;
}

/* 模块 A */
.module-a {
  grid-column: 1;
  grid-row: 1;
}

.prescription-info {
  text-align: center;
  margin-bottom: 24px;
}

.prescription-name {
  font-size: 32px;
  color: #303133;
  margin: 0 0 12px 0;
}

.syndrome-tag {
  margin-top: 8px;
}

.herb-section h3 {
  font-size: 15px;
  color: #606266;
  margin: 0 0 16px 0;
}

.herb-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.herb-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.herb-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.herb-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, #67c23a, #409eff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.herb-item span {
  font-size: 14px;
  color: #303133;
}

.herb-tooltip {
  padding: 8px 0;
}

.tooltip-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tooltip-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

/* 模块 B */
.module-b {
  grid-column: 2;
  grid-row: 1 / 3;
}

.compound-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compound-item {
  padding: 16px;
  background: #f9fafc;
  border-radius: 12px;
  transition: all 0.3s;
}

.compound-item:hover {
  background: #f0f7ff;
}

.compound-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.compound-rank {
  padding: 4px 10px;
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  border-radius: 12px;
}

.compound-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.compound-prob {
  margin-left: auto;
  font-size: 20px;
  font-weight: 700;
  color: #409eff;
}

.compound-progress {
  margin-bottom: 10px;
}

.compound-desc {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  line-height: 1.5;
}

.compound-desc .el-icon {
  margin-top: 2px;
  color: #409eff;
}

/* 模块 C */
.module-c {
  grid-column: 1;
  grid-row: 2;
}

.radar-chart {
  width: 100%;
  height: 350px;
}

.radar-tip {
  padding: 8px 12px;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}

/* 响应式 */
@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .module-b {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>