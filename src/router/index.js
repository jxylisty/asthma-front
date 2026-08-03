import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Prediction from '../views/Prediction.vue'
import Detail from '../views/Detail.vue'
import Expert from '../views/Expert.vue'
import Prescriptions from '../views/Prescriptions.vue'
import Herbs from '../views/Herbs.vue'
import HerbDetail from '../views/HerbDetail.vue'
import Compounds from '../views/Compounds.vue'
import CompoundDetail from '../views/CompoundDetail.vue'
import NodeEditor from '../views/NodeEditor.vue'
import Settings from '../views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/prediction',
    name: 'Prediction',
    component: Prediction
  },
  {
    path: '/prescriptions',
    name: 'Prescriptions',
    component: Prescriptions
  },
  {
    path: '/detail',
    name: 'Detail',
    component: Detail
  },
  {
    path: '/expert',
    name: 'Expert',
    component: Expert
  },
  {
    path: '/herbs',
    name: 'Herbs',
    component: Herbs
  },
  {
    path: '/herbs/detail',
    name: 'HerbDetail',
    component: HerbDetail
  },
  {
    path: '/compounds',
    name: 'Compounds',
    component: Compounds
  },
  {
    path: '/compounds/detail',
    name: 'CompoundDetail',
    component: CompoundDetail
  },
  {
    path: '/node-editor',
    name: 'NodeEditor',
    component: NodeEditor
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router