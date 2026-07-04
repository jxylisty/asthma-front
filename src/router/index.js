import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Detail from '../views/Detail.vue'
import Expert from '../views/Expert.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
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
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router