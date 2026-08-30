<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { fmtNum } from '@/lib/format'
import { migrateStatus, STATUS_META } from '@/types'
import type { Order } from '@/types'

const store = useOrderStore()
const auth = useAuthStore()
onMounted(() => store.refresh())

/** 客户角色只看自己的货物 */
const visibleOrders = computed<Order[]>(() => {
  if (auth.role === 'customer') {
    const name = auth.user?.name ?? ''
    return store.orders.filter((o) => o.trader === name || o.customers.some((c) => c.name === name))
  }
  return store.orders
})

/** 单订单货物流转五级数量 */
function flowOf(o: Order) {
  const shippings = store.shippingsOf(o.id)
  const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
  const stored = shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
  const pickedUp = shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  const planned = o.cargoTotal || shippings.reduce((s, x) => s + (x.plannedQty || 0), 0)
  const inTransit = Math.max(0, shipped - stored - pickedUp)
  return { planned, shipped, stored, pickedUp, inTransit }
}

/** 全局汇总（视觉中心） */
const total = computed(() =>
  visibleOrders.value.reduce(
    (acc, o) => {
      const f = flowOf(o)
      acc.planned += f.planned
      acc.shipped += f.shipped
      acc.inTransit += f.inTransit
      acc.stored += f.stored
      acc.pickedUp += f.pickedUp
      return acc
    },
    { planned: 0, shipped: 0, inTransit: 0, stored: 0, pickedUp: 0 },
  ),
)

const executing = computed(() =>
  visibleOrders.value.filter((o) => {
    const s = migrateStatus(o.status)
    return s === 'shipping' || s === 'shipped'
  }),
)

/** 流转阶段列（含全局与单订单复用） */
const STAGES = [
  { key: 'planned', label: '计划量', cls: 'bg-apple-blue' },
  { key: 'shipped', label: '已发运', cls: 'bg-[#5856d6]' },
  { key: 'inTransit', label: '在途', cls: 'bg-apple-blue/60' },
  { key: 'stored', label: '堆存中', cls: 'bg-[#ff9500]' },
  { key: 'pickedUp', label: '已提货', cls: 'bg-[#34c759]' },
] as const

/** 堆叠进度条分段 */
const segs = computed(() => {
  const t = total.value
  const base = Math.max(t.planned, 1)
  return STAGES.filter((s) => s.key !== 'planned').map((s) => ({
    ...s,
    qty: t[s.key],
    pct: (t[s.key] / base) * 100,
  }))
})
const pickedPct = computed(() => Math.min(100, (total.value.pickedUp / Math.max(total.value.planned, 1)) * 100))

function statusOf(o: Order): { label: string; color: string; bg: string } {
  const s = migrateStatus(o.status)
  if (s && STATUS_META[s]) return STATUS_META[s]
  return { label: '未知', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' }
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="物流全景" subtitle="全局货物五级数量流转动态：计划 → 发运 → 在途 → 堆存 → 提货。" />

    <!-- 全局流转总览：核心信息置中 -->
    <section class="card p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="route" :size="15" class="text-apple-blue" />
          货物流转全貌
        </h2>
        <span class="text-xs text-apple-subtext">共 {{ visibleOrders.length }} 单 · 执行中 {{ executing.length }} 单</span>
      </div>

      <!-- 五级数量横向漏斗（视觉中心） -->
      <div class="space-y-2.5">
        <div v-for="s in STAGES" :key="s.key" class="flex items-center gap-3">
          <span class="w-16 shrink-0 text-xs text-apple-subtext">{{ s.label }}</span>
          <div class="h-5 flex-1 rounded-md bg-apple-fill/60 overflow-hidden">
            <div
              class="h-full rounded-md transition-all duration-500"
              :class="s.cls"
              :style="{ width: Math.max(2, (total[s.key] / Math.max(total.planned, 1)) * 100) + '%' }"
            />
          </div>
          <span class="w-28 shrink-0 text-right text-sm font-semibold text-apple-text tabular-nums">
            {{ fmtNum(total[s.key]) }} <span class="text-xs font-normal text-apple-subtext">吨</span>
          </span>
          <span class="w-16 shrink-0 text-right text-xs text-apple-subtext tabular-nums">
            {{ ((total[s.key] / Math.max(total.planned, 1)) * 100).toFixed(1) }}%
          </span>
        </div>
      </div>

      <!-- 堆叠进度 + 关键节奏 -->
      <div class="mt-4 pt-4 border-t border-apple-border/60 flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-[220px]">
          <div class="h-3 rounded-full bg-apple-fill/80 overflow-hidden flex">
            <div
              v-for="sg in segs"
              :key="sg.key"
              class="h-full transition-all duration-500"
              :class="sg.cls"
              :style="{ width: sg.pct + '%' }"
              :title="`${sg.label} ${fmtNum(sg.qty)} 吨`"
            />
          </div>
          <p class="text-[11px] text-apple-subtext mt-1.5">
            整体提货进度 {{ pickedPct.toFixed(1) }}% · 在途 {{ fmtNum(total.inTransit) }} 吨 · 堆存 {{ fmtNum(total.stored) }} 吨
          </p>
        </div>
        <div class="flex items-center gap-3 text-xs">
          <span v-for="sg in segs" :key="sg.key" class="inline-flex items-center gap-1.5 text-apple-subtext">
            <i class="w-2 h-2 rounded-full" :class="sg.cls" />
            {{ sg.label }} <b class="text-apple-text font-medium tabular-nums">{{ fmtNum(sg.qty) }}</b>
          </span>
        </div>
      </div>
    </section>

    <!-- 订单流转动态列表 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="package" :size="14" class="text-apple-blue" />
          订单流转明细
        </h2>
      </div>
      <div v-if="visibleOrders.length === 0">
        <EmptyState icon="route" title="暂无货物数据" desc="订单确认并发运后，货物动态全貌将在此展示。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in visibleOrders" :key="o.id" class="px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center gap-3 flex-wrap">
            <RouterLink :to="`/orders/${o.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors">{{ o.id }}</RouterLink>
            <span
              class="text-[11px] px-2 py-0.5 rounded-full font-medium"
              :style="{ color: statusOf(o).color, backgroundColor: statusOf(o).bg }"
            >{{ statusOf(o).label }}</span>
            <span class="text-xs text-apple-subtext truncate">{{ o.trader }} · {{ o.cargoName }}</span>
            <span class="ml-auto text-xs text-apple-subtext tabular-nums">
              提货 <b class="text-apple-text">{{ ((flowOf(o).pickedUp / Math.max(flowOf(o).planned, 1)) * 100).toFixed(1) }}%</b>
            </span>
          </div>
          <!-- 单订单四段流转条 -->
          <div class="flex items-center gap-2 mt-2">
            <div class="flex-1 h-2.5 rounded-full bg-apple-fill/70 overflow-hidden flex">
              <div class="h-full bg-apple-blue/60" :style="{ width: (flowOf(o).inTransit / Math.max(flowOf(o).planned, 1)) * 100 + '%' }" title="在途" />
              <div class="h-full bg-[#ff9500]" :style="{ width: (flowOf(o).stored / Math.max(flowOf(o).planned, 1)) * 100 + '%' }" title="堆存中" />
              <div class="h-full bg-[#34c759]" :style="{ width: (flowOf(o).pickedUp / Math.max(flowOf(o).planned, 1)) * 100 + '%' }" title="已提货" />
            </div>
            <span class="text-[11px] text-apple-subtext tabular-nums shrink-0">
              {{ fmtNum(flowOf(o).planned) }} 吨
            </span>
          </div>
          <div class="flex items-center gap-3 mt-1.5 text-[11px] tabular-nums">
            <span class="text-apple-subtext">发运 <b class="text-[#5856d6] font-medium">{{ fmtNum(flowOf(o).shipped) }}</b></span>
            <span class="text-apple-subtext">在途 <b class="text-apple-blue font-medium">{{ fmtNum(flowOf(o).inTransit) }}</b></span>
            <span class="text-apple-subtext">堆存 <b class="text-apple-orange font-medium">{{ fmtNum(flowOf(o).stored) }}</b></span>
            <span class="text-apple-subtext">提货 <b class="text-apple-green font-medium">{{ fmtNum(flowOf(o).pickedUp) }}</b></span>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
