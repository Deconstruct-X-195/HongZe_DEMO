<script setup lang="ts">
defineProps<{
  label: string
  required?: boolean
  hint?: string
}>()
</script>

<template>
  <div>
    <label class="field-label">
      {{ label }}
      <span v-if="required" class="text-apple-red ml-0.5">*</span>
    </label>
    <slot />
    <p v-if="hint" class="text-[11px] text-apple-subtext mt-1">{{ hint }}</p>
  </div>
</template>
