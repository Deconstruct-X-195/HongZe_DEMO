<template>
  <div class="animate-fade-in">
<PageHeader title="合同管理" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索合同号/客户/标题..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto"><option value="">全部状态</option><option v-for="(meta, key) in CONTRACT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="btn-primary">新增合同</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">合同号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">标题</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">客户</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">类型</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">金额</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredContracts" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.contractNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.title }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3"><Badge :label="CONTRACT_TYPE_META[item.type]?.label" :color="CONTRACT_TYPE_META[item.type]?.color" :bg="CONTRACT_TYPE_META[item.type]?.color + '20'" /></td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.amount.toLocaleString() }}</td>
              <td class="px-4 py-3"><Badge :label="CONTRACT_STATUS_META[item.status]?.label" :color="CONTRACT_STATUS_META[item.status]?.color" :bg="CONTRACT_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
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
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
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
