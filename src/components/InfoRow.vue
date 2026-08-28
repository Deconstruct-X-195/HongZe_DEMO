<script setup lang="ts">
defineProps<{
  label: string
  value?: unknown
  strong?: boolean
}>()
</script>

<template>
  <div
    class="flex items-start justify-between py-2.5 gap-4 border-b border-apple-border/40 last:border-0"
  >
    <span class="text-xs text-apple-subtext shrink-0 pt-0.5">{{ label }}</span>
    <span
      class="text-sm text-right text-apple-text"
      :class="{ 'font-semibold': strong }"
    >
      <slot>{{ value ?? '—' }}</slot>
    </span>
  </div>
</template>
