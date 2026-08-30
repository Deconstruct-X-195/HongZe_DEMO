import { ref } from 'vue'

const STORAGE_KEY = 'hz-theme'

const isDark = ref(document.documentElement.classList.contains('dark'))

function apply(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark)
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')
  } catch {
    /* 隐私模式下 localStorage 不可用，仅当次会话生效 */
  }
  isDark.value = dark
}

/** 主题切换：暗色状态为全局单例，TopBar / Sidebar 共用 */
export function useTheme() {
  return {
    isDark,
    toggle: () => apply(!isDark.value),
  }
}
