<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Icon from '@/components/Icon.vue'
import { useAuthStore } from '@/stores/auth'
import { ROLE_META, ALL_ROLES } from '@/types/auth'

const router = useRouter()
const auth = useAuthStore()

const selected = ref<string>('')
const name = ref('')

function selectRole(key: string) {
  selected.value = key
}

function login() {
  if (!selected.value) return
  auth.login(selected.value as keyof typeof ROLE_META, name.value)
  router.replace(auth.defaultPath)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-apple-bg px-4 py-10">
    <div class="w-full max-w-2xl">
      <!-- 品牌区 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-apple-blue to-apple-bluePress text-white shadow-lg mb-4">
          <Icon name="route" :size="26" />
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-apple-text">泓泽宜通</h1>
        <p class="text-sm text-apple-subtext mt-1.5">运输组织方案系统 · 请选择您的岗位身份登录</p>
      </div>

      <!-- 角色选择 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          v-for="key in ALL_ROLES"
          :key="key"
          @click="selectRole(key)"
          class="card p-4 flex items-start gap-3.5 text-left transition-all duration-200"
          :class="selected === key ? 'border-apple-blue ring-2 ring-apple-blue/20 shadow-md' : 'hover:border-apple-blue/40 hover:shadow-sm'"
        >
          <div class="flex items-center justify-center w-10 h-10 rounded-apple shrink-0"
            :style="{ backgroundColor: ROLE_META[key].color + '15', color: ROLE_META[key].color }">
            <Icon :name="ROLE_META[key].icon" :size="19" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-apple-text">{{ ROLE_META[key].label }}</span>
              <Icon v-if="selected === key" name="check-circle" :size="14" class="text-apple-blue shrink-0" />
            </div>
            <p class="text-xs text-apple-subtext mt-1 leading-relaxed">{{ ROLE_META[key].desc }}</p>
          </div>
        </button>
      </div>

      <!-- 姓名与登录 -->
      <div class="card p-5 mt-5 space-y-3">
        <div>
          <label class="field-label">姓名（选填）</label>
          <input v-model="name" class="field-input" placeholder="默认显示岗位名称" autocomplete="off" @keyup.enter="login" />
        </div>
        <button @click="login" :disabled="!selected" class="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed">
          <Icon name="arrow-right" :size="15" />
          进入系统
        </button>
        <p class="text-[11px] text-apple-tertiary text-center">演示环境模拟登录 · 不同岗位将看到不同的功能菜单</p>
      </div>
    </div>
  </div>
</template>
