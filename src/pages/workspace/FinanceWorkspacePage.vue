<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import TaskDrawer from './TaskDrawer.vue'
import PaymentConfirmPanel from './PaymentConfirmPanel.vue'
import { useOrderStore } from '@/stores/order'
import { fmtDateShort, fmtNum } from '@/lib/format'
import { PAYMENT_META, STATUS_META, migrateStatus } from '@/types'
import type { Order } from '@/types'

const store = useOrderStore()
onMounted(() => store.refresh())

/* ---------- 待办任务：待确认收款的订单 ---------- */
const tasks = computed<Order[]>(() =>
  store.orders
    .filter((o) => migrateStatus(o.status) === 'pending_confirm')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)),
)

/* ---------- 收款进度跟踪：已确认及后续状态的订单 ---------- */
const tracking = computed(() =>
  store.orders
    .filter((o) => {
      const s = migrateStatus(o.status)
      return s === 'confirmed' || s === 'shipping' || s === 'shipped' || s === 'completed'
    })
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
)

function financialOfOrder(o: Order) {
  return store.financialOf(o.id)
}

/* ---------- 抽屉 ---------- */
const drawerOpen = ref(false)
const drawerOrder = ref<Order | null>(null)
function openTask(o: Order) {
  drawerOrder.value = o
  drawerOpen.value = true
}
function onDone() {
  drawerOpen.value = false
  drawerOrder.value = null
}

const totalPendingAmount = computed(() =>
  tasks.value.reduce((s, o) => s + financialOfOrder(o).totalAmount, 0),
)
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="财务工作台" subtitle="汇总待确认收款的订单，逐单核实收款后解锁发运环节。" />

    <!-- 摘要条（轻量单行，不占版面） -->
    <div class="card px-5 py-3 flex items-center gap-5 flex-wrap">
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-orange tabular-nums">{{ tasks.length }}</span>
        <span class="text-xs text-apple-subtext">单待确认</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ fmtNum(totalPendingAmount) }}</span>
        <span class="text-xs text-apple-subtext">元待核实</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-blue tabular-nums">{{ tracking.length }}</span>
        <span class="text-xs text-apple-subtext">单跟踪中</span>
      </div>
    </div>

    <!-- 待办任务列表 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="alert" :size="14" class="text-apple-orange" />
          待确认收款
          <span v-if="tasks.length > 0" class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-medium">{{ tasks.length }}</span>
        </h2>
      </div>
      <div v-if="tasks.length === 0">
        <EmptyState icon="check-circle" title="暂无待确认收款" desc="订单在「待确认」状态时会出现在此处，等待财务确认收款。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in tasks" :key="o.id" class="flex items-center gap-4 px-5 py-4 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-orange/10 text-apple-orange shrink-0">
            <Icon name="dollar" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <RouterLink :to="`/orders/${o.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors">{{ o.id }}</RouterLink>
              <Badge :label="STATUS_META[migrateStatus(o.status) ?? 'draft'].label" :color="STATUS_META[migrateStatus(o.status) ?? 'draft'].color" :bg="STATUS_META[migrateStatus(o.status) ?? 'draft'].bg" />
            </div>
            <p class="text-xs text-apple-subtext mt-1 truncate">{{ o.trader }} · {{ o.cargoName }} {{ fmtNum(o.cargoTotal) }} 吨 · {{ fmtDateShort(o.createdAt) }}</p>
          </div>
          <div class="text-right shrink-0 hidden sm:block">
            <div class="text-[11px] text-apple-subtext">应收金额</div>
            <div class="text-sm font-bold text-apple-text tabular-nums mt-0.5">{{ fmtNum(financialOfOrder(o).totalAmount) }} 元</div>
          </div>
          <button @click="openTask(o)" class="btn-primary text-xs shrink-0">
            <Icon name="check-circle" :size="14" />
            确认收款
          </button>
        </div>
      </div>
    </section>

    <!-- 收款进度跟踪 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="route" :size="14" class="text-apple-blue" />
          收款进度跟踪
        </h2>
      </div>
      <div v-if="tracking.length === 0">
        <EmptyState icon="route" title="暂无跟踪中的订单" desc="财务确认收款后的订单会在此跟踪收款进度。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in tracking" :key="o.id" class="flex items-center gap-4 px-5 py-4 hover:bg-apple-hover/10 transition-colors">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <RouterLink :to="`/orders/${o.id}`" class="text-sm font-medium text-apple-text font-mono hover:text-apple-blue transition-colors">{{ o.id }}</RouterLink>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                :style="{ backgroundColor: PAYMENT_META[financialOfOrder(o).paymentStatus].color + '1a', color: PAYMENT_META[financialOfOrder(o).paymentStatus].color }">
                {{ PAYMENT_META[financialOfOrder(o).paymentStatus].label }}
              </span>
            </div>
            <div class="flex items-center gap-3 mt-2 min-w-0">
              <div class="h-1.5 rounded-full bg-apple-fill-strong/60 overflow-hidden flex-1 max-w-[240px]">
                <div class="h-full bg-apple-green transition-all duration-500"
                  :style="{ width: (financialOfOrder(o).totalAmount > 0 ? Math.min(100, Math.round(financialOfOrder(o).receivedAmount / financialOfOrder(o).totalAmount * 100)) : 0) + '%' }" />
              </div>
              <span class="text-[11px] text-apple-subtext tabular-nums shrink-0">{{ fmtNum(financialOfOrder(o).receivedAmount) }} / {{ fmtNum(financialOfOrder(o).totalAmount) }} 元</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 收款确认抽屉 -->
    <TaskDrawer
      :open="drawerOpen"
      :title="`确认收款 · ${drawerOrder?.id ?? ''}`"
      :subtitle="drawerOrder ? `${drawerOrder.trader} · ${drawerOrder.cargoName} ${fmtNum(drawerOrder.cargoTotal)} 吨` : ''"
      icon="dollar"
      icon-wrap-class="bg-apple-orange/10 text-apple-orange"
      @close="drawerOpen = false"
    >
      <PaymentConfirmPanel v-if="drawerOrder" :key="drawerOrder.id" :order-id="drawerOrder.id" @done="onDone" />
    </TaskDrawer>
  </div>
</template>
