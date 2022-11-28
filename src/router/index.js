import Vue from 'vue'
import Router from 'vue-router'
import GpsTest from '@/components/GpsTest'

Vue.use(Router)

export default new Router({
  mode: 'history',

  routes: [
    {
      path: '/',
      name: 'GpsTest',
      component: GpsTest
    }
  ]
})
