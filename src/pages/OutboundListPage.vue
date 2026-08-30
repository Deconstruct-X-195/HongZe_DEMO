<template>
  <div class="animate-fade-in">
<PageHeader title="出库中心" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索出库单号/提货人/货物..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto"><option value="">全部状态</option><option v-for="(meta, key) in OUTBOUND_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="btn-primary">新增出库</button>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">出库单号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">提货主体</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">计划/实际(吨)</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">仓库</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.outboundNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.picker }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.plannedQty }} / {{ item.actualQty || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }}</td>
              <td class="px-4 py-3"><Badge :label="OUTBOUND_STATUS_META[item.status]?.label" :color="OUTBOUND_STATUS_META[item.status]?.color" :bg="OUTBOUND_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无出库数据</td></tr>
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
import { OUTBOUND_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredList = computed(() => business.outbounds.filter((o) => {
  const matchSearch = !search.value || o.outboundNo.includes(search.value) || o.picker.includes(search.value) || o.cargoName.includes(search.value)
  const matchStatus = !filterStatus.value || o.status === filterStatus.value
  return matchSearch && matchStatus
}))
const goToNew = () => router.push('/outbound/new')
const goToEdit = (id: string) => router.push(`/outbound/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeOutbound(id) }
onMounted(() => business.loadOutbounds())
</script>
