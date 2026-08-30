<template>
  <div class="space-y-3">
    <!-- 导航提示：仓储岗可跳转工作台操作，其他岗位仅提示 -->
    <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1">
      <Icon name="info" :size="12" />
      <template v-if="canOperate">
        <span>仓储数据档案 · 到货入库 / 提货出关操作请前往</span>
        <RouterLink to="/workspace/warehouse" class="text-apple-blue font-medium hover:underline">「仓储工作台」</RouterLink>
      </template>
      <span v-else>仓储数据档案 · 到货入库 / 提货出关由仓储岗办理</span>
    </div>

    <!-- 无可仓储通道提示 -->
    <div v-if="warehouseChannels.length === 0" class="card p-5">
      <EmptyState icon="info" title="暂无仓储数据" desc="订单执行发货后，在途与堆存货物会出现在此处。" />
    </div>

    <template v-else>
      <!-- 1. 仓储总览 -->
      <div class="card p-5">
        <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
            <Icon name="package" :size="16" class="text-apple-subtext" />
            仓储总览
          </h3>
          <button @click="$emit('navigate', 'cargo')" class="text-[11px] text-apple-blue font-medium hover:underline flex items-center gap-1">
            查看货物动态 <Icon name="arrow-right" :size="11" />
          </button>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded-apple-lg border border-apple-blue/20 bg-apple-blue/[0.04] p-3.5 text-center">
            <div class="text-[11px] text-apple-subtext">在途运输量</div>
            <div class="text-lg font-bold text-apple-blue mt-1">{{ fmtNum(inTransitQty) }}<span class="text-xs font-normal ml-1">吨</span></div>
          </div>
          <div class="rounded-apple-lg border border-apple-orange/20 bg-apple-orange/[0.04] p-3.5 text-center">
            <div class="text-[11px] text-apple-subtext">仓储堆存量</div>
            <div class="text-lg font-bold text-apple-orange mt-1">{{ fmtNum(shippingStats.stored) }}<span class="text-xs font-normal ml-1">吨</span></div>
          </div>
          <div class="rounded-apple-lg border border-apple-green/20 bg-apple-green/[0.04] p-3.5 text-center">
            <div class="text-[11px] text-apple-subtext">已提货出关</div>
            <div class="text-lg font-bold text-apple-green mt-1">{{ fmtNum(shippingStats.pickedUp) }}<span class="text-xs font-normal ml-1">吨</span></div>
          </div>
        </div>
        <div class="mt-3 text-[11px] text-apple-subtext flex items-center gap-2 flex-wrap">
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue"></span>在途运输</span>
          <Icon name="arrow-right" :size="10" />
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-orange"></span>到货入库（堆存）</span>
          <Icon name="arrow-right" :size="10" />
          <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-green"></span>提货出关</span>
        </div>
      </div>

      <!-- 2. 各通道仓储状态 -->
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
          <Icon name="layers" :size="15" class="text-apple-subtext" />
          各通道仓储状态
        </h3>
        <div class="space-y-2.5">
          <div v-for="t in warehouseChannels" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
            <div class="flex items-center justify-between gap-3 px-4 py-3" :style="{ borderLeft: `3px solid ${t.channelColor}` }">
              <div class="flex items-center gap-2.5 flex-1 min-w-0">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
                <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
              </div>
            </div>
            <div class="px-4 py-2.5 bg-apple-fill/30 border-t border-apple-border/30">
              <div class="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <div class="text-[11px] text-apple-blue">在途运输</div>
                  <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.inTransit) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
                <div>
                  <div class="text-[11px] text-apple-orange">仓储堆存</div>
                  <div class="text-apple-orange font-semibold mt-0.5">{{ fmtNum(t.stored) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
                <div>
                  <div class="text-[11px] text-apple-green">已提货出关</div>
                  <div class="text-apple-green font-semibold mt-0.5">{{ fmtNum(t.pickedUp) }}<span class="text-[9px] font-normal">吨</span></div>
                </div>
              </div>
              <div class="h-1.5 rounded-full bg-apple-fill-strong/60 overflow-hidden flex mt-2">
                <div class="h-full bg-apple-green transition-all duration-500" :style="{ width: pct(t.pickedUp, t.planned) + '%' }"></div>
                <div class="h-full bg-apple-orange transition-all duration-500" :style="{ width: pct(t.stored, t.planned) + '%' }"></div>
                <div class="h-full bg-apple-blue/40 transition-all duration-500" :style="{ width: pct(t.inTransit, t.planned) + '%' }"></div>
              </div>
              <div class="flex items-center gap-4 mt-2 text-[11px] text-apple-subtext">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue/40"></span>在途 {{ fmtNum(t.inTransit) }}吨</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-orange"></span>堆存 {{ fmtNum(t.stored) }}吨</span>
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-green"></span>提货 {{ fmtNum(t.pickedUp) }}吨</span>
                <span v-if="t.shipping.vouchers.length > 0" class="ml-auto flex items-center gap-1"><Icon name="paperclip" :size="10" /> {{ t.shipping.vouchers.length }} 个凭证</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 待办：跳转仓储工作台 -->
      <div v-if="inTransitQty > 0 || shippingStats.stored > 0" class="card p-5 border-2 border-apple-orange/20 bg-gradient-to-br from-apple-orange/[0.03] to-transparent">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex items-start gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-orange/15 text-apple-orange shrink-0">
              <Icon name="package" :size="20" />
            </div>
            <div>
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                仓储操作
                <span v-if="inTransitQty > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">待到货 {{ fmtNum(inTransitQty) }} 吨</span>
                <span v-if="shippingStats.stored > 0" class="text-[11px] px-2 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-medium">待提货 {{ fmtNum(shippingStats.stored) }} 吨</span>
              </h3>
              <p class="text-xs text-apple-subtext mt-1 leading-relaxed">
                {{ canOperate ? '到货入库与提货出关操作已迁移至仓储工作台，办理后货物动态自动同步。' : '到货入库与提货出关由仓储岗办理，办理后此处数据自动同步。' }}
              </p>
            </div>
          </div>
          <RouterLink v-if="canOperate" to="/workspace/warehouse" class="btn-primary text-xs shrink-0 bg-apple-orange hover:bg-apple-orange/90">
            前往仓储工作台
            <Icon name="arrow-right" :size="13" />
          </RouterLink>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessPath } from '@/types/auth'
import { fmtNum } from '@/lib/format'
import type { Capacity, ChannelShipping } from '@/types'
import { buildChannelTracking, buildShippingStats, pct } from './shipping-helpers'

const props = defineProps<{
  shippings: ChannelShipping[]
  capacities: Capacity[]
}>()

const auth = useAuthStore()

defineEmits<{ navigate: [tab: 'cargo'] }>()

/** 仅运营岗/管理员可进入仓储工作台操作 */
const canOperate = computed(() => canAccessPath(auth.role, '/workspace/warehouse'))

const shippingStats = computed(() => buildShippingStats(props.shippings))
const channelCargoTracking = computed(() => buildChannelTracking(props.capacities, props.shippings))

/** 仅展示已发运的通道 */
const warehouseChannels = computed(() => channelCargoTracking.value.filter((t) => t.shipped > 0))

const inTransitQty = computed(() => {
  const shipped = shippingStats.value.shipped
  const stored = shippingStats.value.stored
  const pickedUp = shippingStats.value.pickedUp
  return Math.max(0, shipped - stored - pickedUp)
})
</script>
