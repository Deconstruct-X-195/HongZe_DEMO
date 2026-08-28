<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="成本核算管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索成本单号/关联订单..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm focus:outline-none">
            <option value="">全部状态</option>
            <option value="draft">草稿</option>
            <option value="confirmed">已确认</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">+ 新增成本核算</button>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">核算单总数</div><div class="text-2xl font-semibold text-apple-text">{{ business.costSheets.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已确认</div><div class="text-2xl font-semibold text-green-500">{{ confirmedCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">总成本</div><div class="text-2xl font-semibold text-orange-500">¥{{ totalCost.toLocaleString() }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">总毛利</div><div class="text-2xl font-semibold text-green-500">¥{{ totalProfit.toLocaleString() }}</div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">成本单号</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">关联订单</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">成本项数</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">总成本</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">报价</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">毛利</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.costNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text-secondary">{{ item.orderId || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.items.length }} 项</td>
              <td class="px-4 py-3 text-sm text-apple-text">¥{{ item.totalCost.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">¥{{ (item.quotedPrice || 0).toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm font-medium" :class="(item.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'">¥{{ (item.profit || 0).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button>
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
import TopBar from '@/components/TopBar.vue'
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
const statusClass = (s: string) => ({ draft: 'bg-gray-100 text-gray-600', confirmed: 'bg-green-100 text-green-700', archived: 'bg-blue-100 text-blue-700' }[s] || 'bg-gray-100 text-gray-600')
const goToNew = () => router.push('/costs/new')
const goToEdit = (id: string) => router.push(`/costs/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeCostSheet(id) }
onMounted(() => business.loadCostSheets())
</script>
