<script setup lang="ts">
import Icon from './Icon.vue'
import type { IconName } from './Icon.vue'

defineProps<{
  icon: IconName
  title: string
  desc?: string
}>()
</script>

<template>
  <div
    class="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in"
  >
    <div
      class="w-16 h-16 rounded-full bg-apple-fill flex items-center justify-center text-apple-subtext mb-4"
    >
      <Icon :name="icon" :size="28" />
    </div>
    <h3 class="text-base font-semibold text-apple-text">{{ title }}</h3>
    <p v-if="desc" class="text-sm text-apple-subtext mt-1 max-w-xs">{{ desc }}</p>
    <div v-if="$slots.default" class="mt-5">
      <slot />
    </div>
  </div>
</template>
