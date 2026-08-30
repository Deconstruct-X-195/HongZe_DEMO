<template>
  <div class="space-y-3">
    <!-- 跨标签页导航提示 -->
    <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1 flex-wrap">
      <Icon name="info" :size="12" />
      <span>货物综合数据展示 · 发货操作</span>
      <button @click="$emit('navigate', 'shipping')" class="text-apple-blue font-medium hover:underline">「发运状态」</button>
      <span>· 仓储操作</span>
      <button @click="$emit('navigate', 'warehouse')" class="text-apple-blue font-medium hover:underline">「仓储堆存」</button>
      <span>· 财务确认</span>
      <button @click="$emit('navigate', 'finance')" class="text-apple-blue font-medium hover:underline">「财务状态」</button>
    </div>
    <!-- 1. 初始分配总量 + 货物状态分布概览 -->
    <div class="card overflow-hidden">
      <div class="px-5 py-4 bg-gradient-to-br from-apple-text/[0.03] to-transparent border-b border-apple-border/40">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-text/5 text-apple-text">
              <Icon name="package" :size="20" />
            </div>
            <div>
              <div class="text-[11px] text-apple-subtext uppercase tracking-wider">初始分配总量</div>
              <div class="text-2xl font-bold text-apple-text tracking-tight mt-0.5">
                {{ fmtNum(cargoDistribution.total) }}<span class="text-sm font-normal text-apple-subtext ml-1">吨</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-4 text-xs">
            <div class="text-center">
              <div class="text-apple-subtext">已发运</div>
              <div class="text-lg font-bold text-apple-blue mt-0.5">{{ cargoDistribution.shippedPct }}%</div>
            </div>
            <div class="w-px h-8 bg-apple-border/40"></div>
            <div class="text-center">
              <div class="text-apple-subtext">已提货出关</div>
              <div class="text-lg font-bold text-apple-green mt-0.5">{{ cargoDistribution.pickedUpPct }}%</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 堆叠进度条：未发运 → 运输中 → 仓储堆存 → 已提货出关 -->
      <div class="px-5 py-4">
        <div class="flex items-center justify-between text-[11px] text-apple-subtext mb-2">
          <span class="font-medium text-apple-text">货物状态分布</span>
          <span>基于初始分配总量 {{ fmtNum(cargoDistribution.total) }} 吨</span>
        </div>
        <div class="h-7 rounded-apple overflow-hidden flex bg-apple-fill/60">
          <div v-if="cargoDistribution.unshipped > 0" class="h-full flex items-center justify-center text-[11px] font-medium text-apple-subtext transition-all duration-500"
            :style="{ width: cargoDistribution.unshippedPct + '%', backgroundColor: '#e5e5ea' }"
            :title="`未发运 ${fmtNum(cargoDistribution.unshipped)} 吨`">
            <span v-if="cargoDistribution.unshippedPct >= 8">{{ cargoDistribution.unshippedPct }}%</span>
          </div>
          <div v-if="cargoDistribution.inTransit > 0" class="h-full flex items-center justify-center text-[11px] font-medium text-white transition-all duration-500"
            :style="{ width: cargoDistribution.inTransitPct + '%', backgroundColor: '#4176e6' }"
            :title="`运输中 ${fmtNum(cargoDistribution.inTransit)} 吨`">
            <span v-if="cargoDistribution.inTransitPct >= 8">{{ cargoDistribution.inTransitPct }}%</span>
          </div>
          <div v-if="cargoDistribution.stored > 0" class="h-full flex items-center justify-center text-[11px] font-medium text-white transition-all duration-500"
            :style="{ width: cargoDistribution.storedPct + '%', backgroundColor: '#ff9500' }"
            :title="`仓储堆存 ${fmtNum(cargoDistribution.stored)} 吨`">
            <span v-if="cargoDistribution.storedPct >= 8">{{ cargoDistribution.storedPct }}%</span>
          </div>
          <div v-if="cargoDistribution.pickedUp > 0" class="h-full flex items-center justify-center text-[11px] font-medium text-white transition-all duration-500"
            :style="{ width: cargoDistribution.pickedUpPct + '%', backgroundColor: '#34c759' }"
            :title="`已提货出关 ${fmtNum(cargoDistribution.pickedUp)} 吨`">
            <span v-if="cargoDistribution.pickedUpPct >= 8">{{ cargoDistribution.pickedUpPct }}%</span>
          </div>
        </div>
        <!-- 图例（含数量与占比，替代原四阶段大卡片） -->
        <div class="flex items-center gap-4 mt-2.5 text-[11px] flex-wrap">
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#e5e5ea"></span><span class="text-apple-subtext">未发运</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.unshipped) }} 吨 · {{ cargoDistribution.unshippedPct }}%</span></span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#4176e6"></span><span class="text-apple-subtext">运输中（在途未到站）</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.inTransit) }} 吨 · {{ cargoDistribution.inTransitPct }}%</span></span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#ff9500"></span><span class="text-apple-subtext">仓储堆存（已到站未提货）</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.stored) }} 吨 · {{ cargoDistribution.storedPct }}%</span></span>
          <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#34c759"></span><span class="text-apple-subtext">已提货出关</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.pickedUp) }} 吨 · {{ cargoDistribution.pickedUpPct }}%</span></span>
        </div>
      </div>
    </div>

    <!-- 3. 通道货物追踪（按通道维度展示货物流转） -->
    <div class="card p-5">
      <h3 class="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
        <Icon name="route" :size="15" class="text-apple-subtext" />
        通道货物追踪
      </h3>
      <div v-if="channelCargoTracking.length === 0" class="py-4">
        <EmptyState icon="train" title="暂无通道数据" desc="请先在运力信息中录入运输通道并填写发运信息。" />
      </div>
      <div v-else class="space-y-3">
        <div v-for="t in channelCargoTracking" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
          <!-- 通道头部 -->
          <div class="flex items-center justify-between gap-3 px-4 py-3 bg-apple-fill/40">
            <div class="flex items-center gap-2.5 flex-1 min-w-0">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
              <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <Badge :label="SHIPPING_META[t.shipping.state].label" :color="SHIPPING_META[t.shipping.state].color" :bg="SHIPPING_META[t.shipping.state].bg" />
              <span class="text-[11px] text-apple-subtext">进度 {{ t.progress }}%</span>
            </div>
          </div>
          <!-- 通道货物分布 -->
          <div class="px-4 py-3">
            <!-- 迷你堆叠条 -->
            <div class="h-3 rounded-full overflow-hidden flex bg-apple-fill/60 mb-3">
              <div v-if="t.unshipped > 0" class="h-full transition-all duration-500" style="background:#e5e5ea" :style="{ width: pct(t.unshipped, t.planned) + '%' }"></div>
              <div v-if="t.inTransit > 0" class="h-full transition-all duration-500" style="background:#4176e6" :style="{ width: pct(t.inTransit, t.planned) + '%' }"></div>
              <div v-if="t.stored > 0" class="h-full transition-all duration-500" style="background:#ff9500" :style="{ width: pct(t.stored, t.planned) + '%' }"></div>
              <div v-if="t.pickedUp > 0" class="h-full transition-all duration-500" style="background:#34c759" :style="{ width: pct(t.pickedUp, t.planned) + '%' }"></div>
            </div>
            <!-- 数据明细 -->
            <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div class="text-center">
                <div class="text-[11px] text-apple-subtext">计划总量</div>
                <div class="text-apple-text font-semibold mt-0.5">{{ fmtNum(t.planned) }} 吨</div>
              </div>
              <div class="text-center">
                <div class="text-[11px] text-apple-subtext">未发运</div>
                <div class="text-apple-subtext font-semibold mt-0.5">{{ fmtNum(t.unshipped) }} 吨</div>
              </div>
              <div class="text-center">
                <div class="text-[11px] text-apple-blue">运输中</div>
                <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.inTransit) }} 吨</div>
              </div>
              <div class="text-center">
                <div class="text-[11px] text-apple-orange">仓储堆存</div>
                <div class="text-apple-orange font-semibold mt-0.5">{{ fmtNum(t.stored) }} 吨</div>
              </div>
              <div class="text-center">
                <div class="text-[11px] text-apple-green">已提货出关</div>
                <div class="text-apple-green font-semibold mt-0.5">{{ fmtNum(t.pickedUp) }} 吨</div>
              </div>
            </div>
            <!-- 发运时间 -->
            <div v-if="t.shipping.actualDate || t.shipping.planDate" class="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-apple-border/40 text-[11px] text-apple-subtext">
              <span v-if="t.shipping.planDate" class="flex items-center gap-1"><Icon name="clock" :size="10" /> 计划发运 {{ fmtDate(t.shipping.planDate) }}</span>
              <span v-if="t.shipping.actualDate" class="flex items-center gap-1 text-apple-green"><Icon name="check-circle" :size="10" /> 实际发运 {{ fmtDate(t.shipping.actualDate) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 4. 跳转运输时间轴（避免内容重复） -->
    <div class="card p-5 bg-gradient-to-br from-apple-subtext/[0.03] to-transparent border border-apple-border/40">
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-subtext/10 text-apple-subtext">
            <Icon name="map-pin" :size="18" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-apple-text">运输环节时间记录</h3>
            <p class="text-[11px] text-apple-subtext mt-0.5">完整的货物运输时间轴与操作日志，按时间顺序记录所有关键节点</p>
          </div>
        </div>
        <button @click="$emit('navigate', 'log')" class="btn-secondary text-xs">
          查看运输时间轴
          <Icon name="arrow-right" :size="13" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import { fmtDate, fmtNum } from '@/lib/format'
import { SHIPPING_META } from '@/types'
import type { Capacity, ChannelShipping } from '@/types'
import { buildCargoDistribution, buildChannelTracking, buildShippingStats, pct } from './shipping-helpers'

const props = defineProps<{
  shippings: ChannelShipping[]
  capacities: Capacity[]
  cargoTotal: number
}>()

defineEmits<{ navigate: [tab: 'shipping' | 'warehouse' | 'finance' | 'log'] }>()

/** 发运统计（订单整体） */
const shippingStats = computed(() => buildShippingStats(props.shippings))

/** 通道货物追踪（每条通道的货物流转状态） */
const channelCargoTracking = computed(() => buildChannelTracking(props.capacities, props.shippings))

/** 货物状态分布数据（用于可视化） */
const cargoDistribution = computed(() => buildCargoDistribution(props.cargoTotal, shippingStats.value))
</script>
