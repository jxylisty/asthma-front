<template>
  <div class="home-container">
    <!-- 粒子背景 Canvas -->
    <canvas ref="particleCanvas" class="particle-bg"></canvas>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 标题区 -->
      <div class="header-section">
        <h1 class="system-title">哮喘方剂智能分析系统</h1>
        <p class="system-subtitle">基于入血预测的中医治疗儿童哮喘作用机制分析平台</p>
      </div>

      <!-- 数据展板 -->
      <div class="data-ticker">
        <div class="ticker-card" v-for="(item, index) in tickerData" :key="index">
          <div class="ticker-value">
            <span class="ticker-number">{{ item.displayValue }}</span>
            <span class="ticker-unit">{{ item.unit }}</span>
          </div>
          <div class="ticker-label">{{ item.label }}</div>
        </div>
      </div>

      <!-- 检索中枢 -->
      <div class="search-center">
        <div class="search-wrapper">
          <el-input
            v-model="searchQuery"
            placeholder="请输入方剂名称或化合物..."
            class="search-input"
            @keyup.enter="handleSearch"
            clearable
          >
            <template #prefix>
              <el-icon class="search-icon"><Search /></el-icon>
            </template>
            <template #suffix>
              <el-icon class="voice-icon" @click="handleVoice"><Microphone /></el-icon>
            </template>
          </el-input>

          <!-- 热门标签 -->
          <div class="hot-tags">
            <span class="tag-label">热门方剂:</span>
            <el-tag
              v-for="tag in hotTags"
              :key="tag"
              class="hot-tag"
              @click="selectTag(tag)"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>

          <!-- 联想下拉框 -->
          <div class="suggestions" v-if="showSuggestions && filteredSuggestions.length > 0">
            <div
              v-for="item in filteredSuggestions"
              :key="item"
              class="suggestion-item"
              @click="selectSuggestion(item)"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全屏 Loading 遮罩层 -->
    <el-dialog
      v-model="loadingVisible"
      class="loading-dialog"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      width="400px"
      center
    >
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
        <div class="loading-progress">
          <div class="progress-bar" :style="{ width: progressWidth + '%' }"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Microphone } from '@element-plus/icons-vue'

const router = useRouter()

// 搜索相关
const searchQuery = ref('')
const showSuggestions = ref(false)

// 热门标签
const hotTags = ['小青龙汤', '降气平哮方', '定喘汤', '麻杏石甘汤']

// 联想数据
const suggestions = [
  '小青龙汤', '降气平哮方', '定喘汤', '麻杏石甘汤',
  '麻黄', '黄芩', '地龙', '杏仁',
  '麻黄碱', '黄芩苷', '苦杏仁苷'
]

const filteredSuggestions = computed(() => {
  if (!searchQuery.value) return []
  return suggestions.filter(item =>
    item.includes(searchQuery.value)
  )
})

// 数据展板
const tickerData = ref([
  { label: '系统已收录经典方剂总量', value: 128, displayValue: 0, unit: '首' },
  { label: '已提取多模态化合物特征维数', value: 24531, displayValue: 0, unit: '维' },
  { label: '覆盖呼吸系统/哮喘关联靶点数', value: 1422, displayValue: 0, unit: '个' }
])

// Loading 相关
const loadingVisible = ref(false)
const loadingText = ref('')
const progressWidth = ref(0)

const loadingSteps = [
  '正在加载多模态分子特征向量...',
  '正在启动 PU 学习算法预测入血概率...',
  '正在完成靶点通路富集映射...',
  '正在构建药理作用网络拓扑...',
  '分析完成，即将跳转...'
]

// 粒子背景
const particleCanvas = ref(null)
let animationId = null
let particles = []
let ctx = null

// 初始化粒子
function initParticles() {
  const canvas = particleCanvas.value
  if (!canvas) return

  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const particleCount = 80
  particles = []

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8,
      radius: Math.random() * 2 + 1
    })
  }
}

// 绘制粒子
function drawParticles() {
  if (!ctx || !particleCanvas.value) return

  const canvas = particleCanvas.value
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // 更新粒子位置
  particles.forEach(p => {
    p.x += p.vx
    p.y += p.vy

    // 边界反弹
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1
  })

  // 绘制连线
  ctx.strokeStyle = 'rgba(64, 158, 255, 0.15)'
  ctx.lineWidth = 1

  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x
      const dy = particles[i].y - particles[j].y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 120) {
        ctx.beginPath()
        ctx.moveTo(particles[i].x, particles[i].y)
        ctx.lineTo(particles[j].x, particles[j].y)
        ctx.stroke()
      }
    }
  }

  // 绘制粒子
  particles.forEach(p => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(64, 158, 255, 0.6)'
    ctx.fill()
  })

  animationId = requestAnimationFrame(drawParticles)
}

// 数字跳动动画
function animateNumber(item) {
  const duration = 2000
  const steps = 60
  const stepValue = item.value / steps
  let current = 0
  let step = 0

  const timer = setInterval(() => {
    step++
    current = Math.min(Math.round(stepValue * step), item.value)
    item.displayValue = current

    if (step >= steps) {
      clearInterval(timer)
      item.displayValue = item.value
    }
  }, duration / steps)
}

// 选择标签
function selectTag(tag) {
  searchQuery.value = tag
  handleSearch()
}

// 选择联想建议
function selectSuggestion(item) {
  searchQuery.value = item
  showSuggestions.value = false
  handleSearch()
}

// 语音点击
function handleVoice() {
  // Mock 语音识别
  alert('语音识别功能演示 - 已模拟识别: "降气平哮方"')
  searchQuery.value = '降气平哮方'
}

// 搜索处理
async function handleSearch() {
  if (!searchQuery.value.trim()) return

  loadingVisible.value = true
  progressWidth.value = 0

  // 动态变换计算日志
  for (let i = 0; i < loadingSteps.length; i++) {
    loadingText.value = loadingSteps[i]
    progressWidth.value = ((i + 1) / loadingSteps.length) * 100
    await new Promise(resolve => setTimeout(resolve, 400))
  }

  loadingVisible.value = false

  // 跳转到详情页
  router.push({
    path: '/detail',
    query: { keyword: searchQuery.value || '降气平哮方' }
  })
}

// 监听输入变化
function handleInputFocus() {
  showSuggestions.value = true
}

// 生命周期
onMounted(() => {
  initParticles()
  drawParticles()

  // 启动数字跳动动画
  tickerData.value.forEach((item, index) => {
    setTimeout(() => animateNumber(item), index * 200)
  })

  // 窗口大小变化时重绘
  window.addEventListener('resize', initParticles)
})

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
  window.removeEventListener('resize', initParticles)
})
</script>

<style scoped>
.home-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  overflow: hidden;
}

.particle-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.main-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.system-title {
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 12px;
  text-shadow: 0 2px 20px rgba(64, 158, 255, 0.3);
}

.system-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  font-weight: 300;
}

/* 数据展板 */
.data-ticker {
  display: flex;
  gap: 30px;
  margin-bottom: 50px;
}

.ticker-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  padding: 24px 36px;
  text-align: center;
  transition: all 0.3s ease;
}

.ticker-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-4px);
}

.ticker-value {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 4px;
}

.ticker-number {
  font-size: 42px;
  font-weight: 700;
  color: #409eff;
  font-family: 'DIN Alternate', 'Helvetica Neue', sans-serif;
}

.ticker-unit {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  margin-left: 4px;
}

.ticker-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.65);
  margin-top: 8px;
  max-width: 180px;
}

/* 检索中枢 */
.search-center {
  width: 100%;
  max-width: 680px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  height: 56px;
  font-size: 16px;
}

.search-input :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 28px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  padding: 0 24px;
}

.search-icon,
.voice-icon {
  font-size: 20px;
  color: #409eff;
  cursor: pointer;
}

.voice-icon:hover {
  color: #67c23a;
}

/* 热门标签 */
.hot-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.tag-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.85);
}

.hot-tag:hover {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

/* 联想下拉 */
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  margin-top: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 100;
  overflow: hidden;
}

.suggestion-item {
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
  color: #333;
}

.suggestion-item:hover {
  background: #f0f7ff;
  color: #409eff;
}

/* Loading 遮罩 */
:deep(.loading-dialog) {
  background: transparent !important;
}

:deep(.el-dialog) {
  background: rgba(26, 26, 46, 0.95) !important;
  border-radius: 20px !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
}

:deep(.el-dialog__header),
:deep(.el-dialog__body) {
  padding: 30px 40px !important;
}

.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 60px;
  height: 60px;
  margin: 0 auto 24px;
  border: 3px solid rgba(64, 158, 255, 0.2);
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #fff;
  font-size: 15px;
  margin-bottom: 20px;
  min-height: 22px;
}

.loading-progress {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s ease;
}
</style>