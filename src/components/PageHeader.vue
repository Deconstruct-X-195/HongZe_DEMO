<script setup lang="ts">
import Icon from './Icon.vue'
import { useTheme } from '@/theme'

defineProps<{
  title: string
  subtitle?: string
}>()

const { isDark, toggle } = useTheme()
</script>

<template>
  <header class="flex items-start justify-between gap-4 flex-wrap">
    <div class="min-w-0">
      <h1 class="text-xl font-semibold tracking-tight text-apple-text">{{ title }}</h1>
      <p class="text-sm text-apple-subtext mt-1">
        <slot name="subtitle">{{ subtitle }}</slot>
      </p>
    </div>
    <div class="flex items-center gap-2.5">
      <slot name="actions" />
      <!-- 移动端主题切换（桌面端在侧边栏底部） -->
      <button
        @click="toggle"
        class="md:hidden flex items-center justify-center w-8 h-8 rounded-full text-apple-subtext hover:bg-apple-hover/10 hover:text-apple-text transition-colors"
        :aria-label="isDark ? '切换亮色模式' : '切换暗色模式'"
      >
        <Icon :name="isDark ? 'sun' : 'moon'" :size="16" />
      </button>
    </div>
  </header>
</template>
