<template>
  <div class="animate-fade-in">
<PageHeader title="库存中心" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <input v-model="search" type="text" placeholder="搜索批次号/货物/仓库..." class="field-input py-2 w-64" />
        <button @click="goToNew" class="btn-primary">新增库存批次</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">库存批次</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.inventoryBatches.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">在库总量(吨)</div><div class="text-xl font-semibold tabular-nums text-apple-green">{{ business.inventoryTotal.toLocaleString() }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">在库批次</div><div class="text-xl font-semibold tabular-nums text-apple-blue">{{ inStockCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已出库</div><div class="text-xl font-semibold tabular-nums text-apple-subtext">{{ allOutCount }}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">批次号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">入库/当前(吨)</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">仓库/库位</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">入库日期</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.batchNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.inboundQty }} / {{ item.currentQty }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.warehouse }} / {{ item.location }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.inboundDate?.slice(0, 10) }}</td>
              <td class="px-4 py-3"><Badge :label="INVENTORY_STATUS_META[item.status]?.label" :color="INVENTORY_STATUS_META[item.status]?.color" :bg="INVENTORY_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
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
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
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
