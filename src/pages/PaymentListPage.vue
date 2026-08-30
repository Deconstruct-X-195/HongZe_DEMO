<template>
  <div class="animate-fade-in">
<PageHeader title="付款管理" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索付款单号/客户..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto"><option value="">全部状态</option><option v-for="(meta, key) in PAYMENT_RECORD_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="btn-primary">新增付款</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">付款总数</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.payments.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">待付款</div><div class="text-xl font-semibold tabular-nums text-apple-orange">{{ pendingCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已付款</div><div class="text-xl font-semibold tabular-nums text-apple-green">{{ paidCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">收款总额</div><div class="text-xl font-semibold tabular-nums text-apple-blue">¥{{ totalAmount.toLocaleString() }}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">付款单号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">客户</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">类型</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">金额</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">方式</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredPayments" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.paymentNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3"><Badge :label="PAYMENT_TYPE_META[item.type]?.label" :color="PAYMENT_TYPE_META[item.type]?.color" :bg="PAYMENT_TYPE_META[item.type]?.color + '20'" /></td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.amount.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ PAYMENT_METHOD_META[item.method]?.label }}</td>
              <td class="px-4 py-3"><Badge :label="PAYMENT_RECORD_STATUS_META[item.status]?.label" :color="PAYMENT_RECORD_STATUS_META[item.status]?.color" :bg="PAYMENT_RECORD_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
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
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
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
