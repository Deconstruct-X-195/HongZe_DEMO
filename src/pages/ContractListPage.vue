<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="合同管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索合同号/客户/标题..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm focus:outline-none"><option value="">全部状态</option><option v-for="(meta, key) in CONTRACT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">+ 新增合同</button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">合同号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">标题</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">客户</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">类型</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">金额</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredContracts" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.contractNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.title }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: CONTRACT_TYPE_META[item.type]?.color, backgroundColor: CONTRACT_TYPE_META[item.type]?.color + '20' }">{{ CONTRACT_TYPE_META[item.type]?.label }}</span></td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.amount.toLocaleString() }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: CONTRACT_STATUS_META[item.status]?.color, backgroundColor: CONTRACT_STATUS_META[item.status]?.bg }">{{ CONTRACT_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredContracts.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无合同数据</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import { useBusinessStore } from '@/stores'
import { CONTRACT_STATUS_META, CONTRACT_TYPE_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredContracts = computed(() => business.contracts.filter((c) => {
  const matchSearch = !search.value || c.contractNo.includes(search.value) || c.customerName.includes(search.value) || c.title.includes(search.value)
  const matchStatus = !filterStatus.value || c.status === filterStatus.value
  return matchSearch && matchStatus
}))
const goToNew = () => router.push('/contracts/new')
const goToEdit = (id: string) => router.push(`/contracts/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeContract(id) }
onMounted(() => business.loadContracts())
</script>
