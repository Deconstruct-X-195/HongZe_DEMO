<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="调度中心 - 派单/请车" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索派单号/货物..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterType" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm"><option value="">全部类型</option><option v-for="(meta, key) in DISPATCH_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增派单</button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">派单号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">类型</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">数量(吨)</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">起→终</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.dispatchNo }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: DISPATCH_TYPE_META[item.type]?.color, backgroundColor: DISPATCH_TYPE_META[item.type]?.color + '20' }">{{ DISPATCH_TYPE_META[item.type]?.label }}</span></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: DISPATCH_STATUS_META[item.status]?.color, backgroundColor: DISPATCH_STATUS_META[item.status]?.bg }">{{ DISPATCH_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无派单数据</td></tr>
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
import { DISPATCH_STATUS_META, DISPATCH_TYPE_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterType = ref('')
const filteredList = computed(() => business.dispatches.filter((d) => {
  const matchSearch = !search.value || d.dispatchNo.includes(search.value) || d.cargoName.includes(search.value)
  const matchType = !filterType.value || d.type === filterType.value
  return matchSearch && matchType
}))
const goToNew = () => router.push('/dispatch/new')
const goToEdit = (id: string) => router.push(`/dispatch/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeDispatch(id) }
onMounted(() => business.loadDispatches())
</script>
