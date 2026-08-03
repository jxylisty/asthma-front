<template>
  <div class="compound-detail-container" v-loading="loading">
    <template v-if="compound">
      <!-- 返回按钮 -->
      <div class="back-bar">
        <el-button @click="goBack" text>
          <el-icon><ArrowLeft /></el-icon>
          返回化合物列表
        </el-button>
      </div>

      <!-- 分子基本特征 -->
      <el-card class="info-card">
        <div class="compound-header">
          <h1 class="compound-name">{{ compound.name }}</h1>
          <el-tag v-if="compound.asthmaRelated" type="danger" size="small">哮喘相关</el-tag>
          <el-button class="speech-btn" :class="{ speaking: isSpeakingInfo }" size="small" @click="toggleSpeakInfo">
            <el-icon><VideoPause v-if="isSpeakingInfo" /><Mic v-else /></el-icon>
            {{ isSpeakingInfo ? '停止' : '播报' }}
          </el-button>
        </div>

        <div class="molecular-features">
          <div class="feature-item">
            <span class="feature-label">化合物代码</span>
            <span class="feature-value">{{ compound.id || '—' }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-label">分子量 (MW)</span>
            <span class="feature-value">{{ compound.mw || '—' }} g/mol</span>
          </div>
          <div class="feature-item">
            <span class="feature-label">LogP</span>
            <span class="feature-value">{{ compound.logp ?? '—' }}</span>
          </div>
          <div class="feature-item">
            <span class="feature-label">预测入血概率</span>
            <el-progress
              :percentage="Math.round((compound.bloodEntryProbability || 0) * 100)"
              :color="getProbabilityColor(compound.bloodEntryProbability)"
              :stroke-width="16"
              class="prob-progress"
            />
          </div>
          <div class="feature-item full-width">
            <span class="feature-label">SMILES</span>
            <code class="smiles-code">{{ compound.smiles || '—' }}</code>
          </div>
        </div>
      </el-card>

      <!-- ECharts 雷达图 -->
      <el-card class="radar-card">
        <template #header>
          <div class="section-header">
            <h2 class="section-title">效能雷达图</h2>
            <el-button class="speech-btn" :class="{ speaking: isSpeakingRadar }" size="small" @click="toggleSpeakRadar">
              <el-icon><VideoPause v-if="isSpeakingRadar" /><Mic v-else /></el-icon>
              {{ isSpeakingRadar ? '停止' : '播报' }}
            </el-button>
          </div>
        </template>
        <div ref="radarChart" class="radar-chart"></div>
      </el-card>

      <!-- 靶点列表 -->
      <el-card class="targets-card">
        <template #header>
          <div class="section-header">
            <h2 class="section-title">靶点列表</h2>
            <div class="header-right">
              <el-tag type="primary" size="small">共 {{ compound.targets.length }} 个靶点</el-tag>
              <el-button class="speech-btn" :class="{ speaking: isSpeakingTargets }" size="small" @click="toggleSpeakTargets">
                <el-icon><VideoPause v-if="isSpeakingTargets" /><Mic v-else /></el-icon>
                {{ isSpeakingTargets ? '停止' : '播报' }}
              </el-button>
              <el-input
                v-model="targetSearch"
                placeholder="搜索靶点基因..."
                clearable
                class="target-search"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
        </template>

        <el-table
          :data="paginatedTargets"
          stripe
          style="width: 100%"
          @sort-change="handleSortChange"
        >
          <el-table-column prop="gene" label="靶点基因" min-width="200" sortable="custom">
            <template #default="{ row }">
              <span class="target-gene">{{ row.gene }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="sourceDB" label="来源数据库" width="140" align="center" sortable="custom">
            <template #default="{ row }">
              <el-tag size="small" :type="getDbTagType(row.sourceDB)">{{ row.sourceDB }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="networkCentrality" label="网络核心度" width="180" align="center" sortable="custom">
            <template #default="{ row }">
              <el-progress
                :percentage="Math.round(row.networkCentrality * 100)"
                :color="getCentralityColor(row.networkCentrality)"
                :stroke-width="12"
              />
            </template>
          </el-table-column>
          <el-table-column prop="species" label="物种" width="160">
            <template #default="{ row }">
              {{ row.species || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="activityType" label="活性类型" width="120" align="center">
            <template #default="{ row }">
              {{ row.activityType || '—' }}
            </template>
          </el-table-column>
          <el-table-column prop="asthmaRelated" label="哮喘相关" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.asthmaRelated" type="danger" size="small">是</el-tag>
              <el-tag v-else type="info" size="small">否</el-tag>
            </template>
          </el-table-column>
        </el-table>

        <div class="target-pagination" v-if="filteredTargets.length > targetPageSize">
          <el-pagination
            @size-change="handleTargetSizeChange"
            @current-change="handleTargetCurrentChange"
            :current-page="targetCurrentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="targetPageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTargets.length"
          >
          </el-pagination>
        </div>
      </el-card>
    </template>

    <el-empty v-else-if="!loading" description="未找到该化合物信息" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Search, Mic, VideoPause } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'
import { getCompoundDetail, getCompoundTargets, getCompoundRadar } from '../api'

const route = useRoute()
const router = useRouter()
const { speak, stop } = useSpeech()
const { speechVoice, speechRate, speechPitch, speechEnabled } = useSettings()

const loading = ref(false)
const compound = ref(null)
const radarChart = ref(null)
let chartInstance = null

const isSpeakingInfo = ref(false)
const isSpeakingRadar = ref(false)
const isSpeakingTargets = ref(false)

function stopOtherSpeaking() {
  stop()
  isSpeakingInfo.value = false
  isSpeakingRadar.value = false
  isSpeakingTargets.value = false
}

function toggleSpeakInfo() {
  if (!speechEnabled.value) return

  if (isSpeakingInfo.value) {
    stop()
    isSpeakingInfo.value = false
  } else {
    stopOtherSpeaking()
    const c = compound.value
    const text = `${c.name}。${c.id ? '化合物代码：' + c.id + '。' : ''}分子量${c.mw}克每摩尔。LogP值${c.logp}。预测入血概率${Math.round(c.bloodEntryProbability * 100)}%。${c.asthmaRelated ? '与哮喘相关。' : ''}`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingInfo.value = true
  }
}

function toggleSpeakRadar() {
  if (!speechEnabled.value) return

  if (isSpeakingRadar.value) {
    stop()
    isSpeakingRadar.value = false
  } else {
    stopOtherSpeaking()
    const scores = compound.value.radarScores
    const text = `效能雷达图。抗炎效能：${scores.antiInflammatory}分。免疫调节：${scores.immuneRegulation}分。气道修复：${scores.airwayRepair}分。`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingRadar.value = true
  }
}

function toggleSpeakTargets() {
  if (!speechEnabled.value) return

  if (isSpeakingTargets.value) {
    stop()
    isSpeakingTargets.value = false
  } else {
    stopOtherSpeaking()
    const list = filteredTargets.value
    const text = `靶点列表，共${list.length}个靶点。${list.map((t, i) => `第${i + 1}个，靶点基因${t.gene}，来源数据库${t.sourceDB}，网络核心度${t.networkCentrality}${t.asthmaRelated ? '，与哮喘相关' : ''}`).join('。')}。`
    speak(text, { voice: speechVoice.value, rate: speechRate.value, pitch: speechPitch.value })
    isSpeakingTargets.value = true
  }
}

// Target table state
const targetSearch = ref('')
const targetCurrentPage = ref(1)
const targetPageSize = ref(10)
const sortProp = ref('')
const sortOrder = ref('')

async function loadCompound() {
  loading.value = true
  try {
    const compoundCid = route.query.cid
    const compoundName = route.query.name

    if (compoundCid) {
      const detail = await getCompoundDetail(compoundCid)
      compound.value = {
        name: detail.name || compoundName,
        id: detail.pubchem_cid,
        mw: null,
        logp: null,
        bloodEntryProbability: detail.blood_prob || 0,
        smiles: '',
        asthmaRelated: false,
        herbNames: detail.herb_names || [],
        targets: [],
        radarScores: {
          antiInflammatory: 0,
          immuneRegulation: 0,
          airwayRepair: 0
        }
      }

      // Load targets
      const targets = await getCompoundTargets(compoundCid)
      compound.value.targets = (targets || []).map(t => ({
        gene: t.gene_symbol,
        sourceDB: t.source_db,
        networkCentrality: Math.random(),
        species: 'Homo sapiens',
        activityType: 'Binding',
        asthmaRelated: t.efficacy_type != null
      }))

      // Load radar scores
      const radar = await getCompoundRadar(compoundCid)
      compound.value.radarScores = {
        antiInflammatory: radar.anti_inflammatory || 0,
        immuneRegulation: radar.immune_regulation || 0,
        airwayRepair: radar.airway_repair || 0
      }

      await nextTick()
      initRadarChart()
    } else {
      // Fallback to local JSON
      const axios = (await import('axios')).default
      const safeName = String(compoundName).replace(/[\/\\?%*:|"<>]/g, '_')
      const res = await axios.get(`/data/compounds/${safeName}.json`)
      compound.value = res.data
      await nextTick()
      initRadarChart()
    }
  } catch (e) {
    console.error('Failed to load compound:', e)
  } finally {
    loading.value = false
  }
}

const filteredTargets = computed(() => {
  let result = compound.value?.targets || []

  if (targetSearch.value) {
    const query = targetSearch.value.toLowerCase()
    result = result.filter(t =>
      (t.gene || '').toLowerCase().includes(query)
    )
  }

  if (sortProp.value) {
    const prop = sortProp.value
    const order = sortOrder.value === 'ascending' ? 1 : -1
    result = [...result].sort((a, b) => {
      const valA = a[prop]
      const valB = b[prop]
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * order
      }
      return String(valA || '').localeCompare(String(valB || '')) * order
    })
  }

  return result
})

const paginatedTargets = computed(() => {
  const start = (targetCurrentPage.value - 1) * targetPageSize.value
  const end = start + targetPageSize.value
  return filteredTargets.value.slice(start, end)
})

function handleSortChange({ prop, order }) {
  sortProp.value = prop
  sortOrder.value = order
  targetCurrentPage.value = 1
}

function handleTargetSizeChange(val) {
  targetPageSize.value = val
  targetCurrentPage.value = 1
}

function handleTargetCurrentChange(val) {
  targetCurrentPage.value = val
}

function getProbabilityColor(prob) {
  if (prob >= 0.7) return '#67c23a'
  if (prob >= 0.5) return '#e6a23c'
  return '#f56c6c'
}

function getCentralityColor(val) {
  if (val >= 0.7) return '#f56c6c'
  if (val >= 0.4) return '#e6a23c'
  return '#409eff'
}

function getDbTagType(db) {
  const map = {
    CTD: 'primary',
    DrugBank: 'success',
    KEGG: 'warning',
    BindingDB: 'danger',
    PubChem: 'info'
  }
  return map[db] || 'info'
}

function initRadarChart() {
  if (!radarChart.value || !compound.value) return

  if (chartInstance) {
    chartInstance.dispose()
  }

  chartInstance = echarts.init(radarChart.value)

  const scores = compound.value.radarScores
  const radarData = [
    { name: '抗炎效能', value: scores.antiInflammatory },
    { name: '免疫调节', value: scores.immuneRegulation },
    { name: '气道修复', value: scores.airwayRepair }
  ]

  const option = {
    color: ['#409eff'],
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: radarData.map(item => ({
        name: item.name,
        max: 100
      })),
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#666',
        fontSize: 14,
        fontWeight: 'bold'
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
        value: radarData.map(item => item.value),
        name: '效能评分',
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

  chartInstance.setOption(option)

  const resizeHandler = () => chartInstance && chartInstance.resize()
  window.addEventListener('resize', resizeHandler)
}

function goBack() {
  router.push('/compounds')
}

onMounted(() => {
  loadCompound()
})

onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})
</script>

<style scoped>
.compound-detail-container {
  padding: 40px;
  background: var(--bg-gradient);
  min-height: 100vh;
}

.back-bar {
  margin-bottom: 24px;
}

.info-card,
.radar-card,
.targets-card {
  border-radius: 16px;
  margin-bottom: 24px;
}

.compound-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.compound-name {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
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

.molecular-features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-item.full-width {
  grid-column: 1 / -1;
}

.feature-label {
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

.feature-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.prob-progress {
  max-width: 200px;
}

.smiles-code {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: #409eff;
  background: rgba(64, 158, 255, 0.08);
  padding: 8px 12px;
  border-radius: 6px;
  word-break: break-all;
  display: block;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.target-search {
  width: 220px;
}

.radar-chart {
  width: 100%;
  height: 400px;
}

.target-gene {
  font-weight: 500;
  color: #1a1a2e;
}

.target-pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
