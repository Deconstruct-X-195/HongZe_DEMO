<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useOrderStore } from '@/stores/order'
import { fmtNum } from '@/lib/format'
import { STATUS_META, migrateStatus } from '@/types'
import type { Order } from '@/types'

const store = useOrderStore()
onMounted(() => store.refresh())

/* ---------- 全链路汇总 ---------- */
const totals = computed(() => {
  let planned = 0
  let shipped = 0
  let stored = 0
  let pickedUp = 0
  for (const o of store.orders) {
    const caps = store.capacitiesOf(o.id)
    const shippings = store.shippingsOf(o.id)
    planned += caps.reduce((s, c) => s + (c.plannedQty || 0), 0)
    shipped += shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
    stored += shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
    pickedUp += shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  }
  return { planned, shipped, stored, pickedUp, inTransit: Math.max(0, shipped - stored - pickedUp) }
})

/* ---------- 每单六维进度 ---------- */
interface OrderFlow {
  order: Order
  planned: number
  shipped: number
  inTransit: number
  stored: number
  pickedUp: number
  totalAmount: number
  receivedAmount: number
  /** 全链路进度 = 已提货 / 计划量 */
  progress: number
}

const flows = computed<OrderFlow[]>(() =>
  store.orders
    .map((o) => {
      const caps = store.capacitiesOf(o.id)
      const shippings = store.shippingsOf(o.id)
      const planned = caps.reduce((s, c) => s + (c.plannedQty || 0), 0)
      const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
      const stored = shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
      const pickedUp = shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
      const f = store.financialOf(o.id)
      return {
        order: o,
        planned,
        shipped,
        stored,
        pickedUp,
        inTransit: Math.max(0, shipped - stored - pickedUp),
        totalAmount: f.totalAmount,
        receivedAmount: f.receivedAmount,
        progress: planned > 0 ? Math.min(100, Math.round((pickedUp / planned) * 100)) : 0,
      }
    })
    .sort((a, b) => a.progress - b.progress || (a.order.updatedAt < b.order.updatedAt ? 1 : -1)),
)

/* ---------- 阶段筛选 ---------- */
const stageFilter = ref<'all' | 'unshipped' | 'in_transit' | 'stored' | 'done'>('all')
const stageOptions = [
  { key: 'all', label: '全部' },
  { key: 'unshipped', label: '待发运' },
  { key: 'in_transit', label: '在途' },
  { key: 'stored', label: '堆存中' },
  { key: 'done', label: '已提货' },
] as const

const filteredFlows = computed(() => {
  switch (stageFilter.value) {
    case 'unshipped':
      return flows.value.filter((f) => f.shipped === 0 && f.planned > 0)
    case 'in_transit':
      return flows.value.filter((f) => f.inTransit > 0)
    case 'stored':
      return flows.value.filter((f) => f.stored > 0)
    case 'done':
      return flows.value.filter((f) => f.pickedUp > 0 && f.stored === 0 && f.inTransit === 0)
    default:
      return flows.value
  }
})
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="供应链监控" subtitle="全链路订单健康度：计划 → 发运 → 在途 → 堆存 → 提货 → 回款六维透视。" />

    <!-- 全链路总量 -->
    <div class="card p-5">
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="text-center">
          <div class="text-[11px] text-apple-subtext">计划总量</div>
          <div class="text-lg font-bold text-apple-text mt-1 tabular-nums">{{ fmtNum(totals.planned) }} 吨</div>
        </div>
        <div class="text-center">
          <div class="text-[11px] text-apple-blue">已发运</div>
          <div class="text-lg font-bold text-apple-blue mt-1 tabular-nums">{{ fmtNum(totals.shipped) }} 吨</div>
        </div>
        <div class="text-center">
          <div class="text-[11px] text-apple-purple">在途运输</div>
          <div class="text-lg font-bold text-apple-purple mt-1 tabular-nums">{{ fmtNum(totals.inTransit) }} 吨</div>
        </div>
        <div class="text-center">
          <div class="text-[11px] text-apple-orange">仓储堆存</div>
          <div class="text-lg font-bold text-apple-orange mt-1 tabular-nums">{{ fmtNum(totals.stored) }} 吨</div>
        </div>
        <div class="text-center">
          <div class="text-[11px] text-apple-green">已提货出关</div>
          <div class="text-lg font-bold text-apple-green mt-1 tabular-nums">{{ fmtNum(totals.pickedUp) }} 吨</div>
        </div>
      </div>
    </div>

    <!-- 阶段筛选 -->
    <div class="flex items-center gap-2 flex-wrap">
      <button
        v-for="opt in stageOptions"
        :key="opt.key"
        @click="stageFilter = opt.key"
        class="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
        :class="stageFilter === opt.key ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-subtext border border-apple-border/50 hover:text-apple-text'"
      >
        {{ opt.label }}
        <span v-if="opt.key !== 'all'" class="ml-1 tabular-nums opacity-80">{{ opt.key === 'unshipped' ? filteredFlows.length : '' }}</span>
      </button>
    </div>

    <!-- 订单全链路列表 -->
    <div v-if="filteredFlows.length === 0" class="card">
      <EmptyState icon="layers" title="暂无匹配订单" desc="调整筛选条件，或等待新订单流转至此环节。" />
    </div>

    <div v-else class="space-y-3">
      <div v-for="f in filteredFlows" :key="f.order.id" class="card p-5">
        <!-- 订单头 -->
        <div class="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div class="flex items-center gap-2.5 flex-wrap">
            <RouterLink :to="`/orders/${f.order.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors">
              {{ f.order.id }}
            </RouterLink>
            <Badge :label="STATUS_META[migrateStatus(f.order.status) ?? 'draft'].label" :color="STATUS_META[migrateStatus(f.order.status) ?? 'draft'].color" :bg="STATUS_META[migrateStatus(f.order.status) ?? 'draft'].bg" />
            <span class="text-xs text-apple-subtext">{{ f.order.trader }} · {{ f.order.cargoName }} {{ fmtNum(f.order.cargoTotal) }} 吨</span>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <span class="text-apple-subtext">回款</span>
            <span class="font-semibold tabular-nums" :class="f.receivedAmount >= f.totalAmount && f.totalAmount > 0 ? 'text-apple-green' : 'text-apple-orange'">
              {{ fmtNum(f.receivedAmount) }} / {{ fmtNum(f.totalAmount) }} 元
            </span>
          </div>
        </div>

        <!-- 五维货物进度条 -->
        <div class="h-3 rounded-full overflow-hidden flex bg-apple-fill/60 mb-3">
          <div v-if="f.shipped - f.inTransit - f.stored - f.pickedUp > 0" class="h-full bg-apple-blue/30" :style="{ width: (f.planned > 0 ? Math.min(100, (f.shipped - f.inTransit - f.stored - f.pickedUp) / f.planned * 100) : 0) + '%' }" title="已发未计" />
          <div v-if="f.inTransit > 0" class="h-full bg-apple-purple" :style="{ width: (f.planned > 0 ? Math.min(100, f.inTransit / f.planned * 100) : 0) + '%' }" :title="`在途 ${fmtNum(f.inTransit)} 吨`" />
          <div v-if="f.stored > 0" class="h-full bg-apple-orange" :style="{ width: (f.planned > 0 ? Math.min(100, f.stored / f.planned * 100) : 0) + '%' }" :title="`堆存 ${fmtNum(f.stored)} 吨`" />
          <div v-if="f.pickedUp > 0" class="h-full bg-apple-green" :style="{ width: (f.planned > 0 ? Math.min(100, f.pickedUp / f.planned * 100) : 0) + '%' }" :title="`提货 ${fmtNum(f.pickedUp)} 吨`" />
        </div>

        <!-- 五维数据 -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
          <div>
            <div class="text-[11px] text-apple-subtext">计划</div>
            <div class="text-apple-text font-semibold mt-0.5 tabular-nums">{{ fmtNum(f.planned) }} 吨</div>
          </div>
          <div>
            <div class="text-[11px] text-apple-blue">已发运</div>
            <div class="text-apple-blue font-semibold mt-0.5 tabular-nums">{{ fmtNum(f.shipped) }} 吨</div>
          </div>
          <div>
            <div class="text-[11px] text-apple-purple">在途</div>
            <div class="text-apple-purple font-semibold mt-0.5 tabular-nums">{{ fmtNum(f.inTransit) }} 吨</div>
          </div>
          <div>
            <div class="text-[11px] text-apple-orange">堆存</div>
            <div class="text-apple-orange font-semibold mt-0.5 tabular-nums">{{ fmtNum(f.stored) }} 吨</div>
          </div>
          <div>
            <div class="text-[11px] text-apple-green">已提货</div>
            <div class="text-apple-green font-semibold mt-0.5 tabular-nums">{{ fmtNum(f.pickedUp) }} 吨</div>
          </div>
        </div>

        <!-- 全链路进度 -->
        <div class="flex items-center gap-3 mt-3 pt-3 border-t border-apple-border/40">
          <span class="text-[11px] text-apple-subtext shrink-0">全链路进度</span>
          <div class="flex-1 h-1.5 rounded-full bg-apple-fill-strong/50 overflow-hidden">
            <div class="h-full bg-apple-green transition-all duration-500" :style="{ width: f.progress + '%' }" />
          </div>
          <span class="text-[11px] font-semibold text-apple-text tabular-nums shrink-0">{{ f.progress }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>
