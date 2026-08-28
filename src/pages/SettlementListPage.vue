<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="结算中心" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索结算单号/付款方/收款方..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm"><option value="">全部状态</option><option v-for="(meta, key) in SETTLEMENT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">+ 新增结算</button>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">结算总数</div><div class="text-2xl font-semibold text-apple-text">{{ business.settlements.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">待结算</div><div class="text-2xl font-semibold text-orange-500">{{ pendingCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已开票</div><div class="text-2xl font-semibold text-purple-500">{{ invoicedCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">结算总额</div><div class="text-2xl font-semibold text-green-500">¥{{ totalAmount.toLocaleString() }}</div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">结算单号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">付款方</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">收款方</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">金额</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">发票号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.settlementNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.payer }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.payee }}</td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.totalAmount.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.invoiceNo || '-' }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: SETTLEMENT_STATUS_META[item.status]?.color, backgroundColor: SETTLEMENT_STATUS_META[item.status]?.bg }">{{ SETTLEMENT_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无结算数据</td></tr>
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
import { SETTLEMENT_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredList = computed(() => business.settlements.filter((s) => {
  const matchSearch = !search.value || s.settlementNo.includes(search.value) || s.payer.includes(search.value) || s.payee.includes(search.value)
  const matchStatus = !filterStatus.value || s.status === filterStatus.value
  return matchSearch && matchStatus
}))
const pendingCount = computed(() => business.settlements.filter((s) => ['pending', 'calculating'].includes(s.status)).length)
const invoicedCount = computed(() => business.settlements.filter((s) => s.status === 'invoiced').length)
const totalAmount = computed(() => business.settlements.reduce((sum, s) => sum + s.totalAmount, 0))
const goToNew = () => router.push('/settlement/new')
const goToEdit = (id: string) => router.push(`/settlement/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeSettlement(id) }
onMounted(() => business.loadSettlements())
</script>
