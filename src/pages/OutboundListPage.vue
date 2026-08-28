<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="出库中心" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索出库单号/提货人/货物..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm"><option value="">全部状态</option><option v-for="(meta, key) in OUTBOUND_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增出库</button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">出库单号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">提货主体</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">计划/实际(吨)</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">仓库</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.outboundNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.picker }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.plannedQty }} / {{ item.actualQty || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: OUTBOUND_STATUS_META[item.status]?.color, backgroundColor: OUTBOUND_STATUS_META[item.status]?.bg }">{{ OUTBOUND_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
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
import TopBar from '@/components/TopBar.vue'
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
