<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Icon, { type IconName } from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { fmtNum } from '@/lib/format'
import { STATUS_META, migrateStatus } from '@/types'
import type { OrderStatus } from '@/types'

const store = useOrderStore()
const auth = useAuthStore()
onMounted(() => store.refresh())

/* ---------- 全局 KPI ---------- */
const kpi = computed(() => {
  const orders = store.orders
  const totalCargo = orders.reduce((s, o) => s + o.cargoTotal, 0)
  const financials = orders.map((o) => store.financialOf(o.id))
  const totalAmount = financials.reduce((s, f) => s + f.totalAmount, 0)
  const received = financials.reduce((s, f) => s + f.receivedAmount, 0)

  // 全链路货物分布
  let shipped = 0
  let stored = 0
  let pickedUp = 0
  for (const o of orders) {
    const shippings = store.shippingsOf(o.id)
    shipped += shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
    stored += shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
    pickedUp += shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  }
  const inTransit = Math.max(0, shipped - stored - pickedUp)
  return {
    orderCount: orders.length,
    totalCargo,
    totalAmount,
    received,
    unreceived: totalAmount - received,
    receivedRate: totalAmount > 0 ? Math.round((received / totalAmount) * 100) : 0,
    shipped,
    inTransit,
    stored,
    pickedUp,
    shippedRate: totalCargo > 0 ? Math.round((shipped / totalCargo) * 100) : 0,
  }
})

/* ---------- 订单状态分布 ---------- */
const STATUS_ORDER: NonNullable<OrderStatus>[] = [
  'draft', 'port', 'capacity', 'plan', 'pending_confirm', 'confirmed', 'shipping', 'shipped', 'completed',
]
const statusDist = computed(() =>
  STATUS_ORDER.map((s) => ({
    status: s,
    count: store.orders.filter((o) => migrateStatus(o.status) === s).length,
  })).filter((x) => x.count > 0),
)

/* ---------- 近期活跃订单（按更新时间倒序） ---------- */
const activeOrders = computed(() =>
  [...store.orders].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 6),
)

/* ---------- 待办提示（跨岗位汇总） ---------- */
const todos = computed(() => {
  const pendingPayment = store.orders.filter((o) => migrateStatus(o.status) === 'pending_confirm').length
  const pendingShip = store.orders.filter((o) => {
    const s = migrateStatus(o.status)
    return s === 'confirmed' || s === 'shipping'
  }).length
  const warehouseOrders = store.orders.filter((o) => {
    const shippings = store.shippingsOf(o.id)
    return shippings.some((x) => (x.shippedQty || 0) - (x.storedQty || 0) - (x.pickedUpQty || 0) > 0 || (x.storedQty || 0) > 0)
  }).length
  return [
    { label: '待财务确认收款', count: pendingPayment, to: '/workspace/finance', color: '#ff9500', icon: 'dollar' as IconName },
    { label: '待发运订单', count: pendingShip, to: '/workspace/transport', color: '#4176e6', icon: 'send' as IconName },
    { label: '仓储在办订单', count: warehouseOrders, to: '/workspace/warehouse', color: '#af52de', icon: 'package' as IconName },
  ].filter((t) => auth.canAccess(t.to))
})
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="经营驾驶舱" subtitle="全局经营指标总览：订单、发运、货物与资金全链路健康度。" />

    <!-- 跨岗位待办（仅当前角色可访问的工作台） -->
    <div v-if="todos.length > 0" class="card px-5 py-3 flex items-center gap-4 flex-wrap">
      <RouterLink v-for="t in todos" :key="t.label" :to="t.to"
        class="inline-flex items-center gap-2 px-3 py-1.5 rounded-apple border border-apple-border/60 hover:border-apple-blue/40 hover:bg-apple-hover/10 transition-all group">
        <Icon :name="t.icon" :size="14" :style="{ color: t.color }" />
        <span class="text-sm font-bold text-apple-text tabular-nums">{{ t.count }}</span>
        <span class="text-xs text-apple-subtext">{{ t.label }}</span>
        <Icon name="chevron-right" :size="13" class="text-apple-subtext group-hover:text-apple-blue transition-colors" />
      </RouterLink>
    </div>

    <!-- 核心经营指标（轻量单行摘要条） -->
    <div class="card px-5 py-3 flex items-center gap-5 flex-wrap">
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ kpi.orderCount }}</span>
        <span class="text-xs text-apple-subtext">单订单</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ fmtNum(kpi.totalCargo) }}</span>
        <span class="text-xs text-apple-subtext">吨货物</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ fmtNum(kpi.totalAmount) }}</span>
        <span class="text-xs text-apple-subtext">元总额</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-red tabular-nums">{{ fmtNum(kpi.unreceived) }}</span>
        <span class="text-xs text-apple-subtext">元未收</span>
      </div>
      <div class="ml-auto flex items-baseline gap-1.5">
        <span class="text-xs text-apple-subtext">回笼率</span>
        <span class="text-sm font-bold text-apple-green tabular-nums">{{ kpi.receivedRate }}%</span>
      </div>
    </div>

    <!-- 资金回笼 + 货物流转 -->
    <div class="grid lg:grid-cols-2 gap-3">
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-apple-text">资金回笼</h3>
          <span class="text-xs text-apple-green font-semibold tabular-nums">{{ kpi.receivedRate }}%</span>
        </div>
        <div class="h-3 rounded-full bg-apple-fill-strong/60 overflow-hidden">
          <div class="h-full bg-apple-green transition-all duration-500" :style="{ width: kpi.receivedRate + '%' }"></div>
        </div>
        <div class="flex items-center justify-between mt-3 text-xs">
          <span class="text-apple-green font-medium">已收 {{ fmtNum(kpi.received) }} 元</span>
          <span class="text-apple-red font-medium">未收 {{ fmtNum(kpi.unreceived) }} 元</span>
        </div>
      </div>

      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold text-apple-text">货物流转分布</h3>
          <span class="text-xs text-apple-blue font-semibold tabular-nums">发运 {{ kpi.shippedRate }}%</span>
        </div>
        <div class="space-y-2.5">
          <div class="flex items-center gap-3 text-xs">
            <span class="w-14 text-apple-subtext shrink-0">运输中</span>
            <div class="flex-1 h-2 rounded-full bg-apple-fill-strong/50 overflow-hidden">
              <div class="h-full bg-apple-blue" :style="{ width: (kpi.totalCargo > 0 ? Math.min(100, kpi.inTransit / kpi.totalCargo * 100) : 0) + '%' }"></div>
            </div>
            <span class="text-apple-text font-semibold tabular-nums w-20 text-right">{{ fmtNum(kpi.inTransit) }} 吨</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="w-14 text-apple-subtext shrink-0">仓储堆存</span>
            <div class="flex-1 h-2 rounded-full bg-apple-fill-strong/50 overflow-hidden">
              <div class="h-full bg-apple-orange" :style="{ width: (kpi.totalCargo > 0 ? Math.min(100, kpi.stored / kpi.totalCargo * 100) : 0) + '%' }"></div>
            </div>
            <span class="text-apple-text font-semibold tabular-nums w-20 text-right">{{ fmtNum(kpi.stored) }} 吨</span>
          </div>
          <div class="flex items-center gap-3 text-xs">
            <span class="w-14 text-apple-subtext shrink-0">已提货</span>
            <div class="flex-1 h-2 rounded-full bg-apple-fill-strong/50 overflow-hidden">
              <div class="h-full bg-apple-green" :style="{ width: (kpi.totalCargo > 0 ? Math.min(100, kpi.pickedUp / kpi.totalCargo * 100) : 0) + '%' }"></div>
            </div>
            <span class="text-apple-text font-semibold tabular-nums w-20 text-right">{{ fmtNum(kpi.pickedUp) }} 吨</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 订单状态分布 -->
    <div class="card p-5">
      <h3 class="text-sm font-semibold text-apple-text mb-4">订单状态分布</h3>
      <div class="flex items-center gap-2 flex-wrap">
        <div v-for="d in statusDist" :key="d.status"
          class="flex items-center gap-2 px-3 py-1.5 rounded-apple border"
          :style="{ borderColor: STATUS_META[d.status].color + '40', backgroundColor: STATUS_META[d.status].bg }">
          <span class="text-xs font-semibold tabular-nums" :style="{ color: STATUS_META[d.status].color }">{{ d.count }}</span>
          <span class="text-xs text-apple-subtext">{{ STATUS_META[d.status].label }}</span>
        </div>
        <div v-if="statusDist.length === 0" class="text-xs text-apple-subtext">暂无订单数据</div>
      </div>
    </div>

    <!-- 近期活跃订单 -->
    <div class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text">近期活跃订单</h2>
        <RouterLink v-if="store.orders.length > 6" to="/supply-chain" class="text-[11px] text-apple-blue font-medium hover:underline">
          查看全部
        </RouterLink>
      </div>
      <div class="divide-y divide-apple-border/40">
        <RouterLink v-for="o in activeOrders" :key="o.id" :to="`/orders/${o.id}`"
          class="flex items-center gap-4 px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-apple-text font-mono">{{ o.id }}</span>
              <Badge :label="STATUS_META[migrateStatus(o.status) ?? 'draft'].label" :color="STATUS_META[migrateStatus(o.status) ?? 'draft'].color" :bg="STATUS_META[migrateStatus(o.status) ?? 'draft'].bg" />
            </div>
            <p class="text-xs text-apple-subtext mt-1 truncate">{{ o.trader }} · {{ o.cargoName }} {{ fmtNum(o.cargoTotal) }} 吨</p>
          </div>
          <div class="text-right shrink-0">
            <div class="text-sm font-semibold text-apple-text tabular-nums">{{ fmtNum(store.financialOf(o.id).totalAmount) }} 元</div>
            <div class="text-[11px] text-apple-subtext mt-0.5">应收总额</div>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
