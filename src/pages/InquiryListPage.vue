<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="询价管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索询价单号/客户/货物..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm focus:outline-none">
            <option value="">全部状态</option>
            <option v-for="(meta, key) in INQUIRY_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">+ 新增询价</button>
      </div>

      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">询价总数</div><div class="text-2xl font-semibold text-apple-text">{{ business.inquiries.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">待处理</div><div class="text-2xl font-semibold text-orange-500">{{ pendingCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">方案中</div><div class="text-2xl font-semibold text-purple-500">{{ inPlanCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已成交</div><div class="text-2xl font-semibold text-green-500">{{ closedCount }}</div></div>
      </div>

      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">询价单号</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">客户</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">货物</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">数量(吨)</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">运输方式</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">起→终</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredInquiries" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50 transition-colors">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.inquiryNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoName }}<span v-if="item.cargoType" class="text-apple-text-secondary ml-1">({{ item.cargoType }})</span></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.cargoQty }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: TRANSPORT_MODE_META[item.transportMode]?.color, backgroundColor: TRANSPORT_MODE_META[item.transportMode]?.color + '20' }">{{ TRANSPORT_MODE_META[item.transportMode]?.label }}</span></td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.origin }} → {{ item.destination }}</td>
              <td class="px-4 py-3"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: INQUIRY_STATUS_META[item.status]?.color, backgroundColor: INQUIRY_STATUS_META[item.status]?.bg }">{{ INQUIRY_STATUS_META[item.status]?.label }}</span></td>
              <td class="px-4 py-3"><div class="flex items-center gap-2"><button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button><button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button></div></td>
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
import TopBar from '@/components/TopBar.vue'
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
