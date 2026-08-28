import { createRouter, createWebHistory } from 'vue-router'

/**
 * 路由表 —— 全部懒加载，按需分包。
 * base 使用相对路径 './'，便于部署到子目录；如部署到根域名可改为 '/'。
 */
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
      meta: { title: '订单列表' },
    },
    {
      path: '/orders/new',
      name: 'order-new',
      component: () => import('@/pages/OrderFormPage.vue'),
      meta: { title: '新建订单' },
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: () => import('@/pages/order-detail/OrderDetailPage.vue'),
      meta: { title: '订单详情' },
    },
    {
      path: '/orders/:id/edit',
      name: 'order-edit',
      component: () => import('@/pages/OrderFormPage.vue'),
      meta: { title: '编辑订单' },
    },
    {
      path: '/orders/:id/port',
      name: 'order-port',
      component: () => import('@/pages/PortFormPage.vue'),
      meta: { title: '港口信息' },
    },
    {
      path: '/orders/:id/capacity',
      name: 'order-capacity',
      component: () => import('@/pages/CapacityFormPage.vue'),
      meta: { title: '运力信息' },
    },
    {
      path: '/orders/:id/plan',
      name: 'order-plan',
      component: () => import('@/pages/PlanReportPage.vue'),
      meta: { title: '运输组织方案' },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
  scrollBehavior(_to, _from, saved) {
    return saved ?? { top: 0 }
  },
})

router.afterEach((to) => {
  const base = import.meta.env.VITE_APP_TITLE ?? '泓泽宜通'
  const t = to.meta.title as string | undefined
  document.title = t ? `${t} · ${base}` : base
})

export default router
