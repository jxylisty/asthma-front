<template>
  <div class="prediction-container">
    <!-- 左侧控制区 30% -->
    <div class="control-panel">
      <div class="panel-header">
        <h2 class="panel-title">入血预测控制台</h2>
        <p class="panel-desc">AI 驱动的化合物入血概率预测</p>
      </div>

      <el-card class="form-card" shadow="never">
        <el-form :model="form" label-position="top" class="predict-form">
          <!-- 模型选择 -->
          <el-form-item label="预测模型">
            <el-radio-group v-model="form.model" class="model-radio-group">
              <el-radio value="HERB">HERB 2.0（基础初筛）</el-radio>
              <el-radio value="CCTCM">CCTCM 2.0（高精验证）</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 化合物名称 -->
          <el-form-item label="化合物名称">
            <el-autocomplete
              v-model="form.compoundName"
              :fetch-suggestions="searchCompounds"
              placeholder="输入化合物名称，自动回填特征"
              clearable
              class="full-width"
              @select="handleCompoundSelect"
            >
              <template #default="{ item }">
                <div class="autocomplete-item">
                  <span class="compound-name-text">{{ item.name }}</span>
                  <el-tag size="small" :type="item.asthmaRelated ? 'danger' : 'info'">
                    {{ item.asthmaRelated ? '哮喘相关' : '普通' }}
                  </el-tag>
                </div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <!-- 动态特征列表 -->
          <div class="feature-section" v-if="currentFeatures.length > 0">
            <div class="section-label-row">
              <span class="section-label">模型输入特征（{{ currentFeatures.length }} 项）</span>
              <el-tag type="info" size="small" effect="dark" class="rdkit-tag">
                {{ form.model === 'CCTCM' ? 'CCTCM 2.0' : 'HERB 2.0' }} 模型
              </el-tag>
            </div>
            <el-form-item
              v-for="f in currentFeatures"
              :key="f.name"
              :label="f.label + (f.unit ? ' (' + f.unit + ')' : '')"
            >
              <el-input-number
                v-model="form.features[f.name]"
                :precision="2"
                :step="0.1"
                controls-position="right"
                class="full-width"
              />
            </el-form-item>
          </div>

          <!-- 特征说明 -->
          <div class="feature-section" v-if="currentFeatures.length === 0">
            <div class="section-label">正在加载模型特征...</div>
          </div>

          <!-- 执行按钮 -->
          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="predict-btn"
              :loading="predicting"
              @click="runPrediction"
            >
              <el-icon v-if="!predicting"><MagicStick /></el-icon>
              {{ predicting ? 'AI 预测中...' : '发起 AI 实时预测' }}
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 右侧渲染区 70% -->
    <div class="render-panel">
      <div class="render-header" v-if="predictionResult">
        <div class="result-info">
          <span class="result-label">预测入血概率：</span>
          <span class="result-value" :style="{ color: getProbabilityColor(predictionResult.probability) }">
            {{ (predictionResult.probability * 100).toFixed(1) }}%
          </span>
          <el-tag :type="predictionResult.model === 'CCTCM' ? 'success' : 'primary'" size="small" effect="dark">
            {{ predictionResult.model === 'CCTCM' ? 'CCTCM 2.0' : 'HERB 2.0' }}
          </el-tag>
        </div>
      </div>

      <div class="network-wrapper" v-loading="predicting" element-loading-text="AI 正在分析网络关系...">
        <div ref="networkContainer" class="network-container"></div>
        <div class="network-empty" v-if="!cyInstance && !predicting">
          <el-icon class="empty-icon"><DataAnalysis /></el-icon>
          <p class="empty-text">请在左侧填写化合物信息并发起预测</p>
          <p class="empty-hint">预测结果将以网络图形式展示化合物-靶点关系</p>
        </div>
      </div>

      <!-- 图例 -->
      <div class="network-legend" v-if="cyInstance">
        <div class="legend-item">
          <span class="legend-dot compound"></span>
          <span>化合物</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot target"></span>
          <span>靶点</span>
        </div>
        <div class="legend-item">
          <span class="legend-line high"></span>
          <span>高活性和</span>
        </div>
        <div class="legend-item">
          <span class="legend-line mid"></span>
          <span>中等活性</span>
        </div>
        <div class="legend-item">
          <span class="legend-line low"></span>
          <span>低活性</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, MagicStick } from '@element-plus/icons-vue'
import cytoscape from 'cytoscape'
import { getHighPotentialCompounds, getCompoundTargets, getPredictionModels, predictCctcm, predictHerb } from '../api'

const networkContainer = ref(null)
let cyInstance = null
const predicting = ref(false)
const predictionResult = ref(null)

const compoundSummaries = ref([])
const modelFeatures = ref({ cctcm: [], herb: [] })

const form = reactive({
  model: 'HERB',
  compoundName: '',
  features: {},
  manualMode: true
})

// 加载模型特征列表
async function loadModelFeatures() {
  try {
    const data = await getPredictionModels()
    const models = data || []
    for (const m of models) {
      const key = m.model_name.toLowerCase()
      modelFeatures.value[key] = (m.features || []).map(f => ({
        name: f.name,
        label: f.label || f.name,
        unit: f.unit || ''
      }))
    }
  } catch (e) {
    console.error('Failed to load model features:', e)
  }
}

// 当前模型的特征列表
const currentFeatures = ref([])
watch(() => form.model, (val) => {
  currentFeatures.value = modelFeatures.value[val.toLowerCase()] || []
}, { immediate: true })

async function loadCompoundSummaries() {
  try {
    const res = await getHighPotentialCompounds(1, 500)
    const items = res?.items || []
    compoundSummaries.value = items.map(c => ({
      name: c.name,
      mw: c.mw,
      logp: c.logp,
      bloodEntryProbability: c.blood_entry_probability,
      asthmaRelated: c.asthma_related || false,
      id: c.id
    }))
  } catch (e) {
    console.error('Failed to load compound summaries:', e)
  }
}

loadCompoundSummaries()
loadModelFeatures()

function searchCompounds(queryString, callback) {
  if (!queryString) {
    callback(compoundSummaries.value.slice(0, 20))
    return
  }
  const query = queryString.toLowerCase()
  const results = compoundSummaries.value
    .filter(c => c.name.toLowerCase().includes(query))
    .slice(0, 20)
  callback(results)
}

function handleCompoundSelect(item) {
  form.compoundName = item.name
  form.manualMode = false

  // 根据当前模型的特征列表回填
  const features = currentFeatures.value
  for (const f of features) {
    const name = f.name
    // 映射化合物数据到模型特征
    if (name === 'MolWt' && item.mw != null) form.features[name] = item.mw
    else if (name === 'MolLogP' && item.logp != null) form.features[name] = item.logp
    else if (name === 'LogP' && item.logp != null) form.features[name] = item.logp
  }

  ElMessage.success(`已自动回填 ${item.name} 的基础特征，请补充其余特征`)
}

function getProbabilityColor(prob) {
  if (prob >= 0.7) return '#67c23a'
  if (prob >= 0.5) return '#e6a23c'
  return '#f56c6c'
}

function buildPredictPayload() {
  // 基于当前模型的特征列表构建，用户填写的值传入，未填写的由后端 imputer 填补
  const features = {}
  for (const f of currentFeatures.value) {
    if (form.features[f.name] != null && form.features[f.name] !== '') {
      features[f.name] = Number(form.features[f.name])
    }
  }
  return {
    compound_name: form.compoundName,
    features
  }
}

async function runPrediction() {
  if (!form.compoundName) {
    ElMessage.warning('请输入化合物名称')
    return
  }

  predicting.value = true
  predictionResult.value = null

  try {
    const compoundData = compoundSummaries.value.find(c => c.name === form.compoundName)

    // 调用预测 API
    let probability
    try {
      const payload = buildPredictPayload()
      const res = form.model === 'CCTCM'
        ? await predictCctcm(payload)
        : await predictHerb(payload)
      probability = res.probability
    } catch (e) {
      console.error('Prediction API failed:', e)
      ElMessage.error('预测接口请求失败，请检查后端服务是否正常')
      return
    }

    // 加载靶点：命中化合物则请求靶点 API，否则由 renderNetwork 生成模拟靶点
    let targets = []
    if (compoundData && compoundData.id) {
      try {
        const targetList = await getCompoundTargets(compoundData.id)
        targets = (targetList || []).map(t => ({
          gene: t.gene,
          sourceDB: t.source_db || t.target_type || '',
          networkCentrality: t.network_centrality || 0
        }))
      } catch (e) {
        console.error('Failed to load compound targets:', e)
      }
    }

    predictionResult.value = {
      probability,
      model: form.model,
      compoundName: form.compoundName
    }

    // 渲染网络图
    await nextTick()
    renderNetwork(form.compoundName, targets, probability)

    ElMessage.success('预测完成！')
  } catch (e) {
    console.error('Prediction failed:', e)
    ElMessage.error('预测失败，请重试')
  } finally {
    predicting.value = false
  }
}

function renderNetwork(compoundName, targets, probability) {
  // 销毁旧实例
  if (cyInstance) {
    cyInstance.destroy()
    cyInstance = null
  }

  const elements = {
    nodes: [
      {
        data: {
          id: 'compound',
          label: compoundName,
          category: 'compound',
          prob: Math.round(probability * 100)
        }
      }
    ],
    edges: []
  }

  // 添加靶点节点和边
  const maxTargets = Math.min(targets.length, 30)
  for (let i = 0; i < maxTargets; i++) {
    const t = targets[i]
    const targetId = `target_${i}`
    const activity = t.networkCentrality || 0

    elements.nodes.push({
      data: {
        id: targetId,
        label: t.gene || `靶点${i + 1}`,
        category: 'target',
        activity: activity,
        sourceDB: t.sourceDB || ''
      }
    })

    elements.edges.push({
      data: {
        id: `edge_${i}`,
        source: 'compound',
        target: targetId,
        activity: activity
      }
    })
  }

  // 无靶点数据时不生成模拟靶点，仅展示化合物节点

  cyInstance = cytoscape({
    container: networkContainer.value,
    elements: elements,
    style: [
      {
        selector: 'node[category="compound"]',
        style: {
          'background-color': function(ele) {
            const prob = ele.data('prob')
            if (prob >= 70) return '#67c23a'
            if (prob >= 50) return '#e6a23c'
            return '#f56c6c'
          },
          'shape': 'circle',
          'width': 60,
          'height': 60,
          'label': 'data(label)',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': 12,
          'font-weight': 'bold',
          'text-wrap': 'wrap',
          'text-max-width': 70,
          'border-width': 3,
          'border-color': '#fff'
        }
      },
      {
        selector: 'node[category="target"]',
        style: {
          'background-color': '#409eff',
          'shape': 'ellipse',
          'width': 45,
          'height': 45,
          'label': 'data(label)',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': 10,
          'font-weight': 'bold',
          'text-wrap': 'wrap',
          'text-max-width': 50
        }
      },
      {
        selector: 'edge',
        style: {
          'width': function(ele) {
            const act = ele.data('activity')
            return 1 + act * 4
          },
          'line-color': function(ele) {
            const act = ele.data('activity')
            if (act >= 0.66) return '#67c23a'
            if (act >= 0.33) return '#e6a23c'
            return '#f56c6c'
          },
          'target-arrow-color': function(ele) {
            const act = ele.data('activity')
            if (act >= 0.66) return '#67c23a'
            if (act >= 0.33) return '#e6a23c'
            return '#f56c6c'
          },
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'opacity': 0.8
        }
      }
    ],
    layout: {
      name: 'cose',
      animate: true,
      animationDuration: 500,
      nodeRepulsion: function() { return 8000 },
      idealEdgeLength: function() { return 120 },
      padding: 40
    }
  })
}

onUnmounted(() => {
  if (cyInstance) {
    cyInstance.destroy()
    cyInstance = null
  }
})
</script>

<style scoped>
.prediction-container {
  display: flex;
  height: 100vh;
  background: var(--bg-gradient);
  overflow: hidden;
}

/* 左侧控制区 */
.control-panel {
  width: 30%;
  min-width: 360px;
  max-width: 480px;
  padding: 24px;
  overflow-y: auto;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  scrollbar-width: none; /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none; /* IE/Edge 隐藏滚动条 */
}

/* 控制台滚动条透明化（WebKit 内核） */
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: transparent;
}

.control-panel::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.15);
}

.panel-header {
  margin-bottom: 20px;
}

.panel-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 6px 0;
}

.panel-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
}

.form-card {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.form-card :deep(.el-card__body) {
  padding: 20px;
}

.predict-form :deep(.el-form-item__label) {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  padding-bottom: 4px;
}

.predict-form :deep(.el-radio__label) {
  color: var(--text-secondary);
  font-size: 13px;
}

.model-radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.full-width {
  width: 100%;
}

.autocomplete-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.compound-name-text {
  font-size: 14px;
}

.feature-section {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
  padding-left: 4px;
}

.section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.section-label-row .section-label {
  margin-bottom: 0;
}

.rdkit-tag {
  font-size: 11px;
}

.predict-btn {
  width: 100%;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-top: 8px;
}

/* 右侧渲染区 */
.render-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.render-header {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.result-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-label {
  font-size: 16px;
  color: var(--text-secondary);
}

.result-value {
  font-size: 28px;
  font-weight: 700;
}

.network-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.network-container {
  width: 100%;
  height: 100%;
}

.network-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  color: var(--text-muted);
  margin-bottom: 16px;
}

.empty-text {
  font-size: 18px;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
  margin: 0;
}

.network-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: rgba(26, 26, 46, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.legend-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

.legend-dot.compound {
  background: #67c23a;
}

.legend-dot.target {
  background: #409eff;
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.high {
  background: #67c23a;
}

.legend-line.mid {
  background: #e6a23c;
}

.legend-line.low {
  background: #f56c6c;
}
</style>
