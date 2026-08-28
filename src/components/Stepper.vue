<script setup lang="ts">
import { RouterLink } from 'vue-router'
import Icon, { type IconName } from './Icon.vue'

export interface Step {
  key: string
  label: string
  icon: IconName
  path: (orderId: string) => string
}

defineProps<{ orderId: string; current: number }>()

const STEPS: Step[] = [
  { key: 'order', label: '订单录入', icon: 'clipboard-list', path: (id) => `/orders/${id}/edit` },
  { key: 'port', label: '港口信息', icon: 'anchor', path: (id) => `/orders/${id}/port` },
  { key: 'capacity', label: '运力信息', icon: 'train', path: (id) => `/orders/${id}/capacity` },
  { key: 'plan', label: '运输方案', icon: 'file-text', path: (id) => `/orders/${id}/plan` },
]
</script>

<template>
  <div class="card p-4 sm:p-5">
    <div class="flex items-center">
      <template v-for="(step, idx) in STEPS" :key="step.key">
        <div class="flex items-center flex-1 last:flex-none">
          <RouterLink
            v-if="idx <= current"
            :to="step.path(orderId)"
            class="hover:opacity-80 transition-opacity"
          >
            <div class="flex flex-col items-center gap-1.5 min-w-[64px]">
              <div
                class="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
                :class="
                  idx === current
                    ? 'bg-apple-blue text-white shadow-md scale-110'
                    : idx < current
                      ? 'bg-apple-green text-white'
                      : 'bg-gray-100 text-apple-subtext'
                "
              >
                <Icon :name="idx < current ? 'check' : step.icon" :size="16" />
              </div>
              <span
                class="text-[11px] font-medium transition-colors"
                :class="idx <= current ? 'text-apple-text' : 'text-apple-subtext'"
              >
                {{ step.label }}
              </span>
            </div>
          </RouterLink>
          <div v-else class="flex flex-col items-center gap-1.5 min-w-[64px]">
            <div
              class="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-apple-subtext"
            >
              <Icon :name="step.icon" :size="16" />
            </div>
            <span class="text-[11px] font-medium text-apple-subtext">{{ step.label }}</span>
          </div>
          <div
            v-if="idx < STEPS.length - 1"
            class="flex-1 h-px mx-2 bg-apple-border relative overflow-hidden"
          >
            <div
              class="absolute inset-0 bg-apple-green transition-transform duration-500 origin-left"
              :class="idx < current ? 'scale-x-100' : 'scale-x-0'"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
