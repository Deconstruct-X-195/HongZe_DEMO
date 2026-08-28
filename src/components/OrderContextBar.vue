<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Icon from './Icon.vue'
import Badge from './Badge.vue'
import { STATUS_META } from '@/types'
import { orderSummary, fmtDate } from '@/lib/format'
import type { Order } from '@/types'

defineProps<{ order: Order; step?: number }>()
</script>

<template>
  <RouterLink
    :to="`/orders/${order.id}`"
    class="block card p-4 hover:shadow-card-hover transition-shadow animate-slide-up"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex items-center justify-center w-10 h-10 rounded-apple bg-gradient-to-br from-apple-blue/15 to-apple-purple/15 text-apple-blue shrink-0"
      >
        <Icon name="package" :size="18" />
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-[13px] font-mono font-semibold text-apple-text">
            {{ order.id }}
          </span>
          <Badge
            :label="STATUS_META[order.status ?? 'draft'].label"
            :color="STATUS_META[order.status ?? 'draft'].color"
            :bg="STATUS_META[order.status ?? 'draft'].bg"
          />
          <span v-if="step !== undefined" class="text-[11px] text-apple-subtext">
            步骤 {{ step + 1 }}/4
          </span>
        </div>
        <p class="text-xs text-apple-subtext mt-0.5 truncate">{{ orderSummary(order) }}</p>
      </div>
      <div class="text-[11px] text-apple-subtext hidden sm:block">
        {{ fmtDate(order.createdAt) }}
      </div>
      <Icon name="chevron-right" :size="16" class="text-apple-subtext shrink-0" />
    </div>
  </RouterLink>
</template>
