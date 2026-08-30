<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import TaskDrawer from './TaskDrawer.vue'
import WarehouseOpPanel from './WarehouseOpPanel.vue'
import { useOrderStore } from '@/stores/order'
import { fmtNum } from '@/lib/format'
import { migrateStatus } from '@/types'
import type { Order } from '@/types'

const store = useOrderStore()
onMounted(() => store.refresh())

/** 订单仓储汇总（只读）：在途 = 已发运 − 堆存 − 提货 */
function warehouseSummaryOf(o: Order) {
  const shippings = store.shippingsOf(o.id)
  const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
  const stored = shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
  const pickedUp = shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  const inTransit = Math.max(0, shipped - stored - pickedUp)
  return { shipped, stored, pickedUp, inTransit }
}

/* ---------- 待办任务：存在在途或堆存货物的订单 ---------- */
const tasks = computed<Order[]>(() =>
  store.orders
    .filter((o) => {
      const s = migrateStatus(o.status)
      if (!s || s === 'draft' || s === 'port' || s === 'capacity' || s === 'plan' || s === 'pending_confirm') return false
      const w = warehouseSummaryOf(o)
      return w.inTransit > 0 || w.stored > 0
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
)

const stats = computed(() => {
  const inTransit = tasks.value.reduce((s, o) => s + warehouseSummaryOf(o).inTransit, 0)
  const stored = tasks.value.reduce((s, o) => s + warehouseSummaryOf(o).stored, 0)
  return { total: tasks.value.length, inTransit, stored }
})

/* ---------- 抽屉 ---------- */
const drawerOpen = ref(false)
const drawerOrder = ref<Order | null>(null)
function openTask(o: Order) {
  drawerOrder.value = o
  drawerOpen.value = true
}
function onDone() {
  drawerOpen.value = false
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="仓储工作台" subtitle="跟踪在途货物与堆存状态，办理到货入库与提货出关。" />

    <!-- 摘要条（轻量单行，不占版面） -->
    <div class="card px-5 py-3 flex items-center gap-5 flex-wrap">
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ stats.total }}</span>
        <span class="text-xs text-apple-subtext">单在办</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-blue tabular-nums">{{ fmtNum(stats.inTransit) }}</span>
        <span class="text-xs text-apple-subtext">吨在途</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-orange tabular-nums">{{ fmtNum(stats.stored) }}</span>
        <span class="text-xs text-apple-subtext">吨堆存</span>
      </div>
    </div>

    <!-- 任务列表 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="package" :size="14" class="text-apple-orange" />
          仓储操作任务
          <span v-if="tasks.length > 0" class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-medium">{{ tasks.length }}</span>
        </h2>
      </div>
      <div v-if="tasks.length === 0">
        <EmptyState icon="check-circle" title="暂无仓储任务" desc="订单执行发货后，在途与堆存货物会出现在此处。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in tasks" :key="o.id" class="flex items-center gap-4 px-5 py-4 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-orange/10 text-apple-orange shrink-0">
            <Icon name="package" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <RouterLink :to="`/orders/${o.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors">{{ o.id }}</RouterLink>
            </div>
            <p class="text-xs text-apple-subtext mt-1 truncate">{{ o.trader }} · {{ o.cargoName }} {{ fmtNum(o.cargoTotal) }} 吨</p>
            <!-- 在途/堆存/提货 三段进度 -->
            <div class="flex items-center gap-2 mt-2 min-w-0 flex-wrap">
              <span v-if="warehouseSummaryOf(o).inTransit > 0" class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">
                待到货 {{ fmtNum(warehouseSummaryOf(o).inTransit) }} 吨
              </span>
              <span v-if="warehouseSummaryOf(o).stored > 0" class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-medium">
                待提货 {{ fmtNum(warehouseSummaryOf(o).stored) }} 吨
              </span>
              <span class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-apple-green/10 text-apple-green font-medium">
                已提货 {{ fmtNum(warehouseSummaryOf(o).pickedUp) }} 吨
              </span>
            </div>
          </div>
          <button @click="openTask(o)" class="btn-primary text-xs shrink-0 bg-apple-orange hover:bg-apple-orange/90">
            <Icon name="package" :size="14" />
            仓储操作
          </button>
        </div>
      </div>
    </section>

    <!-- 仓储操作抽屉 -->
    <TaskDrawer
      :open="drawerOpen"
      :title="`仓储操作 · ${drawerOrder?.id ?? ''}`"
      :subtitle="drawerOrder ? `${drawerOrder.trader} · ${drawerOrder.cargoName} ${fmtNum(drawerOrder.cargoTotal)} 吨` : ''"
      icon="package"
      icon-wrap-class="bg-apple-orange/10 text-apple-orange"
      @close="drawerOpen = false"
    >
      <WarehouseOpPanel v-if="drawerOrder" :key="drawerOrder.id" :order-id="drawerOrder.id" @done="onDone" />
    </TaskDrawer>
  </div>
</template>
