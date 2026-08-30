<template>
  <div class="animate-fade-in">
<PageHeader title="结算中心" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索结算单号/付款方/收款方..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto"><option value="">全部状态</option><option v-for="(meta, key) in SETTLEMENT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select>
        </div>
        <button @click="goToNew" class="btn-primary">新增结算</button>
      </div>
      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">结算总数</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.settlements.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">待结算</div><div class="text-xl font-semibold tabular-nums text-apple-orange">{{ pendingCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已开票</div><div class="text-xl font-semibold tabular-nums text-apple-purple">{{ invoicedCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">结算总额</div><div class="text-xl font-semibold tabular-nums text-apple-green">¥{{ totalAmount.toLocaleString() }}</div></div>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border"><tr><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">结算单号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">付款方</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">收款方</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">金额</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">发票号</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th><th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th></tr></thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.settlementNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.payer }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.payee }}</td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ item.totalAmount.toLocaleString() }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.invoiceNo || '-' }}</td>
              <td class="px-4 py-3"><Badge :label="SETTLEMENT_STATUS_META[item.status]?.label" :color="SETTLEMENT_STATUS_META[item.status]?.color" :bg="SETTLEMENT_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
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
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
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
