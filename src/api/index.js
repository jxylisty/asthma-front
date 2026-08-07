import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 60000
})

// 响应拦截器：统一提取 data
api.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 200) {
      console.error('API Error:', res.message)
      return Promise.reject(new Error(res.message))
    }
    return res.data
  },
  error => Promise.reject(error)
)

// ===== 系统 =====
export const getStatistics = () => api.get('/system/statistics')
export const search = (keyword) => api.get('/system/search', { params: { keyword } })

// ===== 方剂 =====
export const getPrescriptions = (page = 1, pageSize = 20) => api.get('/prescriptions', { params: { page, page_size: pageSize } })
export const getPrescriptionDetail = (id) => api.get(`/prescriptions/${id}`)
export const getPrescriptionNetwork = (id, minProb = 0.7) => api.get(`/prescriptions/${id}/network`, { params: { min_prob: minProb } })
export const getPrescriptionRadar = (id) => api.get(`/prescriptions/${id}/radar`)
export const getPrescriptionCompounds = (id, minProb = 0.5) => api.get(`/prescriptions/${id}/compounds`, { params: { min_prob: minProb } })

// ===== 药材 =====
export const getHerbs = (page = 1, pageSize = 20, keyword = '') => api.get('/herbs', { params: { page, page_size: pageSize, keyword } })
export const getHerbDetail = (id) => api.get(`/herbs/${id}`)
export const getHerbCompounds = (id) => api.get(`/herbs/${id}/compounds`)

// ===== 化合物 =====
export const getCompounds = (page = 1, pageSize = 20, keyword = '', minProb = 0) => api.get('/compounds', { params: { page, page_size: pageSize, keyword, min_prob: minProb } })
export const getCompoundDetail = (id) => api.get(`/compounds/${id}`)
export const getHighPotentialCompounds = (page = 1, pageSize = 20) => api.get('/compounds/high-potential', { params: { page, page_size: pageSize } })
export const getCompoundTargets = (id) => api.get(`/compounds/${id}/targets`)
export const getCompoundRadar = (id) => api.get(`/compounds/${id}/radar`)

// ===== 预测 =====
export const getPredictionModels = () => api.get('/prediction/models')
export const predictCctcm = (data) => api.post('/prediction/predict/cctcm', data)
export const predictHerb = (data) => api.post('/prediction/predict/herb', data)

// ===== 专家模式 =====
export const getExpertMetrics = () => api.get('/expert/metrics')
export const getFeatureImportance = () => api.get('/expert/feature-importance')
