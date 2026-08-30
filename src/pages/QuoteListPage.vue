<template>
  <div class="animate-fade-in">
<PageHeader title="报价撮合" subtitle="根据客户询价编制运输报价，发送客户确认后成交生成订单。" />
    <div class="space-y-5">
      <!-- 摘要条（单行，替代大统计卡） -->
      <div class="card px-5 py-3 flex items-center gap-5 flex-wrap">
        <div class="flex items-baseline gap-1.5">
          <span class="text-lg font-bold text-apple-text tabular-nums">{{ business.quotes.length }}</span>
          <span class="text-xs text-apple-subtext">条报价</span>
        </div>
        <div class="w-px h-6 bg-apple-border/70"></div>
        <div class="flex items-baseline gap-1.5">
          <span class="text-lg font-bold text-apple-orange tabular-nums">{{ negotiatingCount }}</span>
          <span class="text-xs text-apple-subtext">条协商中</span>
        </div>
        <div class="w-px h-6 bg-apple-border/70"></div>
        <div class="flex items-baseline gap-1.5">
          <span class="text-lg font-bold text-apple-green tabular-nums">{{ acceptedCount }}</span>
          <span class="text-xs text-apple-subtext">条已成交</span>
        </div>
        <button @click="goToNew" class="btn-primary ml-auto text-xs">
          <Icon name="plus" :size="14" />
          新增报价
        </button>
      </div>
      <div class="flex items-center gap-3">
        <input v-model="search" type="text" placeholder="搜索报价单号/客户..." class="field-input py-2 w-64" />
        <select v-model="filterStatus" class="field-input py-2 w-auto">
          <option value="">全部状态</option>
          <option v-for="(meta, key) in QUOTE_STATUS_META" :key="key" :value="key">{{ meta.label }}</option>
        </select>
      </div>
      <div class="card overflow-hidden">
        <table class="w-full">
          <thead class="bg-apple-fill/40 border-b border-apple-border">
            <tr>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">报价单号</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">客户</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">关联询价</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">报价项</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">最终价</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">状态</th>
              <th class="text-left px-4 py-3 text-[11px] font-medium text-apple-tertiary tracking-wide">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredList" :key="item.id" class="border-b border-apple-border last:border-0 hover:bg-apple-hover/10">
              <td class="px-4 py-3 font-medium text-apple-text">{{ item.quoteNo }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.customerName }}</td>
              <td class="px-4 py-3 text-sm text-apple-text-secondary">{{ item.inquiryId || '-' }}</td>
              <td class="px-4 py-3 text-sm text-apple-text">{{ item.items.length }} 项</td>
              <td class="px-4 py-3 text-sm text-apple-text font-medium">¥{{ (item.finalPrice || 0).toLocaleString() }}</td>
              <td class="px-4 py-3">
                <Badge :label="QUOTE_STATUS_META[item.status]?.label" :color="QUOTE_STATUS_META[item.status]?.color" :bg="QUOTE_STATUS_META[item.status]?.bg" />
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <button v-if="item.status === 'draft'" @click="sendToCustomer(item.id)" class="text-apple-blue text-sm hover:underline">发送客户</button>
                  <RouterLink v-if="item.orderId" :to="`/orders/${item.orderId}`" class="text-apple-green text-sm hover:underline">查看订单</RouterLink>
                  <button @click="goToEdit(item.id)" class="text-apple-blue text-sm hover:underline">编辑</button>
                  <button @click="handleDelete(item.id)" class="text-apple-red text-sm hover:underline">删除</button>
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
import { useRouter, RouterLink } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import Icon from '@/components/Icon.vue'
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
const goToNew = () => router.push('/quotes/new')
const goToEdit = (id: string) => router.push(`/quotes/${id}/edit`)
const handleDelete = (id: string) => { if (confirm('确定删除？')) business.removeQuote(id) }

/** 发送客户：报价进入协商，客户可在门户查看并接受；关联询价推进为已报价 */
function sendToCustomer(id: string) {
  const q = business.quotes.find((x) => x.id === id)
  if (!q) return
  business.updateQuote(id, { status: 'negotiating' })
  // 兼容历史数据：关联值可能是询价 id 或询价编号
  const inquiry = business.inquiries.find((i) => i.id === q.inquiryId || i.inquiryNo === q.inquiryId)
  if (inquiry && (inquiry.status === 'received' || inquiry.status === 'in_plan' || inquiry.status === 'submitted')) {
    business.updateInquiry(inquiry.id, { status: 'quoted' })
  }
}
onMounted(() => { business.loadQuotes(); business.loadInquiries() })
</script>
