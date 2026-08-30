<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import TransportPlanReport from '@/components/TransportPlanReport.vue'
import BasicInfoTab from './BasicInfoTab.vue'
import FinanceTab from './FinanceTab.vue'
import ShippingTab from './ShippingTab.vue'
import WarehouseTab from './WarehouseTab.vue'
import CargoTab from './CargoTab.vue'
import LogTab from './LogTab.vue'
import CargoBatchesTab from './CargoBatchesTab.vue'
import { useOrderStore } from '@/stores/order'
import { useAuthStore } from '@/stores/auth'
import { fmtDate } from '@/lib/format'
import { exportTransportPlanPdf } from '@/lib/pdfExport'
import { STATUS_META, migrateStatus } from '@/types'
import type { OrderStatus, FinancialInfo, ChannelShipping } from '@/types'
import type { IconName } from '@/components/Icon.vue'
import type { Role } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const auth = useAuthStore()
const id = route.params.id as string

/** 订单管理操作（编辑/删除）仅限业务人员与系统管理员 */
const canManageOrder = computed(() => auth.role === 'sales' || auth.role === 'admin')

/* ---------- 标签页（按岗位过滤，各角色只看到自己环节相关的内容） ---------- */
type Tab = 'basic' | 'finance' | 'shipping' | 'warehouse' | 'cargo' | 'batches' | 'log'
const ALL_TABS: { key: Tab; label: string; icon: IconName; roles: Role[] }[] = [
  { key: 'basic', label: '基本信息', icon: 'clipboard-list', roles: ['customer', 'sales', 'finance', 'operations', 'supply', 'executive', 'admin'] },
  { key: 'finance', label: '财务状态', icon: 'dollar', roles: ['finance', 'executive', 'admin'] },
  { key: 'shipping', label: '发运状态', icon: 'send', roles: ['operations', 'supply', 'executive', 'admin'] },
  { key: 'warehouse', label: '仓储堆存', icon: 'package', roles: ['operations', 'supply', 'executive', 'admin'] },
  { key: 'cargo', label: '货物动态', icon: 'route', roles: ['operations', 'supply', 'executive', 'admin'] },
  { key: 'batches', label: '货物批次', icon: 'layers', roles: ['operations', 'supply', 'executive', 'admin'] },
  { key: 'log', label: '运输时间轴', icon: 'history', roles: ['customer', 'sales', 'finance', 'operations', 'supply', 'executive', 'admin'] },
]
/** 当前角色可见的标签 */
const tabs = computed(() => ALL_TABS.filter((t) => t.roles.includes(auth.role)))

/** 各岗位进入订单详情的落地标签：直奔自己的环节 */
const DEFAULT_TAB: Record<Role, Tab> = {
  customer: 'basic',
  sales: 'basic',
  finance: 'finance',
  operations: 'shipping',
  supply: 'basic',
  executive: 'basic',
  admin: 'basic',
}
const activeTab = ref<Tab>(DEFAULT_TAB[auth.role])
/** 落地标签若不可见（理论上不会发生），回退到第一个可见标签 */
if (!tabs.value.some((t) => t.key === activeTab.value)) {
  activeTab.value = tabs.value[0]?.key ?? 'basic'
}

/** 子面板跨标签导航（仅允许跳转到当前角色可见的标签） */
function navigate(tab: Tab) {
  if (tabs.value.some((t) => t.key === tab)) {
    activeTab.value = tab
  }
}

/* ---------- 数据加载 ---------- */
const order = computed(() => store.getById(id))
const port = computed(() => store.portOf(id))
const capacities = computed(() => store.capacitiesOf(id))
const plan = computed(() => store.planOf(id))

const currentStatus = computed<NonNullable<OrderStatus>>(() => migrateStatus(order.value?.status) ?? 'draft')

/* ---------- 状态流转步骤 ---------- */
const statusSteps: NonNullable<OrderStatus>[] = [
  'draft', 'port', 'capacity', 'plan',
  'pending_confirm', 'confirmed', 'shipping', 'shipped', 'completed',
]
const currentStepIdx = computed(() => {
  const s = currentStatus.value
  return s ? statusSteps.indexOf(s) : 0
})

/** 完整步骤条仅对流程监控类角色展示（运营/供应链/管理层/管理员）；业务/财务岗只看轻量状态行 */
const showFullStepper = computed(() =>
  auth.role === 'operations' || auth.role === 'supply' || auth.role === 'executive' || auth.role === 'admin',
)
/** 轻量状态行：当前状态 + 下一步去向（业务/财务岗视角） */
const nextStepLabel = computed(() => {
  const next = statusSteps[currentStepIdx.value + 1]
  return next ? STATUS_META[next].label : '已完结'
})

/* ---------- 业务数据（响应式，供各标签面板共享） ---------- */
const financial = reactive<FinancialInfo>(store.financialOf(id))
const shippings = reactive<ChannelShipping[]>(store.ensureShippings(id, capacities.value))
const logs = computed(() => store.logsOf(id))

/* ---------- 运输组织方案汇总（运力 + 方案整合） ---------- */
// 总运费 = 各通道 (计划运输量 × 单位运价) 之和
const totalFreight = computed(() =>
  capacities.value.reduce((s, c) => s + ((c.plannedQty || 0) * (c.price || 0)), 0),
)
// 总金额自动同步总运费（系统自动计算，用户不可编辑）
watch(totalFreight, (val) => {
  financial.totalAmount = val
}, { immediate: true })
// 运输时间 = 所有通道中最长时效（关键路径）
const maxLeadTime = computed(() => {
  const all = capacities.value.map((c) => c.leadTime || 0)
  return all.length > 0 ? Math.max(...all) : 0
})
// 总闲置运力
const totalIdle = computed(() =>
  capacities.value.reduce((s, c) => s + (c.idleCapacity || 0), 0),
)
// 已分配货物量
const allocatedQty = computed(() =>
  capacities.value.reduce((s, c) => s + (c.plannedQty || 0), 0),
)

function handleDelete() {
  if (!order.value) return
  if (confirm(`确认删除订单 ${order.value.id} 及其所有关联数据？`)) {
    store.removeOrder(order.value.id)
    router.push('/')
  }
}

/* ---------- PDF 下载 ---------- */
const exporting = ref(false)
const reportRef = ref<HTMLDivElement | null>(null)

async function downloadPdf() {
  if (!reportRef.value || !order.value) return
  exporting.value = true
  try {
    await exportTransportPlanPdf(reportRef.value, order.value.id)
  } catch (err) {
    console.error(err)
    alert('PDF 导出失败，请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div v-if="!order" class="card">
    <EmptyState icon="alert" title="订单不存在" desc="可能已被删除">
      <RouterLink to="/" class="btn-primary">返回首页</RouterLink>
    </EmptyState>
  </div>

  <div v-else class="space-y-4 animate-fade-in">
    <!-- 头部：订单号 + 状态 + 状态流转步骤 -->
    <div class="card p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-semibold tracking-tight text-apple-text font-mono">{{ order.id }}</h1>
            <Badge
              :label="STATUS_META[currentStatus].label"
              :color="STATUS_META[currentStatus].color"
              :bg="STATUS_META[currentStatus].bg"
            />
          </div>
          <p class="text-sm text-apple-subtext mt-1.5">
            创建于 {{ fmtDate(order.createdAt) }} · 最后更新 {{ fmtDate(order.updatedAt) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="downloadPdf" :disabled="exporting || capacities.length === 0" class="btn-secondary">
            <Icon name="download" :size="15" />
            {{ exporting ? '导出中…' : '下载PDF' }}
          </button>
          <button v-if="canManageOrder" @click="handleDelete" class="btn-danger">
            <Icon name="trash" :size="15" /> 删除
          </button>
        </div>
      </div>

      <!-- 状态流转步骤条（仅流程监控类角色：运营/供应链/管理层/管理员） -->
      <div v-if="showFullStepper" class="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        <template v-for="(s, idx) in statusSteps" :key="s">
          <div
            class="flex items-center gap-1 shrink-0"
          >
            <div
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300"
              :class="idx <= currentStepIdx
                ? 'text-white'
                : 'text-apple-subtext bg-apple-fill'"
              :style="idx <= currentStepIdx ? { backgroundColor: STATUS_META[s].color } : {}"
            >
              <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                :class="idx < currentStepIdx ? 'bg-apple-card/30' : 'bg-apple-card/20'">
                {{ idx + 1 }}
              </span>
              {{ STATUS_META[s].label }}
            </div>
            <Icon v-if="idx < statusSteps.length - 1" name="chevron-right" :size="12" class="text-apple-subtext shrink-0" />
          </div>
        </template>
      </div>

      <!-- 轻量状态行（业务/财务岗：只关心当前状态与下一步，不展示全貌流转） -->
      <div v-else class="mt-3 flex items-center gap-2 text-xs text-apple-subtext">
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          :style="{ backgroundColor: STATUS_META[currentStatus].bg, color: STATUS_META[currentStatus].color }">
          {{ STATUS_META[currentStatus].label }}
        </span>
        <Icon name="arrow-right" :size="12" />
        <span>下一步：{{ nextStepLabel }}</span>
        <button @click="activeTab = 'log'" class="text-apple-blue font-medium hover:underline ml-1">查看时间轴</button>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="flex items-center gap-1 p-1 rounded-apple bg-apple-card border border-apple-border/50 overflow-x-auto">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="activeTab = t.key"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[10px] transition-all duration-200 whitespace-nowrap"
        :class="activeTab === t.key ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-subtext hover:text-apple-text hover:bg-apple-hover/10'"
      >
        <Icon :name="t.icon" :size="14" />
        {{ t.label }}
        <span v-if="t.key === 'log' && logs.length > 0" class="text-[11px] px-1.5 py-0.5 rounded-full"
          :class="activeTab === t.key ? 'bg-apple-card/20' : 'bg-apple-blue/10 text-apple-blue'">
          {{ logs.length }}
        </span>
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      mode="out-in"
    >
      <!-- ============ 基本信息 ============ -->
      <BasicInfoTab
        v-if="activeTab === 'basic'"
        key="basic"
        :order="order"
        :port="port"
        :capacities="capacities"
        :plan="plan"
        :total-freight="totalFreight"
        :max-lead-time="maxLeadTime"
        :total-idle="totalIdle"
        :allocated-qty="allocatedQty"
      />

      <!-- ============ 财务状态（档案视图，操作在财务工作台） ============ -->
      <FinanceTab
        v-else-if="activeTab === 'finance'"
        key="finance"
        :financial="financial"
        :current-status="currentStatus"
      />

      <!-- ============ 发运状态（档案视图，操作在运输工作台） ============ -->
      <ShippingTab
        v-else-if="activeTab === 'shipping'"
        key="shipping"
        :shippings="shippings"
        :capacities="capacities"
        :logs="logs"
        :current-status="currentStatus"
        :cargo-total="order.cargoTotal"
        @navigate="navigate"
      />

      <!-- ============ 仓储堆存（档案视图，操作在仓储工作台） ============ -->
      <WarehouseTab
        v-else-if="activeTab === 'warehouse'"
        key="warehouse"
        :shippings="shippings"
        :capacities="capacities"
        @navigate="navigate"
      />

      <!-- ============ 货物动态 ============ -->
      <CargoTab
        v-else-if="activeTab === 'cargo'"
        key="cargo"
        :shippings="shippings"
        :capacities="capacities"
        :cargo-total="order.cargoTotal"
        @navigate="navigate"
      />

      <!-- ============ 货物批次（V3 批次模型） ============ -->
      <CargoBatchesTab
        v-else-if="activeTab === 'batches'"
        key="batches"
        :order-id="id"
        :order-cargo-total="order.cargoTotal"
      />

      <!-- ============ 运输时间轴（原操作日志，整合自动时间轴） ============ -->
      <LogTab
        v-else-if="activeTab === 'log'"
        key="log"
        :order="order"
        :port="port"
        :capacities="capacities"
        :plan="plan"
        :logs="logs"
        :total-freight="totalFreight"
        :max-lead-time="maxLeadTime"
        @navigate="navigate"
      />
    </Transition>

    <!-- PDF 报告容器（隐藏，仅用于导出） -->
    <div ref="reportRef" class="hidden">
      <TransportPlanReport
        :order="order"
        :port="port"
        :capacities="capacities"
        :total-freight="totalFreight"
        :max-lead-time="maxLeadTime"
        :total-idle="totalIdle"
      />
    </div>

    <div class="flex items-center justify-between gap-3 pt-2">
      <RouterLink :to="auth.defaultPath" class="btn-ghost"><Icon name="arrow-left" :size="15" /> 返回</RouterLink>
      <RouterLink v-if="canManageOrder" :to="`/orders/${order.id}/plan`" class="btn-primary"><Icon name="file-text" :size="15" /> 查看方案报告</RouterLink>
    </div>
  </div>
</template>
