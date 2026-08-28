<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import type { IconName } from '@/components/Icon.vue'
import { useOrderStore } from '@/stores/order'
import { STATUS_META, customersDisplay, migrateStatus } from '@/types'
import type { Order, OrderStatus } from '@/types'
import { fmtDateShort, fmtNum } from '@/lib/format'

const router = useRouter()
const store = useOrderStore()

/* ---------- 搜索 ---------- */
const query = ref('')

/* ---------- 排序 ---------- */
type SortKey = 'createdAt' | 'id' | 'cargoTotal' | 'status'
const sortKey = ref<SortKey>('createdAt')
const sortDesc = ref(true)
const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'createdAt', label: '创建时间' },
  { key: 'id', label: '订单编号' },
  { key: 'cargoTotal', label: '货物总量' },
  { key: 'status', label: '状态' },
]
function toggleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    sortKey.value = key
    sortDesc.value = true
  }
}

/* ---------- 筛选 ---------- */
type StatusFilter = 'all' | 'create' | 'business' | 'final'
const statusFilter = ref<StatusFilter>('all')
const statusFilterOptions: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'create', label: '创建中' },
  { key: 'business', label: '业务流转' },
  { key: 'final', label: '已完成' },
]

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

/* ---------- 业务模块导航 ---------- */
const modules: { name: string; path: string; icon: IconName; color: string }[] = [
  { name: '客户管理', path: '/customers', icon: 'building', color: '#0071e3' },
  { name: '询价管理', path: '/inquiries', icon: 'search', color: '#ff9500' },
  { name: '报价撮合', path: '/quotes', icon: 'send', color: '#ff6b35' },
  { name: '合同管理', path: '/contracts', icon: 'clipboard-list', color: '#af52de' },
  { name: '成本核算', path: '/costs', icon: 'dollar', color: '#00a8cc' },
  { name: '付款管理', path: '/payments', icon: 'dollar', color: '#34c759' },
  { name: '接货管理', path: '/receipts', icon: 'package', color: '#8e44ad' },
  { name: '调度中心', path: '/dispatch', icon: 'route', color: '#5856d6' },
  { name: '运输跟踪', path: '/transport', icon: 'truck', color: '#ff2d55' },
  { name: '仓储入库', path: '/inbound', icon: 'package', color: '#5ac8fa' },
  { name: '库存中心', path: '/inventory', icon: 'layers', color: '#ff9500' },
  { name: '出库中心', path: '/outbound', icon: 'send', color: '#34c759' },
  { name: '结算中心', path: '/settlement', icon: 'file-text', color: '#af52de' },
]

/** 运输通道类型摘要 */
function channelSummary(o: Order): string {
  const caps = store.capacitiesOf(o.id)
  if (caps.length === 0) return '—'
  const types = new Set(caps.map((c) => {
    const m = { rail_direct: '铁路直达', rail_caozhuang: '公铁联运', rail_xingtai: '公铁联运', rail_transit: '公铁联运', road: '公路直达' }
    return m[c.channelType] || c.channelType
  }))
  return Array.from(types).join(' · ')
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <!-- 紧凑顶部区域：标题 + 新建订单 + 统计 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between gap-4 px-5 py-4 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-gradient-to-br from-apple-blue to-blue-700 text-white shadow-sm">
            <Icon name="route" :size="20" />
          </div>
          <div>
            <h1 class="text-base font-semibold tracking-tight text-apple-text">运输组织方案系统</h1>
            <p class="text-[11px] text-apple-subtext mt-0.5">录入订单 · 港口 · 运力，自动生成运输组织方案</p>
          </div>
        </div>
        <button @click="router.push('/orders/new')" class="btn-primary">
          <Icon name="plus" :size="16" />
          新建订单
        </button>
      </div>
      <!-- 统计指标条 -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-apple-border/40 border-t border-apple-border/40">
        <div class="bg-apple-card px-4 py-3">
          <div class="text-[11px] text-apple-subtext">订单总数</div>
          <div class="text-lg font-semibold text-apple-text mt-0.5">{{ stats.total }}</div>
        </div>
        <div class="bg-apple-card px-4 py-3">
          <div class="text-[11px] text-apple-subtext">创建中</div>
          <div class="text-lg font-semibold text-apple-blue mt-0.5">{{ stats.createPhase }}</div>
        </div>
        <div class="bg-apple-card px-4 py-3">
          <div class="text-[11px] text-apple-subtext">业务流转</div>
          <div class="text-lg font-semibold text-apple-orange mt-0.5">{{ stats.businessPhase }}</div>
        </div>
        <div class="bg-apple-card px-4 py-3">
          <div class="text-[11px] text-apple-subtext">货物总量</div>
          <div class="text-lg font-semibold text-apple-purple mt-0.5">{{ fmtNum(stats.totalTons) }}<span class="text-xs font-normal text-apple-subtext ml-1">吨</span></div>
        </div>
      </div>
    </section>

    <!-- 业务模块导航 -->
    <section class="card p-5">
      <h2 class="text-sm font-semibold text-apple-text mb-4">业务模块</h2>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <RouterLink v-for="mod in modules" :key="mod.path" :to="mod.path" class="flex flex-col items-center justify-center p-4 rounded-xl border border-apple-border/50 hover:border-apple-blue/40 hover:bg-apple-blue/5 transition-all group">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-2 text-white" :style="{ backgroundColor: mod.color }">
            <Icon :name="mod.icon" :size="20" />
          </div>
          <span class="text-xs font-medium text-apple-text group-hover:text-apple-blue">{{ mod.name }}</span>
        </RouterLink>
      </div>
    </section>

    <!-- 订单列表 -->
    <section id="list" class="space-y-4 scroll-mt-20">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-apple-text">订单列表</h2>
          <p class="text-xs text-apple-subtext mt-0.5">
            共 {{ store.orders.length }} 个订单
            <template v-if="query || statusFilter !== 'all'"> · 匹配 {{ filtered.length }} 个</template>
          </p>
        </div>
        <!-- 搜索框 -->
        <div v-if="store.orders.length > 0" class="relative">
          <Icon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-apple-subtext" />
          <input
            v-model="query"
            placeholder="搜索订单号 / 客户 / 货物…"
            class="field-input pl-9 py-2 w-64 max-w-full"
          />
        </div>
      </div>

      <!-- 筛选 + 排序工具栏 -->
      <div v-if="store.orders.length > 0" class="flex items-center justify-between gap-3 flex-wrap">
        <!-- 状态筛选 -->
        <div class="flex items-center gap-1 p-1 rounded-apple bg-apple-card border border-apple-border/50">
          <button
            v-for="opt in statusFilterOptions"
            :key="opt.key"
            @click="statusFilter = opt.key"
            class="px-3 py-1.5 text-xs font-medium rounded-[10px] transition-all duration-200"
            :class="statusFilter === opt.key ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-subtext hover:text-apple-text hover:bg-black/5'"
          >
            {{ opt.label }}
          </button>
        </div>
        <!-- 排序 -->
        <div class="flex items-center gap-1">
          <button
            v-for="opt in sortOptions"
            :key="opt.key"
            @click="toggleSort(opt.key)"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-[10px] border transition-all duration-200"
            :class="sortKey === opt.key ? 'border-apple-blue/40 bg-apple-blue/10 text-apple-blue' : 'border-apple-border/50 text-apple-subtext hover:text-apple-text'"
          >
            {{ opt.label }}
            <Icon
              v-if="sortKey === opt.key"
              name="chevron-right"
              :size="12"
              class="transition-transform duration-200"
              :class="sortDesc ? 'rotate-90' : '-rotate-90'"
            />
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="store.orders.length === 0" class="card">
        <EmptyState
          icon="clipboard-list"
          title="还没有订单"
          desc="从订单录入开始，依次填写港口与运力信息，最终生成运输组织方案。"
        >
          <button @click="router.push('/orders/new')" class="btn-primary">
            <Icon name="plus" :size="16" />
            创建第一个订单
          </button>
        </EmptyState>
      </div>

      <div v-else-if="filtered.length === 0" class="card">
        <EmptyState icon="search" title="未匹配到订单" desc="尝试更换筛选条件或关键词。" />
      </div>

      <!-- 订单卡片网格 -->
      <div v-else class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="o in filtered"
          :key="o.id"
          class="card p-4 hover:shadow-card-hover transition-all duration-300 group flex flex-col"
        >
          <!-- 卡片头部：订单号 + 状态 -->
          <RouterLink :to="`/orders/${o.id}`" class="block">
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-mono font-semibold text-apple-text truncate">{{ o.id }}</span>
              <Badge
                :label="STATUS_META[migrateStatus(o.status) ?? 'draft'].label"
                :color="STATUS_META[migrateStatus(o.status) ?? 'draft'].color"
                :bg="STATUS_META[migrateStatus(o.status) ?? 'draft'].bg"
              />
            </div>
          </RouterLink>

          <!-- 关键信息行 -->
          <RouterLink :to="`/orders/${o.id}`" class="block mt-3 space-y-2 flex-1">
            <div class="flex items-center gap-2">
              <Icon name="building" :size="13" class="text-apple-subtext shrink-0" />
              <span class="text-xs text-apple-subtext">客户</span>
              <span class="text-xs font-medium text-apple-text truncate">{{ o.trader || '—' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="package" :size="13" class="text-apple-subtext shrink-0" />
              <span class="text-xs text-apple-subtext">货物</span>
              <span class="text-xs font-medium text-apple-text truncate">{{ o.cargoName }} · {{ fmtNum(o.cargoTotal) }} 吨</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="anchor" :size="13" class="text-apple-subtext shrink-0" />
              <span class="text-xs text-apple-subtext">到港</span>
              <span class="text-xs font-medium text-apple-text truncate">{{ o.destPort || '—' }}</span>
            </div>
            <div class="flex items-center gap-2">
              <Icon name="route" :size="13" class="text-apple-subtext shrink-0" />
              <span class="text-xs text-apple-subtext">通道</span>
              <span class="text-xs font-medium text-apple-text truncate">{{ channelSummary(o) }}</span>
            </div>
          </RouterLink>

          <!-- 卡片底部：时间 + 操作 -->
          <div class="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-apple-border/40">
            <span class="text-[11px] text-apple-subtext">{{ fmtDateShort(o.createdAt) }}</span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <RouterLink
                :to="`/orders/${o.id}`"
                class="flex items-center justify-center w-7 h-7 rounded-full text-apple-subtext hover:bg-apple-blue/10 hover:text-apple-blue transition-colors"
                title="查看详情"
              >
                <Icon name="chevron-right" :size="15" />
              </RouterLink>
              <button
                @click="handleDelete(o.id)"
                class="flex items-center justify-center w-7 h-7 rounded-full text-apple-subtext hover:bg-apple-red/10 hover:text-apple-red transition-colors"
                title="删除"
              >
                <Icon name="trash" :size="14" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
