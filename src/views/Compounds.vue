<template>
  <div class="compounds-container">
    <div class="page-header">
      <h2 class="page-title">化合物详情</h2>
      <p class="page-desc">系统收录的化合物数据汇总，点击卡片查看分子特征与靶点信息</p>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索化合物名称..."
        class="search-input"
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>

      <el-select
        v-model="categoryFilter"
        placeholder="按类别筛选"
        class="category-select"
      >
        <el-option label="全部" value="" />
        <el-option label="与哮喘相关" value="asthma" />
        <el-option label="其他" value="other" />
      </el-select>
    </div>

    <div v-loading="loading" class="compound-grid">
      <el-card
        v-for="item in paginatedCompounds"
        :key="item.id"
        class="compound-card"
        @click="handleCardClick(item)"
      >
        <div class="card-header">
          <h3 class="card-title">{{ item.name }}</h3>
          <div class="header-right">
            <el-tag v-if="item.asthmaRelated" type="danger" size="small">哮喘相关</el-tag>
            <el-tag v-else type="info" size="small">普通</el-tag>
            <el-button
              class="speech-btn"
              :class="{ speaking: speakingCards.has(item.id) }"
              size="small"
              @click.stop="toggleSpeech(item)"
            >
              <el-icon><VideoPause v-if="speakingCards.has(item.id)" /><Mic v-else /></el-icon>
              {{ speakingCards.has(item.id) ? '停止' : '播报' }}
            </el-button>
          </div>
        </div>

        <div class="card-body">
          <div class="info-row">
            <span class="label">分子量 (MW)：</span>
            <span class="value">{{ item.mw }}</span>
          </div>

          <div class="info-row">
            <span class="label">LogP：</span>
            <span class="value">{{ item.logp }}</span>
          </div>

          <div class="info-row">
            <span class="label">入血概率：</span>
            <el-progress
              :percentage="Math.round(item.bloodEntryProbability * 100)"
              :color="getProbabilityColor(item.bloodEntryProbability)"
              :stroke-width="12"
              class="prob-progress"
            />
          </div>

          <div class="info-row">
            <span class="label">靶点数：</span>
            <span class="count-badge">{{ item.targetCount }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button type="primary" size="small" @click.stop="handleCardClick(item)">
            <el-icon><DataLine /></el-icon>
            查看图谱
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper" v-if="filteredCompounds.length > pageSize">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[12, 24, 36, 48]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCompounds"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, DataLine, Mic, VideoPause } from '@element-plus/icons-vue'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'
import { getHighPotentialCompounds } from '../api'

const router = useRouter()
const { speak, stop } = useSpeech()
const { speechVoice, speechRate, speechPitch, speechEnabled } = useSettings()

const speakingCards = ref(new Set())

function toggleSpeech(item) {
  if (!speechEnabled.value) return

  const cardId = item.id

  if (speakingCards.value.has(cardId)) {
    stop()
    speakingCards.value.delete(cardId)
  } else {
    const text = `${item.name}。分子量${item.mw}。LogP值${item.logp}。预测入血概率${Math.round(item.bloodEntryProbability * 100)}%。含靶点${item.targetCount}个。${item.asthmaRelated ? '与哮喘相关。' : ''}`
    speak(text, {
      voice: speechVoice.value,
      rate: speechRate.value,
      pitch: speechPitch.value
    })
    speakingCards.value.add(cardId)
  }
}

const loading = ref(false)
const searchQuery = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(12)

const compounds = ref([])
const totalCompounds = ref(0)

async function loadCompounds() {
  loading.value = true
  try {
    const data = await getHighPotentialCompounds(currentPage.value, pageSize.value)
    compounds.value = (data.items || []).map(item => ({
      id: item.pubchem_cid,
      name: item.name,
      mw: item.mw,
      logp: item.logp,
      bloodEntryProbability: item.blood_prob,
      targetCount: 0,
      asthmaRelated: false
    }))
    totalCompounds.value = data.total || 0
  } catch (e) {
    console.error('Failed to load compounds:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCompounds()
})

const filteredCompounds = computed(() => {
  let result = compounds.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query)
    )
  }

  if (categoryFilter.value === 'asthma') {
    result = result.filter(item => item.asthmaRelated)
  } else if (categoryFilter.value === 'other') {
    result = result.filter(item => !item.asthmaRelated)
  }

  return result
})

const paginatedCompounds = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredCompounds.value.slice(start, end)
})

function getProbabilityColor(prob) {
  if (prob >= 0.7) return '#67c23a'
  if (prob >= 0.5) return '#e6a23c'
  return '#f56c6c'
}

function handleCardClick(item) {
  router.push({
    path: '/compounds/detail',
    query: { cid: item.id, name: item.name }
  })
}

function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadCompounds()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadCompounds()
}
</script>

<style scoped>
.compounds-container {
  padding: 40px;
  background: var(--bg-gradient);
  min-height: 100vh;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 8px;
}

.page-desc {
  font-size: 16px;
  color: var(--text-secondary);
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  max-width: 600px;
}

.search-input {
  flex: 1;
  height: 44px;
}

.category-select {
  width: 160px;
}

.compound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  min-height: 200px;
}

.compound-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
}

.compound-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-right {
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
  50% { transform: scale(1.1); }
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  word-break: break-all;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-row .label {
  color: #999;
  font-weight: 500;
  min-width: 100px;
  flex-shrink: 0;
}

.info-row .value {
  color: #333;
}

.prob-progress {
  flex: 1;
  max-width: 160px;
}

.count-badge {
  display: inline-block;
  min-width: 24px;
  padding: 0 8px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  border-radius: 11px;
  margin-left: 4px;
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.pagination-wrapper :deep(.el-pagination) {
  background: var(--card-bg, #fff);
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>
