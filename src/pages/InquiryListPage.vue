<template>
  <div class="animate-fade-in">
<PageHeader title="询价管理" />
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索询价单号/客户/货物..." class="field-input py-2 w-64" />
          <select v-model="filterStatus" class="field-input py-2 w-auto">
            <option value="">全部状态</option>
            <option v-for="(meta, key) in INQUIRY_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <button @click="goToNew" class="btn-primary">新增询价</button>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">询价总数</div><div class="text-xl font-semibold tabular-nums text-apple-text">{{ business.inquiries.length }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">待处理</div><div class="text-xl font-semibold tabular-nums text-apple-orange">{{ pendingCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">方案中</div><div class="text-xl font-semibold tabular-nums text-apple-purple">{{ inPlanCount }}</div></div>
        <div class="card px-4 py-3.5"><div class="text-apple-tertiary text-[11px] mb-1">已成交</div><div class="text-xl font-semibold tabular-nums text-apple-green">{{ closedCount }}</div></div>
      </div>

      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">询价单号</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">客户</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">货物</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">数量(吨)</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">运输方式</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">起→终</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredInquiries" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10 transition-colors">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.inquiryNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}<span v-if="item.cargoType" class="text-apple-text-secondary ml-1">({{ item.cargoType }})</span></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3"><Badge :label="TRANSPORT_MODE_META[item.transportMode]?.label" :color="TRANSPORT_MODE_META[item.transportMode]?.color" :bg="TRANSPORT_MODE_META[item.transportMode]?.color + '20'" /></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3"><Badge :label="INQUIRY_STATUS_META[item.status]?.label" :color="INQUIRY_STATUS_META[item.status]?.color" :bg="INQUIRY_STATUS_META[item.status]?.bg" /></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button></div></td>
            </tr>
            <tr v-if="filteredInquiries.length === 0"><td colspan="8" class="px-4 py-12 text-center text-apple-text-secondary">暂无询价数据</td></tr>
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
import { INQUIRY_STATUS_META, TRANSPORT_MODE_META } from '@/types'

const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')

const filteredInquiries = computed(() => business.inquiries.filter((i) => {
  const matchSearch = !search.value || i.inquiryNo.includes(search.value) || i.customerName.includes(search.value) || i.cargoName.includes(search.value)
  const matchStatus = !filterStatus.value || i.status === filterStatus.value
  return matchSearch && matchStatus
}))

const pendingCount = computed(() => business.inquiries.filter((i) => ['draft', 'submitted', 'received'].includes(i.status)).length)
const inPlanCount = computed(() => business.inquiries.filter((i) => i.status === 'in_plan').length)
const closedCount = computed(() => business.inquiries.filter((i) => i.status === 'closed').length)

const goToNew = () => router.push('/inquiries/new')
const goToEdit = (id: string) => router.push(`/inquiries/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeInquiry(id) }

onMounted(() => business.loadInquiries())
</script>
