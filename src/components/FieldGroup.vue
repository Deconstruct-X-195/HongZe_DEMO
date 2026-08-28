<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { IconName } from './Icon.vue'

const props = withDefaults(
  defineProps<{
    icon: IconName
    title: string
    desc?: string
    collapsible?: boolean
    isOpen?: boolean
    summary?: string
  }>(),
  { collapsible: false, isOpen: true, summary: '' },
)

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
}>()

const open = computed({
  get: () => props.isOpen,
  set: (v) => emit('update:isOpen', v),
})

function toggle() {
  if (props.collapsible) open.value = !open.value
}
</script>

<template>
  <section class="card animate-slide-up overflow-hidden">
    <!-- 标题栏（可折叠时为 button） -->
    <component
      :is="collapsible ? 'button' : 'div'"
      @click="collapsible ? toggle() : undefined"
      :class="collapsible ? 'w-full text-left hover:bg-gray-50/50 transition-colors' : ''"
      class="px-5 sm:px-6 pt-5 sm:pt-6"
    >
      <div class="flex items-start justify-between" :class="collapsible ? 'pb-4' : 'mb-5'">
        <div class="flex items-center gap-3">
          <div
            class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-blue/10 text-apple-blue"
          >
            <slot name="icon">
              <Icon :name="icon" :size="18" />
            </slot>
          </div>
          <div>
            <h2 class="text-base font-semibold text-apple-text tracking-tight">{{ title }}</h2>
            <p v-if="desc && !collapsible" class="text-xs text-apple-subtext mt-0.5">{{ desc }}</p>
            <p v-if="collapsible && !open && summary" class="text-xs text-apple-subtext mt-0.5 truncate max-w-[60vw]">{{ summary }}</p>
            <p v-if="collapsible && !open && !summary" class="text-xs text-apple-subtext mt-0.5">{{ desc }}</p>
            <p v-if="collapsible && open && desc" class="text-xs text-apple-subtext mt-0.5">{{ desc }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <slot name="action" />
          <Icon
            v-if="collapsible"
            name="chevron-right"
            :size="18"
            class="text-apple-subtext transition-transform duration-300"
            :class="open ? 'rotate-90' : ''"
          />
        </div>
      </div>
    </component>

    <!-- 内容区域 -->
    <div v-show="!collapsible || open" class="px-5 sm:px-6 pb-5 sm:pb-6">
      <slot />
    </div>
  </section>
</template>
