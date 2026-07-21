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
              icon="Volume2"
              circle
              size="small"
              @click.stop="toggleSpeech(item)"
            />
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
            <el-badge :value="item.compoundCount" :max="99" class="compound-badge" />
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
        :total="filteredPrescriptions.length"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View, Mic } from '@element-plus/icons-vue'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'

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

const prescriptions = ref([
  {
    name: '小青龙汤',
    origin: '《伤寒论》',
    herbs: '麻黄、桂枝、干姜、细辛、五味子、芍药、半夏、甘草',
    effect: '解表散寒，温肺化饮',
    category: 'classic',
    compoundCount: 45
  },
  {
    name: '降气平哮方',
    origin: '现代研究方',
    herbs: '麻黄、黄芩、地龙、杏仁、苏子、款冬花、半夏',
    effect: '清热宣肺，降气平喘',
    category: 'modern',
    compoundCount: 38
  },
  {
    name: '定喘汤',
    origin: '《摄生众妙方》',
    herbs: '白果、麻黄、苏子、甘草、款冬花、杏仁、桑白皮、黄芩、法半夏',
    effect: '宣肺降气，清热化痰',
    category: 'classic',
    compoundCount: 52
  },
  {
    name: '麻杏石甘汤',
    origin: '《伤寒论》',
    herbs: '麻黄、杏仁、石膏、甘草',
    effect: '辛凉宣泄，清肺平喘',
    category: 'classic',
    compoundCount: 28
  },
  {
    name: '射干麻黄汤',
    origin: '《金匮要略》',
    herbs: '射干、麻黄、生姜、细辛、紫菀、款冬花、大枣、半夏、五味子',
    effect: '宣肺祛痰，降气止咳',
    category: 'classic',
    compoundCount: 41
  },
  {
    name: '平喘固本汤',
    origin: '现代研究方',
    herbs: '党参、黄芪、胡桃肉、沉香、坎脐、冬虫夏草、五味子、苏子、款冬花、法半夏、橘红',
    effect: '补肺纳肾，降气化痰',
    category: 'modern',
    compoundCount: 56
  },
  {
    name: '三子养亲汤',
    origin: '《韩氏医通》',
    herbs: '紫苏子、白芥子、莱菔子',
    effect: '温肺化痰，降气消食',
    category: 'classic',
    compoundCount: 23
  },
  {
    name: '华盖散',
    origin: '《太平惠民和剂局方》',
    herbs: '麻黄、紫苏子、杏仁、陈皮、桑白皮、赤茯苓、甘草',
    effect: '宣肺解表，祛痰止咳',
    category: 'classic',
    compoundCount: 35
  },
  {
    name: '玉屏风散合桂枝汤',
    origin: '《医方类聚》',
    herbs: '黄芪、白术、防风、桂枝、芍药、生姜、大枣、甘草',
    effect: '益气固表，调和营卫',
    category: 'classic',
    compoundCount: 42
  },
  {
    name: '清肺化痰汤',
    origin: '现代研究方',
    herbs: '黄芩、桑白皮、知母、贝母、杏仁、瓜萎仁、桔梗、陈皮、茯苓、甘草',
    effect: '清肺化痰，止咳平喘',
    category: 'modern',
    compoundCount: 48
  },
  {
    name: '厚朴麻黄汤',
    origin: '《金匮要略》',
    herbs: '厚朴、麻黄、石膏、杏仁、半夏、干姜、细辛、小麦、五味子',
    effect: '宣肺降逆，化饮止咳',
    category: 'classic',
    compoundCount: 44
  },
  {
    name: '滋阴清肺汤',
    origin: '现代研究方',
    herbs: '沙参、麦冬、生地、玄参、川贝、桔梗、牡丹皮、薄荷、甘草',
    effect: '养阴清肺，利咽解毒',
    category: 'modern',
    compoundCount: 36
  }
])

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
    query: { keyword: item.name }
  })
}

function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
}

function handleCurrentChange(val) {
  currentPage.value = val
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
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-desc {
  font-size: 16px;
  color: #666;
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

.compound-badge {
  background: #409eff;
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