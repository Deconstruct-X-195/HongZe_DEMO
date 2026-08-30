/**
 * 登录状态管理（MVP 模拟登录：选择岗位身份进入系统）
 * 真实后端接入后，替换为 token + 用户信息校验
 */
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { ROLE_META, canAccessPath } from '@/types/auth'
import type { Role } from '@/types/auth'

const USER_KEY = 'hongze:user'

/** 当前登录用户信息 */
export interface CurrentUser {
  role: Role
  /** 模拟姓名（登录时可输入，默认取岗位名） */
  name: string
}

function loadUser(): CurrentUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CurrentUser
    if (parsed && parsed.role && parsed.role in ROLE_META) return parsed
    return null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<CurrentUser | null>(loadUser())

  const isLoggedIn = computed(() => user.value !== null)
  const role = computed<Role>(() => user.value?.role ?? 'admin')
  const roleMeta = computed(() => ROLE_META[role.value])
  const defaultPath = computed(() => ROLE_META[role.value].defaultPath)

  function login(r: Role, name?: string) {
    user.value = { role: r, name: name?.trim() || ROLE_META[r].label }
    localStorage.setItem(USER_KEY, JSON.stringify(user.value))
  }

  function logout() {
    user.value = null
    localStorage.removeItem(USER_KEY)
  }

  /** 路由级权限判断 */
  function canAccess(path: string): boolean {
    if (!user.value) return false
    return canAccessPath(user.value.role, path)
  }

  return { user, isLoggedIn, role, roleMeta, defaultPath, login, logout, canAccess }
})
