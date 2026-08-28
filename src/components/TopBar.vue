<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from './Icon.vue'

const props = defineProps<{ title?: string; subtitle?: string }>()

const route = useRoute()
const router = useRouter()
const showBack = computed(() => route.path !== '/')
const appTitle = import.meta.env.VITE_APP_TITLE ?? '泓泽宜通'

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header
    class="sticky top-0 z-40 backdrop-blur-xl bg-white/75 border-b border-apple-border/60"
  >
    <div class="mx-auto max-w-6xl px-6 h-14 flex items-center gap-3">
      <button
        v-if="showBack"
        @click="goBack"
        class="flex items-center justify-center w-8 h-8 -ml-1 rounded-full text-apple-text hover:bg-black/5 transition-colors"
        aria-label="返回"
      >
        <Icon name="arrow-left" :size="18" />
      </button>
      <RouterLink to="/" class="flex items-center gap-2 group">
        <div
          class="w-7 h-7 rounded-lg bg-gradient-to-br from-apple-blue to-blue-700 flex items-center justify-center text-white shadow-sm"
        >
          <Icon name="route" :size="16" />
        </div>
        <div class="leading-tight">
          <div class="text-[15px] font-semibold tracking-tight text-apple-text">
            {{ title ?? appTitle }}
          </div>
          <div v-if="subtitle" class="text-[11px] text-apple-subtext -mt-0.5">
            {{ subtitle }}
          </div>
        </div>
      </RouterLink>
      <div class="ml-auto text-[11px] text-apple-subtext hidden sm:block">
        运输组织方案系统
      </div>
    </div>
  </header>
</template>
