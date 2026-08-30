<template>
  <div class="animate-fade-in">
<PageHeader title="成本核算" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索成本单号/关联订单..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="confirmed">已确认</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <button @click="goToNew" class="btn-primary">新增成本核算</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">核算单总数</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.costSheets.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已确认</div><div class="text-xl font-semibold tabular-nums text-apple-green">{{ confirmedCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">总成本</div><div class="text-xl font-semibold tabular-nums text-apple-orange">¥{{ totalCost.toLocaleString() }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">总毛利</div><div class="text-xl font-semibold tabular-nums text-apple-green">¥{{ totalProfit.toLocaleString() }}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">成本单号</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">关联订单</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">成本项数</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">总成本</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">报价</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">毛利</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.costNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text-secondary">{{ item.orderId || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.items.length }} 项</td>
              <td class="px-4 py-3 text-sm text-apple-text">¥{{ item.totalCost.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">¥{{ (item.quotedPrice || 0).toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm font-medium" :class="(item.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'">¥{{ (item.profit || 0).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <Badge :label="statusLabel(item.status)" :color="statusMeta(item.status).color" :bg="statusMeta(item.status).bg" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="8" class="px-4 py-12 text-center text-apple-text-secondary">暂无成本核算数据</td></tr>
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
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredList = computed(() => business.costSheets.filter((c) => {
  const matchSearch = !search.value || c.costNo.includes(search.value) || (c.orderId || '').includes(search.value)
  const matchStatus = !filterStatus.value || c.status === filterStatus.value
  return matchSearch && matchStatus
}))
const confirmedCount = computed(() => business.costSheets.filter((c) => c.status === 'confirmed').length)
const totalCost = computed(() => business.costSheets.reduce((s, c) => s + c.totalCost, 0))
const totalProfit = computed(() => business.costSheets.reduce((s, c) => s + (c.profit || 0), 0))
const statusLabel = (s: string) => ({ draft: '草稿', confirmed: '已确认', archived: '已归档' }[s] || s)
const statusMeta = (s: string) => ({
  draft: { color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  confirmed: { color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  archived: { color: '#4176e6', bg: 'rgba(65,118,230,0.12)' },
}[s] || { color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' })
const goToNew = () => router.push('/costs/new')
const goToEdit = (id: string) => router.push(`/costs/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeCostSheet(id) }
onMounted(() => business.loadCostSheets())
</script>
