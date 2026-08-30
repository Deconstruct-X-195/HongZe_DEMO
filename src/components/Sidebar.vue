<script setup lang="ts">
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import Icon from './Icon.vue'
import type { IconName } from './Icon.vue'
import { useTheme } from '@/theme'

const route = useRoute()
const { isDark, toggle } = useTheme()

const appTitle = import.meta.env.VITE_APP_TITLE ?? '泓泽宜通'

interface NavItem {
  name: string
  path: string
  icon: IconName
}

/** 分组导航：总览 / 业务协作 / 运输执行 / 仓储物流 / 财务结算 */
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: '总览',
    items: [
      { name: '工作台', path: '/', icon: 'home' },
    ],
  },
  {
    label: '业务协作',
    items: [
      { name: '客户管理', path: '/customers', icon: 'building' },
      { name: '询价管理', path: '/inquiries', icon: 'search' },
      { name: '报价撮合', path: '/quotes', icon: 'send' },
      { name: '合同管理', path: '/contracts', icon: 'clipboard-list' },
      { name: '成本核算', path: '/costs', icon: 'dollar' },
      { name: '付款管理', path: '/payments', icon: 'dollar' },
    ],
  },
  {
    label: '运输执行',
    items: [
      { name: '接货管理', path: '/receipts', icon: 'package' },
      { name: '调度中心', path: '/dispatch', icon: 'route' },
      { name: '运输跟踪', path: '/transport', icon: 'truck' },
    ],
  },
  {
    label: '仓储物流',
    items: [
      { name: '仓储入库', path: '/inbound', icon: 'package' },
      { name: '库存中心', path: '/inventory', icon: 'layers' },
      { name: '出库中心', path: '/outbound', icon: 'send' },
    ],
  },
  {
    label: '财务结算',
    items: [
      { name: '结算中心', path: '/settlement', icon: 'file-text' },
    ],
  },
]

function isActive(path: string): boolean {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(`${path}/`)
}
</script>

<template>
  <aside
    class="hidden md:flex sticky top-0 h-screen w-56 shrink-0 flex-col bg-apple-sidebar border-r border-apple-border"
  >
    <!-- 品牌区 -->
    <RouterLink to="/" class="flex items-center gap-2.5 h-14 px-4 shrink-0">
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

    <!-- 底部：主题切换（与导航行同为居中布局） -->
    <div class="shrink-0 px-2 pt-2 pb-3 border-t border-apple-border">
      <button
        @click="toggle"
        class="flex items-center justify-center gap-2.5 h-9 w-full px-3 rounded-[10px] text-sm text-apple-subtext hover:bg-apple-hover/10 hover:text-apple-text transition-colors duration-150"
      >
        <Icon :name="isDark ? 'sun' : 'moon'" :size="16" class="shrink-0" />
        {{ isDark ? '切换亮色模式' : '切换暗色模式' }}
      </button>
      <div class="px-3 pt-2 text-[10px] text-apple-tertiary text-center">内部使用 · Demo</div>
    </div>
  </aside>
</template>
