<template>
  <div class="settings-container">
    <div class="page-header">
      <h2 class="page-title">系统设置</h2>
      <p class="page-desc">配置系统参数和个性化选项，设置将自动保存到本地</p>
    </div>

    <div class="settings-content">
      <el-row :gutter="24">
        <el-col :span="12">
          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Monitor /></el-icon>
                <span class="header-title">显示设置</span>
              </div>
            </template>

            <div class="settings-form">
              <el-form-item label="背景颜色">
                <div class="form-item-desc">应用于方剂列表、详情分析、系统设置等页面（搜索界面背景固定为深蓝科技）</div>
                <div class="bg-color-options">
                  <div
                    v-for="color in bgColors"
                    :key="color.value"
                    class="color-option"
                    :class="{ active: bgColor === color.value }"
                    :style="{ background: color.gradient }"
                    @click="bgColor = color.value"
                  >
                    <span class="color-name">{{ color.label }}</span>
                    <el-icon v-if="bgColor === color.value" class="check-icon"><Check /></el-icon>
                  </div>
                </div>
              </el-form-item>

              <el-form-item label="字体样式">
                <el-select v-model="fontFamily" placeholder="选择字体">
                  <el-option label="系统默认" value="default" />
                  <el-option label="微软雅黑" value="microsoft" />
                  <el-option label="苹方" value="pingfang" />
                  <el-option label="宋体" value="songti" />
                  <el-option label="楷体" value="kaiti" />
                  <el-option label="Arial" value="arial" />
                </el-select>
              </el-form-item>

              <el-form-item label="字体大小">
                <el-select v-model="fontSize" placeholder="选择字体大小">
                  <el-option label="小号 (12px)" value="small" />
                  <el-option label="默认 (14px)" value="default" />
                  <el-option label="中号 (16px)" value="medium" />
                  <el-option label="大号 (18px)" value="large" />
                  <el-option label="特大号 (20px)" value="xlarge" />
                </el-select>
              </el-form-item>
            </div>
          </el-card>

          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><DataAnalysis /></el-icon>
                <span class="header-title">数据设置</span>
              </div>
            </template>

            <div class="settings-form">
              <el-form-item label="自动刷新数据">
                <el-switch v-model="autoRefresh" active-text="开启" inactive-text="关闭" />
              </el-form-item>

              <el-form-item label="刷新间隔">
                <el-input-number v-model="refreshInterval" :min="30" :max="3600" :step="30" />
                <span class="input-unit">秒</span>
              </el-form-item>

              <el-form-item label="缓存数据">
                <el-switch v-model="cacheData" active-text="开启" inactive-text="关闭" />
              </el-form-item>

              <el-form-item label="显示预测概率阈值">
                <el-slider v-model="probabilityThreshold" :min="0" :max="100" :step="5" />
                <span class="slider-value">{{ probabilityThreshold }}%</span>
              </el-form-item>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Bell /></el-icon>
                <span class="header-title">通知设置</span>
              </div>
            </template>

            <div class="settings-form">
              <el-form-item label="系统通知">
                <el-switch v-model="systemNotification" active-text="开启" inactive-text="关闭" />
              </el-form-item>

              <el-form-item label="数据分析完成提醒">
                <el-switch v-model="analysisCompleteNotification" active-text="开启" inactive-text="关闭" />
              </el-form-item>

              <el-form-item label="新数据更新提醒">
                <el-switch v-model="dataUpdateNotification" active-text="开启" inactive-text="关闭" />
              </el-form-item>
            </div>
          </el-card>

          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><Mic /></el-icon>
                <span class="header-title">语音设置</span>
              </div>
            </template>

            <div class="settings-form">
              <el-form-item label="启用语音播报">
                <el-switch v-model="speechEnabled" active-text="开启" inactive-text="关闭" />
              </el-form-item>

              <el-form-item label="语音选择">
                <el-select v-model="speechVoice" placeholder="选择语音" :disabled="!speechEnabled">
                  <el-option label="系统默认" value="" />
                  <el-option v-for="voice in voices" :key="voice.name" :label="voice.name" :value="voice.name" />
                </el-select>
              </el-form-item>

              <el-form-item label="语速">
                <el-slider v-model="speechRate" :min="0.5" :max="2" :step="0.1" :disabled="!speechEnabled" />
                <span class="slider-value">{{ speechRate }}x</span>
              </el-form-item>

              <el-form-item label="音调">
                <el-slider v-model="speechPitch" :min="0.5" :max="2" :step="0.1" :disabled="!speechEnabled" />
                <span class="slider-value">{{ speechPitch }}x</span>
              </el-form-item>

              <el-form-item>
                <el-button type="primary" @click="testSpeech" :disabled="!speechEnabled">
                  <el-icon><Mic /></el-icon>
                  测试语音
                </el-button>
              </el-form-item>
            </div>
          </el-card>

          <el-card class="settings-card">
            <template #header>
              <div class="card-header">
                <el-icon class="header-icon"><InfoFilled /></el-icon>
                <span class="header-title">系统信息</span>
              </div>
            </template>

            <div class="system-info">
              <div class="info-item">
                <span class="info-label">系统名称</span>
                <span class="info-value">哮喘方剂智能分析系统</span>
              </div>
              <div class="info-item">
                <span class="info-label">版本号</span>
                <span class="info-value">v1.0.0</span>
              </div>
              <div class="info-item">
                <span class="info-label">前端框架</span>
                <span class="info-value">Vue 3 + Element Plus</span>
              </div>
              <div class="info-item">
                <span class="info-label">图表库</span>
                <span class="info-value">ECharts + Cytoscape</span>
              </div>
              <div class="info-item">
                <span class="info-label">数据来源</span>
                <span class="info-value">PU学习算法预测</span>
              </div>
              <div class="info-item">
                <span class="info-label">收录方剂数</span>
                <span class="info-value">128 首</span>
              </div>
              <div class="info-item">
                <span class="info-label">化合物数量</span>
                <span class="info-value">24,531 种</span>
              </div>
              <div class="info-item">
                <span class="info-label">关联靶点数</span>
                <span class="info-value">1,422 个</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="action-buttons">
        <el-button @click="handleReset">
          <el-icon><RefreshLeft /></el-icon>
          重置默认
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Monitor,
  DataAnalysis,
  Bell,
  InfoFilled,
  Check,
  RefreshLeft,
  Mic
} from '@element-plus/icons-vue'
import { useSettings } from '../composables/useSettings'
import { useSpeech } from '../composables/useSpeech'

const {
  bgColor,
  fontFamily,
  fontSize,
  autoRefresh,
  refreshInterval,
  cacheData,
  probabilityThreshold,
  systemNotification,
  analysisCompleteNotification,
  dataUpdateNotification,
  speechVoice,
  speechRate,
  speechPitch,
  speechEnabled,
  bgColors,
  resetSettings
} = useSettings()

const { getVoices, initSpeech } = useSpeech()
const voices = ref([])

onMounted(() => {
  initSpeech()
  voices.value = getVoices()
})

function testSpeech() {
  const { speak } = useSpeech()
  speak('哮喘方剂智能分析系统语音测试', {
    voice: speechVoice.value,
    rate: speechRate.value,
    pitch: speechPitch.value
  })
}

function handleReset() {
  resetSettings()
  ElMessage.info('已重置为默认设置')
}
</script>

<style scoped>
.settings-container {
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

.settings-content {
  max-width: 1200px;
}

.settings-card {
  margin-bottom: 24px;
  border-radius: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 18px;
  color: #409eff;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.settings-form {
  padding-top: 16px;
}

.settings-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

.settings-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: #666;
}

.form-item-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: 12px;
}

.bg-color-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.color-option {
  position: relative;
  height: 60px;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  overflow: hidden;
}

.color-option:hover {
  transform: scale(1.05);
  border-color: #409eff;
}

.color-option.active {
  border-color: #409eff;
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2);
}

.color-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  color: #fff;
  font-size: 16px;
}

.input-unit {
  margin-left: 8px;
  color: #999;
}

.slider-value {
  margin-left: 12px;
  color: #409eff;
  font-weight: 500;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 40px;
}

.action-buttons :deep(.el-button) {
  padding: 12px 32px;
  font-size: 15px;
}
</style>