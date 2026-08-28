<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑报价' : '新增报价'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">报价单号</label><input v-model="form.quoteNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in QUOTE_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联询价ID</label><input v-model="form.inquiryId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联订单ID</label><input v-model="form.orderId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户ID</label><input v-model="form.customerId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户名称 <span class="text-red-500">*</span></label><input v-model="form.customerName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">最终成交价</label><input v-model.number="form.finalPrice" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">报价有效期</label><input v-model="form.validUntil" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">业务员</label><input v-model="form.salesperson" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">成本合计</label><input v-model.number="form.costTotal" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">毛利</label><input v-model.number="form.profitTotal" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">报价项（多通道对比）</h3>
          <div class="space-y-3">
            <div v-for="(item, idx) in form.items" :key="idx" class="p-3 border border-apple-border rounded-lg bg-apple-bg/30">
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">通道/线路</label><input v-model="item.channel" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">运输方式</label><input v-model="item.transportMode" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">时效(天)</label><input v-model.number="item.transitDays" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">单价(元/吨)</label><input v-model.number="item.unitPrice" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">总价</label><input v-model.number="item.totalPrice" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-xs font-medium text-apple-text-secondary mb-1">日运量(吨)</label><input v-model.number="item.capacity" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
              </div>
              <div class="mt-2"><label class="block text-xs font-medium text-apple-text-secondary mb-1">备注</label><input v-model="item.remark" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
              <button type="button" @click="removeItem(idx)" class="mt-2 text-xs text-red-500 hover:underline">删除此项</button>
            </div>
          </div>
          <button type="button" @click="addItem" class="mt-3 px-3 py-1.5 text-sm text-apple-blue border border-apple-blue/30 rounded-lg hover:bg-apple-blue/5">+ 添加报价项</button>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建报价' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopBar from '@/components/TopBar.vue'
import { useBusinessStore } from '@/stores'
import { QUOTE_STATUS_META } from '@/types'
import type { Quote, QuoteStatus, QuoteItem } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Quote>>({ quoteNo: '', inquiryId: '', orderId: '', customerId: '', customerName: '', items: [], finalPrice: 0, validUntil: '', salesperson: '', costTotal: 0, profitTotal: 0, status: 'draft' as QuoteStatus, remark: '' })
const addItem = () => {
  const newItem: QuoteItem = { id: `item_${Date.now()}`, channel: '', transportMode: '', transitDays: 0, unitPrice: 0, totalPrice: 0, capacity: 0, remark: '' }
  form.value.items = [...(form.value.items || []), newItem]
}
const removeItem = (idx: number) => {
  form.value.items = (form.value.items || []).filter((_, i) => i !== idx)
}
const handleSubmit = () => { if (isEdit.value) business.updateQuote(itemId.value, form.value); else business.addQuote(form.value); router.push('/quotes') }
onMounted(() => { business.loadQuotes(); if (isEdit.value) { const item = business.quotes.find((q) => q.id === itemId.value); if (item) form.value = { ...item } } })
</script>
