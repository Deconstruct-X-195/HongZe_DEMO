<template>
  <Teleport to="body">
    <!-- 遮罩 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px]" @click="$emit('close')" />
    </Transition>
    <!-- 居中悬浮工作窗口 -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          class="pointer-events-auto w-full max-w-lg max-h-[85vh] bg-apple-card border border-apple-border shadow-2xl rounded-apple-xl flex flex-col overflow-hidden"
        >
          <!-- 窗口头部 -->
          <header class="flex items-start justify-between gap-3 px-5 py-4 border-b border-apple-border/60 shrink-0">
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex items-center justify-center w-9 h-9 rounded-apple shrink-0" :class="iconWrapClass">
                <Icon :name="icon" :size="17" />
              </div>
              <div class="min-w-0">
                <h2 class="text-sm font-semibold text-apple-text truncate">{{ title }}</h2>
                <p v-if="subtitle" class="text-xs text-apple-subtext mt-0.5 truncate">{{ subtitle }}</p>
              </div>
            </div>
            <button @click="$emit('close')" class="text-apple-subtext hover:text-apple-text transition-colors shrink-0 p-1">
              <Icon name="x" :size="16" />
            </button>
          </header>
          <!-- 窗口内容 -->
          <div class="flex-1 overflow-y-auto px-5 py-4">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Icon, { type IconName } from '@/components/Icon.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    icon?: IconName
    iconWrapClass?: string
  }>(),
  { subtitle: '', icon: 'clipboard-list', iconWrapClass: 'bg-apple-blue/10 text-apple-blue' },
)

defineEmits<{ close: [] }>()
</script>
