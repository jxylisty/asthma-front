<template>
  <div class="prescriptions-container">
    <div class="page-header">
      <h2 class="page-title">方剂列表</h2>
      <p class="page-desc">系统收录的经典哮喘方剂汇总</p>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索方剂名称..."
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
        <el-option label="经典方剂" value="classic" />
        <el-option label="现代组方" value="modern" />
      </el-select>
    </div>

    <div class="prescription-grid">
      <el-card
        v-for="item in paginatedPrescriptions"
        :key="item.name"
        class="prescription-card"
        @click="handleCardClick(item)"
      >
        <div class="card-header">
          <h3 class="card-title">{{ item.name }}</h3>
          <div class="header-right">
            <el-tag :type="item.category === 'classic' ? 'primary' : 'success'" size="small">
              {{ item.category === 'classic' ? '经典方剂' : '现代组方' }}
            </el-tag>
            <el-button
              class="speech-btn"
              :class="{ speaking: speakingCards.has(item.name) }"
              size="small"
              @click.stop="toggleSpeech(item)"
            >
              <el-icon><VideoPause v-if="speakingCards.has(item.name)" /><Mic v-else /></el-icon>
              {{ speakingCards.has(item.name) ? '停止' : '播报' }}
            </el-button>
          </div>
        </div>

        <div class="card-body">
          <div class="origin-info">
            <span class="label">出处：</span>
            <span class="value">{{ item.origin }}</span>
          </div>

          <div class="herbs-info">
            <span class="label">组成：</span>
            <span class="value">{{ item.herbs }}</span>
          </div>

          <div class="effect-info">
            <span class="label">功效：</span>
            <span class="value">{{ item.effect }}</span>
          </div>

          <div class="compounds-info">
            <span class="label">核心成分数：</span>
            <span class="count-badge">{{ item.compoundCount }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button type="primary" size="small" @click.stop="handleViewDetail(item)">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper" v-if="filteredPrescriptions.length > 10">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[6, 12, 18, 24]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalPrescriptions"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View, Mic, VideoPause } from '@element-plus/icons-vue'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'
import { getPrescriptions } from '../api'

const { speak, stop, isSpeaking } = useSpeech()
const { speechVoice, speechRate, speechPitch, speechEnabled } = useSettings()

const speakingCards = ref(new Set())

function toggleSpeech(item) {
  if (!speechEnabled.value) return
  
  const cardId = item.name
  
  if (speakingCards.value.has(cardId)) {
    stop()
    speakingCards.value.delete(cardId)
  } else {
    const text = `${item.name}。出处：${item.origin}。组成：${item.herbs}。功效：${item.effect}。`
    speak(text, {
      voice: speechVoice.value,
      rate: speechRate.value,
      pitch: speechPitch.value
    })
    speakingCards.value.add(cardId)
  }
}

const router = useRouter()

const searchQuery = ref('')
const categoryFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(6)

const prescriptions = ref([])
const totalPrescriptions = ref(0)
const loading = ref(false)

async function loadPrescriptions() {
  loading.value = true
  try {
    const res = await getPrescriptions(currentPage.value, pageSize.value)
    prescriptions.value = res.items.map(p => ({
      id: p.id,
      name: p.name,
      origin: p.core_effect || '经典方剂',
      herbs: '',
      effect: p.core_effect || p.indication_type || '',
      category: 'classic',
      compoundCount: 0
    }))
    totalPrescriptions.value = res.total
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPrescriptions()
})

const filteredPrescriptions = computed(() => {
  let result = prescriptions.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.herbs.toLowerCase().includes(query) ||
      item.origin.toLowerCase().includes(query)
    )
  }

  if (categoryFilter.value) {
    result = result.filter(item => item.category === categoryFilter.value)
  }

  return result
})

const paginatedPrescriptions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPrescriptions.value.slice(start, end)
})

function handleCardClick(item) {
  handleViewDetail(item)
}

function handleViewDetail(item) {
  router.push({
    path: '/detail',
    query: { id: item.id }
  })
}

function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadPrescriptions()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadPrescriptions()
}
</script>

<style scoped>
.prescriptions-container {
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

.prescription-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.prescription-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
}

.prescription-card:hover {
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
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-body .label {
  font-size: 13px;
  color: #999;
  font-weight: 500;
}

.card-body .value {
  font-size: 14px;
  color: #333;
}

.herbs-info,
.effect-info {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  background: linear-gradient(135deg, #43cea2 0%, #185a9d 100%);
  border-radius: 11px;
  margin-left: 4px;
}

.card-footer {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}

.pagination-wrapper :deep(.el-pagination) {
  background: #fff;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
</style>