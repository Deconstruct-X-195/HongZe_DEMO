<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="仓储入库" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <input v-model="search" type="text" placeholder="搜索入库单号/货物/仓库..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增入库</button>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">入库单号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">计划/实际(吨)</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">仓库</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">车辆</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.inboundNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.plannedQty }} / {{ item.actualQty || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.vehicleNo || '-' }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: INBOUND_STATUS_META[item.status]?.color, backgroundColor: INBOUND_STATUS_META[item.status]?.bg }">{{ INBOUND_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无入库数据</td></tr>
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
import { INBOUND_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filteredList = computed(() => business.inbounds.filter((i) => !search.value || i.inboundNo.includes(search.value) || i.cargoName.includes(search.value) || i.warehouse.includes(search.value)))
const goToNew = () => router.push('/inbound/new')
const goToEdit = (id: string) => router.push(`/inbound/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeInbound(id) }
onMounted(() => business.loadInbounds())
</script>
