<template>
  <div class="herbs-container">
    <div class="page-header">
      <h2 class="page-title">中药详情</h2>
      <p class="page-desc">系统收录的中药药材数据汇总，点击卡片查看含有的化合物信息</p>
    </div>

    <div class="search-bar">
      <el-input
        v-model="searchQuery"
        placeholder="搜索中药名称、拼音、科属..."
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

    <div v-loading="loading" class="herb-grid">
      <el-card
        v-for="item in paginatedHerbs"
        :key="item.id"
        class="herb-card"
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
            <span class="label">拼音：</span>
            <span class="value">{{ item.pinyin || '—' }}</span>
          </div>

          <div class="info-row">
            <span class="label">分类：</span>
            <span class="value">{{ item.category || '—' }}</span>
          </div>

          <div class="info-row">
            <span class="label">性味：</span>
            <span class="value">{{ item.nature }} / {{ item.flavor }}</span>
          </div>

          <div class="info-row">
            <span class="label">归经：</span>
            <span class="value">{{ item.meridians || '—' }}</span>
          </div>

          <div class="info-row">
            <span class="label">科属：</span>
            <span class="value">{{ item.family || '—' }}</span>
          </div>

          <div class="info-row">
            <span class="label">功效：</span>
            <span class="value text-ellipsis">{{ item.functions || '—' }}</span>
          </div>

          <div class="info-row">
            <span class="label">化合物数：</span>
            <span class="count-badge">{{ item.compoundCount }}</span>
          </div>
        </div>

        <div class="card-footer">
          <el-button type="primary" size="small" @click.stop="handleCardClick(item)">
            <el-icon><View /></el-icon>
            查看详情
          </el-button>
        </div>
      </el-card>
    </div>

    <div class="pagination-wrapper" v-if="totalHerbs > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="currentPage"
        :page-sizes="[12, 24, 36, 48]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalHerbs"
      >
      </el-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Search, View, Mic, VideoPause } from '@element-plus/icons-vue'
import { useSpeech } from '../composables/useSpeech'
import { useSettings } from '../composables/useSettings'
import { getHerbs } from '../api'

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
    const text = `${item.name}。分类：${item.category || '未知'}。性味：${item.nature || '未知'}，${item.flavor || '未知'}。归经：${item.meridians || '未知'}。科属：${item.family || '未知'}。功效：${item.functions || '未知'}。含化合物${item.compoundCount}个。`
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

const herbs = ref([])
const totalHerbs = ref(0)

async function loadHerbs() {
  loading.value = true
  try {
    const data = await getHerbs(currentPage.value, pageSize.value, searchQuery.value)
    herbs.value = (data.items || []).map(item => ({
      id: item.id,
      name: item.name,
      pinyin: item.pinyin || '',
      category: item.category || '',
      nature: item.nature || '',
      flavor: item.flavor || '',
      meridians: item.meridians || '',
      family: item.family || '',
      functions: item.functions || '',
      compoundCount: item.compound_count || 0,
      asthmaRelated: item.asthma_related || false
    }))
    totalHerbs.value = data.total || 0
  } catch (e) {
    console.error('Failed to load herbs:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadHerbs()
})

// 搜索/筛选变化时重新加载
let searchTimer = null
watch([searchQuery, categoryFilter], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadHerbs()
  }, 300)
})

const filteredHerbs = computed(() => {
  let result = herbs.value

  if (categoryFilter.value === 'asthma') {
    result = result.filter(item => item.asthmaRelated)
  } else if (categoryFilter.value === 'other') {
    result = result.filter(item => !item.asthmaRelated)
  }

  return result
})

const paginatedHerbs = computed(() => {
  return filteredHerbs.value
})

function handleCardClick(item) {
  router.push({
    path: '/herbs/detail',
    query: { id: item.id, name: item.name }
  })
}

function handleSizeChange(val) {
  pageSize.value = val
  currentPage.value = 1
  loadHerbs()
}

function handleCurrentChange(val) {
  currentPage.value = val
  loadHerbs()
}
</script>

<style scoped>
.herbs-container {
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

.herb-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  min-height: 200px;
}

.herb-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 16px;
  overflow: hidden;
}

.herb-card:hover {
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

.info-row {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.info-row .label {
  color: #999;
  font-weight: 500;
  min-width: 80px;
  flex-shrink: 0;
}

.info-row .value {
  color: #333;
}

.text-ellipsis {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
