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
    // ============ V2 业务扩展模块 ============
    // 客户管理
    { path: '/customers', name: 'customer-list', component: () => import('@/pages/CustomerListPage.vue'), meta: { title: '客户管理' } },
    { path: '/customers/new', name: 'customer-new', component: () => import('@/pages/CustomerFormPage.vue'), meta: { title: '新增客户' } },
    { path: '/customers/:id/edit', name: 'customer-edit', component: () => import('@/pages/CustomerFormPage.vue'), meta: { title: '编辑客户' } },
    // 询价管理
    { path: '/inquiries', name: 'inquiry-list', component: () => import('@/pages/InquiryListPage.vue'), meta: { title: '询价管理' } },
    { path: '/inquiries/new', name: 'inquiry-new', component: () => import('@/pages/InquiryFormPage.vue'), meta: { title: '新增询价' } },
    { path: '/inquiries/:id/edit', name: 'inquiry-edit', component: () => import('@/pages/InquiryFormPage.vue'), meta: { title: '编辑询价' } },
    // 合同管理
    { path: '/contracts', name: 'contract-list', component: () => import('@/pages/ContractListPage.vue'), meta: { title: '合同管理' } },
    { path: '/contracts/new', name: 'contract-new', component: () => import('@/pages/ContractFormPage.vue'), meta: { title: '新增合同' } },
    { path: '/contracts/:id/edit', name: 'contract-edit', component: () => import('@/pages/ContractFormPage.vue'), meta: { title: '编辑合同' } },
    // 财务工作台 - 付款管理
    { path: '/payments', name: 'payment-list', component: () => import('@/pages/PaymentListPage.vue'), meta: { title: '付款管理' } },
    { path: '/payments/new', name: 'payment-new', component: () => import('@/pages/PaymentFormPage.vue'), meta: { title: '新增付款' } },
    { path: '/payments/:id/edit', name: 'payment-edit', component: () => import('@/pages/PaymentFormPage.vue'), meta: { title: '编辑付款' } },
    // 调度中心
    { path: '/dispatch', name: 'dispatch-list', component: () => import('@/pages/DispatchListPage.vue'), meta: { title: '调度中心' } },
    { path: '/dispatch/new', name: 'dispatch-new', component: () => import('@/pages/DispatchFormPage.vue'), meta: { title: '新增派单' } },
    { path: '/dispatch/:id/edit', name: 'dispatch-edit', component: () => import('@/pages/DispatchFormPage.vue'), meta: { title: '编辑派单' } },
    // 运输跟踪
    { path: '/transport', name: 'transport-list', component: () => import('@/pages/TransportListPage.vue'), meta: { title: '运输跟踪' } },
    { path: '/transport/new', name: 'transport-new', component: () => import('@/pages/TransportFormPage.vue'), meta: { title: '新增运输记录' } },
    { path: '/transport/:id/edit', name: 'transport-edit', component: () => import('@/pages/TransportFormPage.vue'), meta: { title: '编辑运输记录' } },
    // 仓储入库
    { path: '/inbound', name: 'inbound-list', component: () => import('@/pages/InboundListPage.vue'), meta: { title: '仓储入库' } },
    { path: '/inbound/new', name: 'inbound-new', component: () => import('@/pages/InboundFormPage.vue'), meta: { title: '新增入库' } },
    { path: '/inbound/:id/edit', name: 'inbound-edit', component: () => import('@/pages/InboundFormPage.vue'), meta: { title: '编辑入库' } },
    // 库存中心
    { path: '/inventory', name: 'inventory-list', component: () => import('@/pages/InventoryListPage.vue'), meta: { title: '库存中心' } },
    { path: '/inventory/new', name: 'inventory-new', component: () => import('@/pages/InventoryFormPage.vue'), meta: { title: '新增库存批次' } },
    { path: '/inventory/:id/edit', name: 'inventory-edit', component: () => import('@/pages/InventoryFormPage.vue'), meta: { title: '编辑库存批次' } },
    // 出库中心
    { path: '/outbound', name: 'outbound-list', component: () => import('@/pages/OutboundListPage.vue'), meta: { title: '出库中心' } },
    { path: '/outbound/new', name: 'outbound-new', component: () => import('@/pages/OutboundFormPage.vue'), meta: { title: '新增出库' } },
    { path: '/outbound/:id/edit', name: 'outbound-edit', component: () => import('@/pages/OutboundFormPage.vue'), meta: { title: '编辑出库' } },
    // 结算中心
    { path: '/settlement', name: 'settlement-list', component: () => import('@/pages/SettlementListPage.vue'), meta: { title: '结算中心' } },
    { path: '/settlement/new', name: 'settlement-new', component: () => import('@/pages/SettlementFormPage.vue'), meta: { title: '新增结算' } },
    { path: '/settlement/:id/edit', name: 'settlement-edit', component: () => import('@/pages/SettlementFormPage.vue'), meta: { title: '编辑结算' } },
    // 报价/撮合管理
    { path: '/quotes', name: 'quote-list', component: () => import('@/pages/QuoteListPage.vue'), meta: { title: '报价/撮合管理' } },
    { path: '/quotes/new', name: 'quote-new', component: () => import('@/pages/QuoteFormPage.vue'), meta: { title: '新增报价' } },
    { path: '/quotes/:id/edit', name: 'quote-edit', component: () => import('@/pages/QuoteFormPage.vue'), meta: { title: '编辑报价' } },
    // 成本核算管理
    { path: '/costs', name: 'cost-list', component: () => import('@/pages/CostListPage.vue'), meta: { title: '成本核算管理' } },
    { path: '/costs/new', name: 'cost-new', component: () => import('@/pages/CostFormPage.vue'), meta: { title: '新增成本核算' } },
    { path: '/costs/:id/edit', name: 'cost-edit', component: () => import('@/pages/CostFormPage.vue'), meta: { title: '编辑成本核算' } },
    // 接货管理
    { path: '/receipts', name: 'receipt-list', component: () => import('@/pages/ReceiptListPage.vue'), meta: { title: '接货管理' } },
    { path: '/receipts/new', name: 'receipt-new', component: () => import('@/pages/ReceiptFormPage.vue'), meta: { title: '新增接货' } },
    { path: '/receipts/:id/edit', name: 'receipt-edit', component: () => import('@/pages/ReceiptFormPage.vue'), meta: { title: '编辑接货' } },
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
