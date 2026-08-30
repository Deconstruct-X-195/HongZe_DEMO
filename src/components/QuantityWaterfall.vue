<script setup lang="ts">
import { computed } from 'vue'

/**
 * 数量瀑布（五级口径对比）：计划 → 装车 → 入库 → 出库 → 结算
 * 纯展示组件，横向条形对比，条宽按计划量归一化。
 */
const props = withDefaults(
  defineProps<{
    planned?: number
    loaded?: number
    inbound?: number
    outbound?: number
    settled?: number
    unit?: string
  }>(),
  { planned: 0, loaded: 0, inbound: 0, outbound: 0, settled: 0, unit: '吨' },
)

const items = computed(() => [
  { key: 'planned', label: '计划量', qty: props.planned, cls: 'bg-apple-blue', width: 100 },
  { key: 'loaded', label: '装车量', qty: props.loaded, cls: 'bg-[#5856d6]', width: 0 },
  { key: 'inbound', label: '入库量', qty: props.inbound, cls: 'bg-[#34c759]', width: 0 },
  { key: 'outbound', label: '出库量', qty: props.outbound, cls: 'bg-[#ff9500]', width: 0 },
  { key: 'settled', label: '结算量', qty: props.settled, cls: 'bg-[#af52de]', width: 0 },
])

const max = computed(() => Math.max(props.planned, props.loaded, props.inbound, props.outbound, props.settled, 1))

const rows = computed(() =>
  items.value.map((i) => ({
    ...i,
    width: Math.max(2, Math.round((i.qty / max.value) * 100)),
    diff: i.key === 'planned' ? null : i.qty - props.planned,
  })),
)

function fmt(n: number): string {
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}
</script>

<template>
  <div class="space-y-2">
    <div v-for="r in rows" :key="r.key" class="flex items-center gap-2">
      <span class="w-14 shrink-0 text-xs text-apple-subtext">{{ r.label }}</span>
      <div class="h-4 flex-1 rounded-md bg-apple-fill/60 overflow-hidden">
        <div
          class="h-full rounded-md transition-all duration-500"
          :class="r.cls"
          :style="{ width: r.width + '%' }"
        />
      </div>
      <span class="w-24 shrink-0 text-right text-xs font-medium text-apple-text tabular-nums">
        {{ fmt(r.qty) }}
        <span class="text-apple-subtext font-normal">{{ unit }}</span>
      </span>
      <span
        v-if="r.diff !== null && r.diff !== 0"
        class="w-16 shrink-0 text-right text-[11px] tabular-nums"
        :class="r.diff < 0 ? 'text-apple-red' : 'text-apple-blue'"
      >
        {{ r.diff > 0 ? '+' : '' }}{{ fmt(r.diff) }}
      </span>
      <span v-else class="w-16 shrink-0" />
    </div>
  </div>
</template>
