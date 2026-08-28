<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="财务工作台 - 付款管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索付款单号/客户..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm focus:outline-none"><option value="">全部状态</option><option v-for="(meta, key) in PAYMENT_RECORD_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">+ 新增付款</button>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">付款总数</div><div class="text-2xl font-semibold text-apple-text">{{ business.payments.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">待付款</div><div class="text-2xl font-semibold text-orange-500">{{ pendingCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已付款</div><div class="text-2xl font-semibold text-green-500">{{ paidCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">收款总额</div><div class="text-2xl font-semibold text-apple-blue">¥{{ totalAmount.toLocaleString() }}</div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">付款单号</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">客户</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">类型</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">金额</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">方式</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th><th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredPayments" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.paymentNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: PAYMENT_TYPE_META[item.type]?.color, backgroundColor: PAYMENT_TYPE_META[item.type]?.color + '20' }">{{ PAYMENT_TYPE_META[item.type]?.label }}</span></td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.amount.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ PAYMENT_METHOD_META[item.method]?.label }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: PAYMENT_RECORD_STATUS_META[item.status]?.color, backgroundColor: PAYMENT_RECORD_STATUS_META[item.status]?.bg }">{{ PAYMENT_RECORD_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredPayments.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无付款数据</td></tr>
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
import { PAYMENT_RECORD_STATUS_META, PAYMENT_TYPE_META, PAYMENT_METHOD_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredPayments = computed(() => business.payments.filter((p) => {
  const matchSearch = !search.value || p.paymentNo.includes(search.value) || p.customerName.includes(search.value)
  const matchStatus = !filterStatus.value || p.status === filterStatus.value
  return matchSearch && matchStatus
}))
const pendingCount = computed(() => business.payments.filter((p) => p.status === 'pending').length)
const paidCount = computed(() => business.payments.filter((p) => p.status === 'paid').length)
const totalAmount = computed(() => business.payments.reduce((s, p) => s + p.amount, 0))
const goToNew = () => router.push('/payments/new')
const goToEdit = (id: string) => router.push(`/payments/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removePayment(id) }
onMounted(() => business.loadPayments())
</script>
