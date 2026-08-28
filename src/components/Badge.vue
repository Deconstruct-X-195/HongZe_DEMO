<script setup lang="ts">
defineProps<{ label: string; color: string; bg: string }>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap"
    :style="{ color, backgroundColor: bg }"
  >
    <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: color }" />
    {{ label }}
  </span>
</template>
