<template>
  <div class="space-y-3">
    <div v-if="capacities.length === 0" class="card p-5">
      <EmptyState icon="train" title="暂无运输通道" desc="请先在运力信息中录入运输通道。" />
    </div>

    <template v-else>
      <!-- 1. 订单发运总览 -->
      <div class="card p-5">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
            <Icon name="route" :size="16" class="text-apple-subtext" />
            发运总览
          </h3>
          <button @click="$emit('navigate', 'cargo')" class="text-[11px] text-apple-blue font-medium hover:underline flex items-center gap-1">
            查看货物动态 <Icon name="arrow-right" :size="11" />
          </button>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-3">
          <div class="text-center">
            <div class="text-[11px] text-apple-subtext">订单总量</div>
            <div class="text-lg font-bold text-apple-text mt-0.5">{{ fmtNum(cargoTotal) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
          </div>
          <div class="text-center">
            <div class="text-[11px] text-apple-blue">已发运</div>
            <div class="text-lg font-bold text-apple-blue mt-0.5">{{ fmtNum(shippingStats.shipped) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
          </div>
          <div class="text-center">
            <div class="text-[11px] text-apple-subtext">未发运</div>
            <div class="text-lg font-bold text-apple-subtext mt-0.5">{{ fmtNum(Math.max(0, shippingStats.planned - shippingStats.shipped)) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
          </div>
        </div>
        <div class="h-2.5 rounded-full bg-apple-fill-strong/60 overflow-hidden">
          <div class="h-full bg-apple-blue transition-all duration-500" :style="{ width: pct(shippingStats.shipped, shippingStats.planned) + '%' }"></div>
        </div>
        <div class="flex items-center gap-4 mt-2 text-[11px] text-apple-subtext">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue"></span>已发运 {{ pct(shippingStats.shipped, shippingStats.planned) }}%</span>
          <span class="ml-auto">通道 {{ shippingStats.total }}（发运中 {{ shippingStats.shippingChannels }} / 已完成 {{ shippingStats.completedChannels }}）</span>
        </div>
      </div>

      <!-- 2. 待办：运输岗可跳转工作台操作，其他岗位仅提示 -->
      <div v-if="canShip" class="card p-5 border-2 border-apple-blue/20 bg-gradient-to-br from-apple-blue/[0.03] to-transparent">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex items-start gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-blue/10 text-apple-blue shrink-0">
              <Icon name="send" :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                批次发货
                <span v-if="shippingStats.remaining > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">待发运 {{ fmtNum(shippingStats.remaining) }} 吨</span>
              </h3>
              <p class="text-xs text-apple-subtext mt-1 leading-relaxed">
                {{ canOperate ? '发货操作已迁移至运输工作台，按通道执行批次发货，自动同步货物动态与时间轴。' : '订单已进入发运环节，发货由运输岗在运输工作台执行。' }}
              </p>
            </div>
          </div>
          <RouterLink v-if="canOperate" to="/workspace/transport" class="btn-primary text-xs shrink-0">
            前往运输工作台
            <Icon name="arrow-right" :size="13" />
          </RouterLink>
        </div>
      </div>
      <div v-else-if="currentStatus === 'pending_confirm'" class="card p-4 border border-apple-orange/20 bg-apple-orange/[0.03]">
        <p class="text-xs text-apple-orange flex items-center gap-1.5">
          <Icon name="info" :size="14" />
          订单待财务确认收款后，方可进入发运环节
          <RouterLink v-if="canOperateFinance" to="/workspace/finance" class="underline font-medium ml-1">前往财务工作台</RouterLink>
        </p>
      </div>

      <!-- 3. 各通道发运状态 -->
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
          <Icon name="layers" :size="15" class="text-apple-subtext" />
          各通道发运状态
        </h3>
        <div class="space-y-2.5">
          <div v-for="t in channelCargoTracking" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-4 py-3" :style="{ borderLeft: `3px solid ${t.channelColor}` }">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
                <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <Badge :label="SHIPPING_META[t.shipping.state].label" :color="SHIPPING_META[t.shipping.state].color" :bg="SHIPPING_META[t.shipping.state].bg" />
              </div>
            </div>
            <div class="px-4 py-2.5 bg-apple-fill/30 border-t border-apple-border/30">
              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div class="text-[11px] text-apple-subtext">通道总量</div>
                  <div class="text-apple-text font-semibold mt-0.5">{{ fmtNum(t.planned) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
                <div>
                  <div class="text-[11px] text-apple-blue">已发运</div>
                  <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.shipped) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
                <div>
                  <div class="text-[11px] text-apple-subtext">未发运</div>
                  <div class="text-apple-subtext font-semibold mt-0.5">{{ fmtNum(t.unshipped) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-apple-fill-strong/60 overflow-hidden mt-2">
                <div class="h-full bg-apple-blue transition-all duration-500" :style="{ width: pct(t.shipped, t.planned) + '%' }"></div>
              </div>
              <div class="flex items-center gap-3 mt-2 text-[11px] text-apple-subtext">
                <span v-if="t.shipping.actualDate" class="flex items-center gap-1 text-apple-green"><Icon name="check-circle" :size="10" /> 实际发运 {{ fmtDate(t.shipping.actualDate) }}</span>
                <span v-else-if="t.shipping.planDate" class="flex items-center gap-1"><Icon name="clock" :size="10" /> 计划发运 {{ fmtDate(t.shipping.planDate) }}</span>
                <span v-if="t.shipping.vouchers.length > 0" class="flex items-center gap-1"><Icon name="paperclip" :size="10" /> {{ t.shipping.vouchers.length }} 个凭证</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. 最近发运记录 -->
      <div v-if="shippingLogs.length > 0" class="card p-5">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
          <Icon name="history" :size="15" class="text-apple-subtext" />
          最近发运记录
          <span class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">{{ shippingLogs.length }}</span>
          <button @click="$emit('navigate', 'log')" class="ml-auto text-[11px] text-apple-blue font-medium hover:underline">查看全部</button>
        </h3>
        <div class="space-y-2">
          <div v-for="log in shippingLogs.slice(0, 5)" :key="log.id" class="flex items-start gap-2.5 p-2.5 rounded-apple bg-apple-fill/40 border border-apple-border/30">
            <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" :style="{ backgroundColor: ROLE_META[log.role].color }"></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs text-apple-text font-medium">{{ log.action }}</span>
                <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[11px] font-medium"
                  :style="{ backgroundColor: ROLE_META[log.role].color + '1a', color: ROLE_META[log.role].color }">
                  {{ ROLE_META[log.role].label }}
                </span>
              </div>
              <p v-if="log.remark" class="text-[11px] text-apple-subtext mt-0.5">{{ log.remark }}</p>
              <div class="text-[11px] text-apple-subtext mt-0.5">{{ log.operator }} · {{ fmtDate(log.createdAt) }}</div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessPath } from '@/types/auth'
import { fmtDate, fmtNum } from '@/lib/format'
import { ROLE_META, SHIPPING_META } from '@/types'
import type { Capacity, ChannelShipping, OperationLog, OrderStatus } from '@/types'
import { buildChannelTracking, buildShippingStats, pct } from './shipping-helpers'

const props = defineProps<{
  shippings: ChannelShipping[]
  capacities: Capacity[]
  logs: OperationLog[]
  currentStatus: NonNullable<OrderStatus>
  cargoTotal: number
}>()

const auth = useAuthStore()

defineEmits<{ navigate: [tab: 'cargo' | 'log'] }>()

const shippingStats = computed(() => buildShippingStats(props.shippings))
const channelCargoTracking = computed(() => buildChannelTracking(props.capacities, props.shippings))

const shippingLogs = computed(() =>
  props.logs.filter(
    (log) => log.action.includes('发运') || log.action.includes('货物') || log.toStatus === 'shipping' || log.toStatus === 'shipped',
  ),
)

const canShip = computed(() => {
  const s = props.currentStatus
  return s === 'confirmed' || s === 'shipping'
})
/** 仅运营岗/管理员可进入运输工作台操作 */
const canOperate = computed(() => canAccessPath(auth.role, '/workspace/transport'))
/** 仅财务岗/管理员可进入财务工作台 */
const canOperateFinance = computed(() => canAccessPath(auth.role, '/workspace/finance'))
</script>
