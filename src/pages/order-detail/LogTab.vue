<template>
  <div class="space-y-3">
    <!-- 跨标签页导航提示 -->
    <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1">
      <Icon name="info" :size="12" />
      <span>货物运输全程时间记录 · 发运数据编辑请前往</span>
      <button @click="$emit('navigate', 'shipping')" class="text-apple-blue font-medium hover:underline">「发运状态」</button>
    </div>

    <!-- 1. 运输环节时间轴（主要视图，自动生成） -->
    <div class="card p-5">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="map-pin" :size="15" class="text-apple-subtext" />
          货物运输时间轴
          <span class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-green/10 text-apple-green font-medium">自动记录</span>
        </h3>
        <span class="text-[11px] text-apple-subtext">{{ autoTimeline.length }} 个关键节点 · 按时间排序</span>
      </div>

      <div v-if="autoTimeline.length === 0" class="py-6 text-center">
        <EmptyState icon="route" title="暂无时间轴记录" desc="随着订单流程推进，关键节点将自动记录到此处。" />
      </div>

      <!-- 自动时间轴 -->
      <div v-else class="relative pl-6">
        <div class="absolute left-2 top-2 bottom-2 w-px bg-apple-border/60"></div>
        <div v-for="node in autoTimeline" :key="node.id" class="relative pb-4 last:pb-0">
          <div class="absolute -left-[18px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
            :style="{ backgroundColor: node.color }">
          </div>
          <div class="rounded-apple-lg border border-apple-border/40 p-3 bg-apple-card/40">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <div class="flex items-center gap-2">
                <div class="flex items-center justify-center w-6 h-6 rounded-md shrink-0" :style="{ backgroundColor: node.color + '1a', color: node.color }">
                  <Icon :name="node.icon" :size="13" />
                </div>
                <span class="text-sm text-apple-text font-medium">{{ node.stage }}</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                  :style="{ backgroundColor: ROLE_META[node.role].color + '1a', color: ROLE_META[node.role].color }">
                  {{ ROLE_META[node.role].label }}
                </span>
              </div>
              <span class="text-[11px] text-apple-subtext flex items-center gap-1">
                <Icon name="clock" :size="11" />{{ fmtDate(node.time) }}
              </span>
            </div>
            <p v-if="node.remark" class="text-xs text-apple-subtext mt-1.5 leading-relaxed">{{ node.remark }}</p>
            <div class="text-[11px] text-apple-subtext mt-1 flex items-center gap-1">
              <Icon name="user" :size="10" />{{ node.operator }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. 完整操作日志（详细记录，可折叠） -->
    <div class="card p-5">
      <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="history" :size="15" class="text-apple-subtext" />
          完整操作日志
          <span class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-fill text-apple-subtext font-medium">{{ logs.length }} 条</span>
        </h3>
      </div>
      <div v-if="logs.length === 0" class="py-6 text-center">
        <EmptyState icon="history" title="暂无操作记录" desc="订单状态变更、信息更新等操作将记录于此。" />
      </div>
      <div v-else class="relative pl-6">
        <div class="absolute left-2 top-2 bottom-2 w-px bg-apple-border/60"></div>
        <div v-for="log in logs" :key="log.id" class="relative pb-4 last:pb-0">
          <div class="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
            :style="{ backgroundColor: ROLE_META[log.role].color }"></div>
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm text-apple-text font-medium">{{ log.action }}</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                  :style="{ backgroundColor: ROLE_META[log.role].color + '1a', color: ROLE_META[log.role].color }">
                  {{ ROLE_META[log.role].label }}
                </span>
              </div>
              <p v-if="log.remark" class="text-xs text-apple-subtext mt-1">{{ log.remark }}</p>
              <div class="flex items-center gap-2 mt-1.5 text-[11px] text-apple-subtext">
                <Icon name="user" :size="11" />
                <span>{{ log.operator }}</span>
                <span>·</span>
                <Icon name="clock" :size="11" />
                <span>{{ fmtDate(log.createdAt) }}</span>
              </div>
            </div>
            <!-- 状态变更标签 -->
            <div v-if="log.fromStatus || log.toStatus" class="flex items-center gap-1.5 shrink-0">
              <span v-if="log.fromStatus" class="text-[11px] px-2 py-0.5 rounded-full" :style="{ backgroundColor: STATUS_META[log.fromStatus].bg, color: STATUS_META[log.fromStatus].color }">{{ STATUS_META[log.fromStatus].label }}</span>
              <Icon name="arrow-right" :size="12" class="text-apple-subtext" />
              <span v-if="log.toStatus" class="text-[11px] px-2 py-0.5 rounded-full" :style="{ backgroundColor: STATUS_META[log.toStatus].bg, color: STATUS_META[log.toStatus].color }">{{ STATUS_META[log.toStatus].label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import { ROLE_META, STATUS_META } from '@/types'
import type { Capacity, OperationLog, Order, PortInfo, TransportPlan } from '@/types'
import { congLabel } from './shipping-helpers'

const props = defineProps<{
  order: Order
  port?: PortInfo
  capacities: Capacity[]
  plan?: TransportPlan
  logs: OperationLog[]
  totalFreight: number
  maxLeadTime: number
}>()

defineEmits<{ navigate: [tab: 'shipping'] }>()

/* ---------- 货物动态：自动时间轴（从操作日志生成，无需手动录入） ---------- */
interface TimelineNode {
  id: string
  stage: string
  time: string
  role: OperationLog['role']
  operator: string
  state: 'completed' | 'in_progress' | 'exception' | 'pending'
  remark?: string
  icon: any
  color: string
}

const autoTimeline = computed<TimelineNode[]>(() => {
  const nodes: TimelineNode[] = []
  // 1. 订单创建
  if (props.order?.createdAt) {
    nodes.push({
      id: 'order-created', stage: '订单创建', time: props.order.createdAt,
      role: 'sales', operator: '系统', state: 'completed',
      remark: `订单编号 ${props.order.id} · 货物 ${props.order.cargoName} ${fmtNum(props.order.cargoTotal)} 吨`,
      icon: 'clipboard-list', color: '#8e8e93',
    })
  }
  // 2. 港口信息录入
  if (props.port?.updatedAt) {
    nodes.push({
      id: 'port-saved', stage: '港口信息录入', time: props.port.updatedAt,
      role: 'port', operator: '港口专员', state: 'completed',
      remark: `${props.port.portName} · ${congLabel(props.port.congestion)} · 等待 ${props.port.waitHours}h`,
      icon: 'anchor', color: '#ff9500',
    })
  }
  // 3. 运力方案录入
  if (props.capacities.length > 0) {
    const latestCap = props.capacities.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
    nodes.push({
      id: 'capacity-saved', stage: '运输组织方案录入', time: latestCap.updatedAt,
      role: 'capacity', operator: '运力专员', state: 'completed',
      remark: `${props.capacities.length} 条运输通道 · 总运费 ${fmtMoney(props.totalFreight)} · 运输时间 ${props.maxLeadTime} 天`,
      icon: 'route', color: '#af52de',
    })
  }
  // 4. 从操作日志提取关键事件
  props.logs.forEach((log) => {
    let stage = ''
    let icon = 'circle'
    let color = '#8e8e93'
    let state: TimelineNode['state'] = 'completed'

    if (log.toStatus === 'pending_confirm') {
      stage = '运输方案完成'; icon = 'check-circle'; color = '#af52de'
    } else if (log.toStatus === 'confirmed') {
      stage = '财务确认收款'; icon = 'dollar'; color = '#34c759'
    } else if (log.toStatus === 'shipping') {
      stage = '开始发运'; icon = 'send'; color = '#4176e6'
    } else if (log.toStatus === 'shipped') {
      stage = '全部发运完成'; icon = 'check-circle'; color = '#34c759'
    } else if (log.toStatus === 'completed') {
      stage = '订单已完成'; icon = 'check-circle'; color = '#34c759'
    } else if (log.action.includes('发运')) {
      stage = '更新发运信息'; icon = 'send'; color = '#4176e6'
    } else if (log.action.includes('财务')) {
      stage = log.action; icon = 'dollar'; color = '#34c759'
    } else {
      return // 跳过非关键日志
    }

    nodes.push({
      id: log.id, stage, time: log.createdAt,
      role: log.role, operator: log.operator, state,
      remark: log.remark,
      icon, color,
    })
  })
  // 按时间排序
  return nodes.sort((a, b) => a.time.localeCompare(b.time))
})
</script>
