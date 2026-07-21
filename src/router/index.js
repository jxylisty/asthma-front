import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import Expert from '../views/Expert.vue'
import Prescriptions from '../views/Prescriptions.vue'
import NodeEditor from '../views/NodeEditor.vue'
import Settings from '../views/Settings.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
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