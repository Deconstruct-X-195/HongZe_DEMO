<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import EmptyState from '@/components/EmptyState.vue'
import TaskDrawer from './TaskDrawer.vue'
import BatchShipPanel from './BatchShipPanel.vue'
import { useOrderStore } from '@/stores/order'
import { fmtNum } from '@/lib/format'
import { migrateStatus } from '@/types'
import type { Order } from '@/types'

const store = useOrderStore()
onMounted(() => store.refresh())

/** 订单发运汇总（只读，不初始化数据） */
function shippingSummaryOf(o: Order) {
  const caps = store.capacitiesOf(o.id)
  const shippings = store.shippingsOf(o.id)
  const planned = caps.reduce((s, c) => s + (c.plannedQty || 0), 0)
  const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
  return { planned, shipped, remaining: Math.max(0, planned - shipped), channels: caps.length }
}

/* ---------- 待办任务：已确认/发运中的订单 ---------- */
const tasks = computed<Order[]>(() =>
  store.orders
    .filter((o) => {
      const s = migrateStatus(o.status)
      return s === 'confirmed' || s === 'shipping'
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
)

const stats = computed(() => {
  const totalRemaining = tasks.value.reduce((s, o) => s + shippingSummaryOf(o).remaining, 0)
  return { total: tasks.value.length, totalRemaining }
})

/* ---------- 抽屉 ---------- */
const drawerOpen = ref(false)
const drawerOrder = ref<Order | null>(null)
function openTask(o: Order) {
  drawerOrder.value = o
  drawerOpen.value = true
}
function onDone() {
  // 关闭抽屉但不清空订单引用，避免闪烁；列表由 store 响应式刷新
  drawerOpen.value = false
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="运输工作台" subtitle="汇总待发运与发运中的订单，按通道执行批次发货。" />

    <!-- 摘要条（轻量单行，不占版面） -->
    <div class="card px-5 py-3 flex items-center gap-5">
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-blue tabular-nums">{{ stats.total }}</span>
        <span class="text-xs text-apple-subtext">单待发运</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ fmtNum(stats.totalRemaining) }}</span>
        <span class="text-xs text-apple-subtext">吨剩余</span>
      </div>
    </div>

    <!-- 任务列表 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="send" :size="14" class="text-apple-blue" />
          批次发货任务
          <span v-if="tasks.length > 0" class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">{{ tasks.length }}</span>
        </h2>
      </div>
      <div v-if="tasks.length === 0">
        <EmptyState icon="check-circle" title="暂无待发运任务" desc="财务确认收款后的订单会流转到此处，等待安排发运。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in tasks" :key="o.id" class="flex items-center gap-4 px-5 py-4 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-blue/10 text-apple-blue shrink-0">
            <Icon name="train" :size="16" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 min-w-0">
              <RouterLink :to="`/orders/${o.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors truncate">{{ o.id }}</RouterLink>
              <span class="text-xs text-apple-subtext truncate">{{ o.trader }}</span>
            </div>
            <p class="text-[11px] text-apple-subtext mt-0.5 truncate">
              {{ o.cargoName }} {{ fmtNum(o.cargoTotal) }} 吨
              <span v-if="shippingSummaryOf(o).remaining > 0" class="text-apple-blue font-medium"> · 待发 {{ fmtNum(shippingSummaryOf(o).remaining) }} 吨</span>
            </p>
            <!-- 发运进度 -->
            <div class="h-1 rounded-full bg-apple-fill-strong/60 overflow-hidden mt-2 max-w-[280px]">
              <div class="h-full bg-apple-blue transition-all duration-500"
                :style="{ width: (shippingSummaryOf(o).planned > 0 ? Math.min(100, Math.round(shippingSummaryOf(o).shipped / shippingSummaryOf(o).planned * 100)) : 0) + '%' }" />
            </div>
          </div>
          <button @click="openTask(o)" class="btn-primary text-xs shrink-0">
            <Icon name="send" :size="14" />
            发货
          </button>
        </div>
      </div>
    </section>

    <!-- 批次发货（居中悬浮工作窗口） -->
    <TaskDrawer
      :open="drawerOpen"
      :title="`批次发货 · ${drawerOrder?.id ?? ''}`"
      :subtitle="drawerOrder ? `${drawerOrder.trader} · ${drawerOrder.cargoName} ${fmtNum(drawerOrder.cargoTotal)} 吨` : ''"
      icon="send"
      icon-wrap-class="bg-apple-blue/10 text-apple-blue"
      @close="drawerOpen = false"
    >
      <BatchShipPanel v-if="drawerOrder" :key="drawerOrder.id" :order-id="drawerOrder.id" @done="onDone" />
    </TaskDrawer>
  </div>
</template>
