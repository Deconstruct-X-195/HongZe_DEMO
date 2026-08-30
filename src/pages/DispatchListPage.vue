<template>
  <div class="animate-fade-in">
<PageHeader title="调度中心" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索派单号/货物..." class="field-input py-2 w-64" />
          <select v-model="filterType" class="field-input py-2 w-auto"><option value="">全部类型</option><option v-for="(meta, key) in DISPATCH_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="btn-primary">新增派单</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">派单号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">类型</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">数量(吨)</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">起→终</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.dispatchNo }}</td>
              <td class="px-4 py-3"><Badge :label="DISPATCH_TYPE_META[item.type]?.label" :color="DISPATCH_TYPE_META[item.type]?.color" :bg="DISPATCH_TYPE_META[item.type]?.color + '20'" /></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3"><Badge :label="DISPATCH_STATUS_META[item.status]?.label" :color="DISPATCH_STATUS_META[item.status]?.color" :bg="DISPATCH_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
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
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
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
