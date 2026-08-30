<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { computed } from 'vue'
import Icon from './Icon.vue'
import type { IconName } from './Icon.vue'
import { useTheme } from '@/theme'
import { useAuthStore } from '@/stores/auth'
import { NAV_GROUPS, canAccessModule } from '@/types/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { isDark, toggle } = useTheme()

const appTitle = import.meta.env.VITE_APP_TITLE ?? '泓泽宜通'

interface NavItem {
  name: string
  path: string
  icon: IconName
}

/** 按当前角色过滤导航分组 */
const groups = computed<{ label: string; items: NavItem[] }[]>(() =>
  NAV_GROUPS
    .map((g) => ({
      label: g.label,
      items: g.items
        .filter((m) => auth.isLoggedIn && canAccessModule(auth.role, m))
        .map((m) => ({ name: m.name, path: m.path, icon: m.icon })),
    }))
    .filter((g) => g.items.length > 0),
)

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}

function logout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <aside
    class="hidden md:flex sticky top-0 h-screen w-56 shrink-0 flex-col bg-apple-sidebar border-r border-apple-border"
  >
    <!-- 品牌区 -->
    <RouterLink :to="auth.defaultPath" class="flex items-center gap-2.5 h-14 px-4 shrink-0">
      <div
        class="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-apple-blue to-apple-bluePress text-white shadow-sm"
      >
        <Icon name="route" :size="16" />
      </div>
      <div class="leading-tight min-w-0">
        <div class="text-[15px] font-semibold tracking-tight text-apple-text truncate">
          {{ appTitle }}
        </div>
        <div class="text-[11px] text-apple-tertiary">运输组织方案系统</div>
      </div>
    </RouterLink>

    <!-- 导航分组：图标 + 文字整体居中 -->
    <nav class="flex-1 overflow-y-auto pt-1 pb-2 px-2">
      <div v-for="group in groups" :key="group.label">
        <div
          class="px-3 pt-5 pb-1.5 text-[11px] font-medium text-apple-tertiary tracking-wide"
        >
          {{ group.label }}
        </div>
        <RouterLink
          v-for="item in group.items"
          :key="item.path"
          :to="item.path"
          class="flex items-center justify-center gap-2.5 h-9 w-full px-3 rounded-[10px] text-sm transition-colors duration-150"
          :class="
            isActive(item.path)
              ? 'bg-apple-fill text-apple-text font-medium'
              : 'text-apple-subtext hover:bg-apple-hover/10 hover:text-apple-text'
          "
        >
          <Icon :name="item.icon" :size="16" class="shrink-0" />
          <span class="truncate">{{ item.name }}</span>
        </RouterLink>
      </div>
    </nav>

    <!-- 底部：当前身份 + 退出 + 主题切换 -->
    <div class="shrink-0 px-2 pt-2 pb-3 border-t border-apple-border">
      <!-- 身份卡片 -->
      <div class="flex items-center gap-2.5 px-3 py-2 mb-1.5 rounded-[10px] bg-apple-fill/60">
        <div
          class="flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-white text-[11px] font-semibold"
          :style="{ backgroundColor: auth.roleMeta.color }"
        >
          {{ auth.user?.name.slice(0, 1) }}
        </div>
        <div class="flex-1 min-w-0 leading-tight">
          <div class="text-xs font-medium text-apple-text truncate">{{ auth.user?.name }}</div>
          <div class="text-[11px] text-apple-tertiary">{{ auth.roleMeta.label }}</div>
        </div>
        <button
          @click="logout"
          title="退出登录"
          class="text-apple-tertiary hover:text-apple-red transition-colors shrink-0"
        >
          <Icon name="arrow-left" :size="14" />
        </button>
      </div>
      <button
        @click="toggle"
        class="flex items-center justify-center gap-2.5 h-9 w-full px-3 rounded-[10px] text-sm text-apple-subtext hover:bg-apple-hover/10 hover:text-apple-text transition-colors duration-150"
      >
        <Icon :name="isDark ? 'sun' : 'moon'" :size="16" class="shrink-0" />
        {{ isDark ? '切换亮色模式' : '切换暗色模式' }}
      </button>
      <div class="px-3 pt-2 text-[11px] text-apple-tertiary text-center">内部使用 · Demo</div>
    </div>
  </aside>
</template>
