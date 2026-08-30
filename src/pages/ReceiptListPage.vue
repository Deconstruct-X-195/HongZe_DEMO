<template>
  <div class="animate-fade-in">
<PageHeader title="接货管理" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索接货单号/货物/地点..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto">
            <option value="">全部状态</option>
            <option v-for="(meta, key) in RECEIPT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <button @click="goToNew" class="btn-primary">新增接货</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">接货单总数</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.receipts.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">待接货</div><div class="text-xl font-semibold tabular-nums text-apple-orange">{{ pendingCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">接货中</div><div class="text-xl font-semibold tabular-nums text-blue-500">{{ inProgressCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已完成</div><div class="text-xl font-semibold tabular-nums text-apple-green">{{ completedCount }}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">接货单号</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">关联订单</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">计划/实际(吨)</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">接货地点</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">交货方</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.receiptNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text-secondary">{{ item.orderId || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.plannedQty }} / {{ item.actualQty || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.location }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.consignor || '-' }}</td>
              <td class="px-4 py-3">
                <Badge :label="RECEIPT_STATUS_META[item.status]?.label" :color="RECEIPT_STATUS_META[item.status]?.color" :bg="RECEIPT_STATUS_META[item.status]?.bg" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="8" class="px-4 py-12 text-center text-apple-text-secondary">暂无接货数据</td></tr>
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
import { RECEIPT_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredList = computed(() => business.receipts.filter((r) => {
  const matchSearch = !search.value || r.receiptNo.includes(search.value) || r.cargoName.includes(search.value) || r.location.includes(search.value)
  const matchStatus = !filterStatus.value || r.status === filterStatus.value
  return matchSearch && matchStatus
}))
const pendingCount = computed(() => business.receipts.filter((r) => r.status === 'pending').length)
const inProgressCount = computed(() => business.receipts.filter((r) => r.status === 'in_progress').length)
const completedCount = computed(() => business.receipts.filter((r) => r.status === 'completed').length)
const goToNew = () => router.push('/receipts/new')
const goToEdit = (id: string) => router.push(`/receipts/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeReceipt(id) }
onMounted(() => business.loadReceipts())
</script>
