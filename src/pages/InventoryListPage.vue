<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="库存中心 - 堆存管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <input v-model="search" type="text" placeholder="搜索批次号/货物/仓库..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增库存批次</button>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">库存批次</div><div class="text-2xl font-semibold text-apple-text">{{ business.inventoryBatches.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">在库总量(吨)</div><div class="text-2xl font-semibold text-green-500">{{ business.inventoryTotal.toLocaleString() }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">在库批次</div><div class="text-2xl font-semibold text-apple-blue">{{ inStockCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已出库</div><div class="text-2xl font-semibold text-gray-500">{{ allOutCount }}</div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">批次号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">入库/当前(吨)</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">仓库/库位</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">入库日期</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.batchNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.inboundQty }} / {{ item.currentQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }} / {{ item.location }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.inboundDate?.slice(0, 10) }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: INVENTORY_STATUS_META[item.status]?.color, backgroundColor: INVENTORY_STATUS_META[item.status]?.bg }">{{ INVENTORY_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无库存数据</td></tr>
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
import { INVENTORY_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filteredList = computed(() => business.inventoryBatches.filter((b) => !search.value || b.batchNo.includes(search.value) || b.cargoName.includes(search.value) || b.warehouse.includes(search.value)))
const inStockCount = computed(() => business.inventoryBatches.filter((b) => b.status === 'in_stock').length)
const allOutCount = computed(() => business.inventoryBatches.filter((b) => b.status === 'all_out').length)
const goToNew = () => router.push('/inventory/new')
const goToEdit = (id: string) => router.push(`/inventory/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeInventoryBatch(id) }
onMounted(() => business.loadInventoryBatches())
</script>
