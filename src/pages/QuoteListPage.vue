<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar title="报价/撮合管理" />
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <input v-model="search" type="text" placeholder="搜索报价单号/客户/货物..." class="px-4 py-2 rounded-lg border border-apple-border bg-white text-sm w-64 focus:outline-none focus:ring-2 focus:ring-apple-blue/30" />
          <select v-model="filterStatus" class="px-3 py-2 rounded-lg border border-apple-border bg-white text-sm focus:outline-none">
            <option value="">全部状态</option>
            <option v-for="(meta, key) in QUOTE_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
          </select>
        </div>
        <button @click="goToNew" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">+ 新增报价</button>
      </div>
      <div class="grid grid-cols-4 gap-4 mb-6">
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">报价总数</div><div class="text-2xl font-semibold text-apple-text">{{ business.quotes.length }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">协商中</div><div class="text-2xl font-semibold text-orange-500">{{ negotiatingCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">已接受</div><div class="text-2xl font-semibold text-green-500">{{ acceptedCount }}</div></div>
        <div class="bg-white rounded-xl p-4 shadow-sm"><div class="text-apple-text-secondary text-xs mb-1">报价总额</div><div class="text-2xl font-semibold text-apple-blue">¥{{ totalPrice.toLocaleString() }}</div></div>
      </div>
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-bg border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">报价单号</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">客户</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">关联询价</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">报价项</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">最终价</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">状态</th>
              <th class="text-left px-4 py-3 text-xs font-medium text-apple-text-secondary">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-bg/50">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.quoteNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text-secondary">{{ item.inquiryId || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.items.length }} 项</td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ (item.finalPrice || 0).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :style="{ color: QUOTE_STATUS_META[item.status]?.color, backgroundColor: QUOTE_STATUS_META[item.status]?.bg }">{{ QUOTE_STATUS_META[item.status]?.label }}</span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(item.id)" class="text-red-500 text-sm hover:underline">删除</button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredList.length === 0"><td colspan="7" class="px-4 py-12 text-center text-apple-text-secondary">暂无报价数据</td></tr>
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
import { QUOTE_STATUS_META } from '@/types'
const router = useRouter()
const business = useBusinessStore()
const search = ref('')
const filterStatus = ref('')
const filteredList = computed(() => business.quotes.filter((q) => {
  const matchSearch = !search.value || q.quoteNo.includes(search.value) || q.customerName.includes(search.value)
  const matchStatus = !filterStatus.value || q.status === filterStatus.value
  return matchSearch && matchStatus
}))
const negotiatingCount = computed(() => business.quotes.filter((q) => q.status === 'negotiating').length)
const acceptedCount = computed(() => business.quotes.filter((q) => q.status === 'accepted').length)
const totalPrice = computed(() => business.quotes.reduce((s, q) => s + (q.finalPrice || 0), 0))
const goToNew = () => router.push('/quotes/new')
const goToEdit = (id: string) => router.push(`/quotes/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeQuote(id) }
onMounted(() => business.loadQuotes())
</script>
