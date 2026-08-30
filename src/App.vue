<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const route = useRoute()
/** 登录页使用全屏布局，不渲染侧边栏 */
const isAuthPage = computed(() => route.path === '/login')
</script>

<template>
  <div v-if="isAuthPage" class="min-h-screen bg-apple-bg text-apple-text">
    <RouterView />
  </div>
  <div v-else class="min-h-screen flex bg-apple-bg text-apple-text">
    <Sidebar />
    <div class="flex-1 min-w-0 flex flex-col">
      <main class="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
        <RouterView v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </main>
      <footer class="py-6 text-center text-[11px] text-apple-tertiary">
        泓泽宜通 · 运输组织方案系统 · 内部使用
      </footer>
    </div>
  </div>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
