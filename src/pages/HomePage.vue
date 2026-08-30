<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon, { type IconName } from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { STATUS_META, customersDisplay, migrateStatus } from '@/types'
import type { Order, OrderStatus } from '@/types'
import { fmtDateShort, fmtNum } from '@/lib/format'

const router = useRouter()
const store = useOrderStore()
const auth = useAuthStore()

/** 订单创建/删除仅限业务人员与系统管理员 */
const canCreateOrder = computed(() => auth.role === 'sales' || auth.role === 'admin')

/* ---------- 搜索 ---------- */
const query = ref('')

/* ---------- 排序（表头点击驱动） ---------- */
type SortKey = 'createdAt' | 'id' | 'cargoTotal' | 'status'
const sortKey = ref<SortKey>('createdAt')
const sortDesc = ref(true)
function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortKey.value = key
    sortDesc.value = true
  }
}

/* ---------- 状态筛选（与统计条合一） ---------- */
type StatusFilter = 'all' | 'create' | 'business' | 'final'
const statusFilter = ref<StatusFilter>('all')

const statusOrder: NonNullable<OrderStatus>[] = [
  'draft', 'port', 'capacity', 'plan',
  'pending_confirm', 'confirmed', 'shipping', 'shipped', 'completed',
]

/* ---------- 统计 ---------- */
const stats = computed(() => {
  const list = store.orders
  const total = list.length
  const createPhase = list.filter((o) => {
    const s = migrateStatus(o.status)
    return s && STATUS_META[s].phase === 'create'
  }).length
  const businessPhase = list.filter((o) => {
    const s = migrateStatus(o.status)
    return s && STATUS_META[s].phase === 'business'
  }).length
  const completed = list.filter((o) => migrateStatus(o.status) === 'completed').length
  const totalTons = list.reduce((s, o) => s + (o.cargoTotal || 0), 0)
  return { total, createPhase, businessPhase, completed, totalTons }
})

/* ---------- 过滤 + 排序 ---------- */
const filtered = computed(() => {
  let list: Order[] = store.orders.slice()
  // 状态筛选
  if (statusFilter.value !== 'all') {
    list = list.filter((o) => {
      const s = migrateStatus(o.status)
      if (!s) return false
      return STATUS_META[s].phase === statusFilter.value || (statusFilter.value === 'final' && s === 'completed')
    })
  }
  // 关键词搜索
  const q = query.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.trader.toLowerCase().includes(q) ||
        o.cargoName.toLowerCase().includes(q) ||
        customersDisplay(o.customers).toLowerCase().includes(q) ||
        o.destPort.toLowerCase().includes(q),
    )
  }
  // 排序
  list.sort((a, b) => {
    let cmp = 0
    const sa = migrateStatus(a.status)
    const sb = migrateStatus(b.status)
    if (sortKey.value === 'createdAt') {
      cmp = a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0
    } else if (sortKey.value === 'id') {
      cmp = a.id.localeCompare(b.id)
    } else if (sortKey.value === 'cargoTotal') {
      cmp = (a.cargoTotal || 0) - (b.cargoTotal || 0)
    } else if (sortKey.value === 'status') {
      const ia = sa ? statusOrder.indexOf(sa) : 0
      const ib = sb ? statusOrder.indexOf(sb) : 0
      cmp = ia - ib
    }
    return sortDesc.value ? -cmp : cmp
  })
  return list
})

function handleDelete(id: string) {
  if (confirm(`确认删除订单 ${id} 及其所有关联数据？此操作不可撤销。`)) {
    store.removeOrder(id)
  }
}

/** 运输通道类型摘要（只统计已编制计划的通道，空通道不计入） */
function channelSummary(o: Order): string {
  const caps = store.capacitiesOf(o.id).filter((c) => (c.plannedQty || 0) > 0 || c.origin || c.destination)
  if (caps.length === 0) return '—'
  const types = new Set(caps.map((c) => {
    const m = { rail_direct: '铁路直达', rail_caozhuang: '公铁联运', rail_xingtai: '公铁联运', rail_transit: '公铁联运', road: '公路直达' }
    return m[c.channelType] || c.channelType
  }))
  return Array.from(types).join(' · ')
}

/* ---------- 工作台入口（分岗位任务中心，仅显示当前角色有权访问的工作台） ---------- */
const workspaces = computed(() => {
  const pendingPayment = store.orders.filter((o) => migrateStatus(o.status) === 'pending_confirm').length
  const shippingOrders = store.orders.filter((o) => {
    const s = migrateStatus(o.status)
    return s === 'confirmed' || s === 'shipping'
  }).length
  const warehouseOrders = store.orders.filter((o) => {
    const s = migrateStatus(o.status)
    if (!s || s === 'draft' || s === 'port' || s === 'capacity' || s === 'plan' || s === 'pending_confirm') return false
    const shippings = store.shippingsOf(o.id)
    return shippings.some((x) => (x.shippedQty || 0) > 0)
  }).length
  return [
    { key: 'finance', label: '财务工作台', desc: '确认收款 · 解锁发运', count: pendingPayment, icon: 'dollar' as IconName, to: '/workspace/finance' },
    { key: 'transport', label: '运输工作台', desc: '批次发货 · 通道管理', count: shippingOrders, icon: 'send' as IconName, to: '/workspace/transport' },
    { key: 'warehouse', label: '仓储工作台', desc: '到货入库 · 提货出关', count: warehouseOrders, icon: 'package' as IconName, to: '/workspace/warehouse' },
  ].filter((w) => auth.canAccess(w.to))
})

/* ---------- 状态 → 下一步操作 ---------- */
const NEXT_ACTION: Record<NonNullable<OrderStatus>, { label: string; to: (id: string) => string; primary: boolean }> = {
  draft: { label: '继续录入', to: (id) => `/orders/${id}/edit`, primary: true },
  port: { label: '录入港口', to: (id) => `/orders/${id}/port`, primary: true },
  capacity: { label: '录入运力', to: (id) => `/orders/${id}/capacity`, primary: true },
  plan: { label: '编制方案', to: (id) => `/orders/${id}/plan`, primary: true },
  pending_confirm: { label: '确认收款', to: () => '/workspace/finance', primary: true },
  confirmed: { label: '安排发运', to: () => '/workspace/transport', primary: true },
  shipping: { label: '跟踪发运', to: () => '/workspace/transport', primary: true },
  shipped: { label: '查看详情', to: (id) => `/orders/${id}`, primary: false },
  completed: { label: '查看详情', to: (id) => `/orders/${id}`, primary: false },
}
function nextActionOf(o: Order) {
  const s = migrateStatus(o.status) ?? 'draft'
  const action = NEXT_ACTION[s]
  // 目标页无权访问时，降级为查看详情（如业务人员看到待收款订单）
  const target = action.to(o.id)
  if (!auth.canAccess(target)) {
    return { label: '查看详情', to: (id: string) => `/orders/${id}`, primary: false }
  }
  return action
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <!-- 页面头 -->
    <PageHeader title="工作台" subtitle="录入订单、港口与运力，自动生成运输组织方案，逐单推进发运。" />

    <!-- 分岗位工作台入口（仅当前角色可访问的工作台） -->
    <div v-if="workspaces.length > 0" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <RouterLink
        v-for="w in workspaces"
        :key="w.key"
        :to="w.to"
        class="card p-4 flex items-center gap-3.5 hover:border-apple-blue/40 hover:shadow-md transition-all duration-200 group"
      >
        <div class="flex items-center justify-center w-11 h-11 rounded-apple bg-apple-blue/[0.07] text-apple-blue shrink-0 group-hover:scale-105 transition-transform">
          <Icon :name="w.icon" :size="19" />
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-apple-text">{{ w.label }}</span>
            <span
              v-if="w.count > 0"
              class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-semibold tabular-nums"
            >
              {{ w.count }} 待办
            </span>
          </div>
          <p class="text-[11px] text-apple-subtext mt-0.5">{{ w.desc }}</p>
        </div>
        <Icon name="chevron-right" :size="15" class="text-apple-subtext group-hover:text-apple-blue group-hover:translate-x-0.5 transition-all shrink-0" />
      </RouterLink>
    </div>

    <!-- 统计条：点击即筛选 -->
    <div class="card overflow-hidden">
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-px bg-apple-border/40">
        <button
          v-for="opt in [
            { key: 'all', label: '全部订单', value: stats.total },
            { key: 'create', label: '创建中', value: stats.createPhase },
            { key: 'business', label: '业务流转', value: stats.businessPhase },
            { key: 'final', label: '已完成', value: stats.completed },
          ] as const"
          :key="opt.key"
          @click="statusFilter = opt.key"
          class="bg-apple-card px-4 py-3 text-left transition-colors duration-150"
          :class="statusFilter === opt.key ? 'bg-apple-blue/10' : 'hover:bg-apple-hover/10'"
        >
          <div
            class="text-[11px] flex items-center gap-1.5"
            :class="statusFilter === opt.key ? 'text-apple-blue' : 'text-apple-tertiary'"
          >
            {{ opt.label }}
            <span
              v-if="statusFilter === opt.key"
              class="w-1 h-1 rounded-full bg-apple-blue"
            />
          </div>
          <div
            class="text-lg font-semibold tabular-nums mt-0.5"
            :class="statusFilter === opt.key ? 'text-apple-blue' : 'text-apple-text'"
          >
            {{ opt.value }}
          </div>
        </button>
        <div class="bg-apple-card px-4 py-3">
          <div class="text-[11px] text-apple-tertiary">货物总量</div>
          <div class="text-lg font-semibold text-apple-text mt-0.5 tabular-nums">
            {{ fmtNum(stats.totalTons) }}<span class="text-xs font-normal text-apple-tertiary ml-1">吨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单列表 -->
    <section class="card overflow-hidden">
      <!-- 空状态 -->
      <div v-if="store.orders.length === 0">
        <EmptyState
          icon="clipboard-list"
          title="还没有订单"
          desc="从订单录入开始，依次填写港口与运力信息，最终生成运输组织方案。"
        >
          <button v-if="canCreateOrder" @click="router.push('/orders/new')" class="btn-primary">
            <Icon name="plus" :size="16" />
            创建第一个订单
          </button>
        </EmptyState>
      </div>

      <template v-else>
        <!-- 工具栏：标题 + 搜索 + 新建 -->
        <div class="flex items-center justify-between gap-3 flex-wrap px-5 py-3.5 border-b border-apple-border/60">
          <div class="flex items-baseline gap-2.5">
            <h2 class="text-sm font-semibold text-apple-text">订单列表</h2>
            <span class="text-xs text-apple-tertiary tabular-nums">
              <template v-if="query || statusFilter !== 'all'">
                匹配 {{ filtered.length }} / {{ store.orders.length }}
              </template>
              <template v-else>共 {{ store.orders.length }} 个</template>
            </span>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="relative">
              <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-apple-subtext" />
              <input
                v-model="query"
                placeholder="搜索订单号 / 客户 / 货物…"
                class="field-input pl-9 py-2 w-56 max-w-full"
              />
            </div>
            <button v-if="canCreateOrder" @click="router.push('/orders/new')" class="btn-primary shrink-0">
              <Icon name="plus" :size="15" />
              新建订单
            </button>
          </div>
        </div>

        <!-- 未匹配 -->
        <div v-if="filtered.length === 0">
          <EmptyState icon="search" title="未匹配到订单" desc="尝试更换筛选条件或关键词。" />
        </div>

        <!-- 订单表格 -->
        <div v-else class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-apple-fill/40 border-b border-apple-border">
              <tr>
                <th class="text-left px-4 py-2.5">
                  <button @click="toggleSort('id')" class="inline-flex items-center gap-1 text-[11px] font-medium text-apple-tertiary tracking-wide hover:text-apple-text transition-colors">
                    订单号
                    <Icon v-if="sortKey === 'id'" name="chevron-right" :size="11" :class="sortDesc ? 'rotate-90' : '-rotate-90'" />
                  </button>
                </th>
                <th class="text-left px-4 py-2.5 text-[11px] font-medium text-apple-tertiary tracking-wide">客户</th>
                <th class="text-left px-4 py-2.5">
                  <button @click="toggleSort('cargoTotal')" class="inline-flex items-center gap-1 text-[11px] font-medium text-apple-tertiary tracking-wide hover:text-apple-text transition-colors">
                    货物 · 数量
                    <Icon v-if="sortKey === 'cargoTotal'" name="chevron-right" :size="11" :class="sortDesc ? 'rotate-90' : '-rotate-90'" />
                  </button>
                </th>
                <th class="text-left px-4 py-2.5 text-[11px] font-medium text-apple-tertiary tracking-wide hidden lg:table-cell">目的港</th>
                <th class="text-left px-4 py-2.5 text-[11px] font-medium text-apple-tertiary tracking-wide hidden lg:table-cell">通道</th>
                <th class="text-left px-4 py-2.5">
                  <button @click="toggleSort('status')" class="inline-flex items-center gap-1 text-[11px] font-medium text-apple-tertiary tracking-wide hover:text-apple-text transition-colors">
                    状态
                    <Icon v-if="sortKey === 'status'" name="chevron-right" :size="11" :class="sortDesc ? 'rotate-90' : '-rotate-90'" />
                  </button>
                </th>
                <th class="text-left px-4 py-2.5 text-[11px] font-medium text-apple-tertiary tracking-wide">下一步</th>
                <th class="text-left px-4 py-2.5">
                  <button @click="toggleSort('createdAt')" class="inline-flex items-center gap-1 text-[11px] font-medium text-apple-tertiary tracking-wide hover:text-apple-text transition-colors">
                    更新时间
                    <Icon v-if="sortKey === 'createdAt'" name="chevron-right" :size="11" :class="sortDesc ? 'rotate-90' : '-rotate-90'" />
                  </button>
                </th>
                <th v-if="canCreateOrder" class="w-10 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="o in filtered"
                :key="o.id"
                class="group border-b border-apple-border/50 last:border-0 hover:bg-apple-hover/10 transition-colors"
              >
                <td class="px-4 py-3">
                  <RouterLink :to="`/orders/${o.id}`" class="font-mono text-sm font-medium text-apple-text hover:text-apple-blue transition-colors">
                    {{ o.id }}
                  </RouterLink>
                </td>
                <td class="px-4 py-3 text-sm text-apple-text max-w-32 truncate">{{ o.trader || '—' }}</td>
                <td class="px-4 py-3 text-sm text-apple-text">
                  <span class="max-w-40 truncate inline-block align-bottom">{{ o.cargoName }}</span>
                  <span class="text-apple-tertiary ml-1.5 tabular-nums">{{ fmtNum(o.cargoTotal) }} 吨</span>
                </td>
                <td class="px-4 py-3 text-sm text-apple-text hidden lg:table-cell">{{ o.destPort || '—' }}</td>
                <td class="px-4 py-3 text-sm text-apple-subtext hidden lg:table-cell max-w-32 truncate">{{ channelSummary(o) }}</td>
                <td class="px-4 py-3">
                  <Badge
                    :label="STATUS_META[migrateStatus(o.status) ?? 'draft'].label"
                    :color="STATUS_META[migrateStatus(o.status) ?? 'draft'].color"
                    :bg="STATUS_META[migrateStatus(o.status) ?? 'draft'].bg"
                  />
                </td>
                <td class="px-4 py-3">
                  <RouterLink
                    :to="nextActionOf(o).to(o.id)"
                    class="inline-flex items-center gap-1 text-sm font-medium transition-colors"
                    :class="nextActionOf(o).primary
                      ? 'text-apple-blue hover:text-apple-blueHover'
                      : 'text-apple-subtext hover:text-apple-text'"
                  >
                    {{ nextActionOf(o).label }}
                    <Icon name="chevron-right" :size="12" />
                  </RouterLink>
                </td>
                <td class="px-4 py-3 text-xs text-apple-tertiary tabular-nums whitespace-nowrap">{{ fmtDateShort(o.updatedAt || o.createdAt) }}</td>
                <td v-if="canCreateOrder" class="px-4 py-3">
                  <button
                    @click="handleDelete(o.id)"
                    class="flex items-center justify-center w-7 h-7 rounded-full text-apple-tertiary hover:bg-apple-red/10 hover:text-apple-red opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                    title="删除订单"
                  >
                    <Icon name="trash" :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </section>
  </div>
</template>
