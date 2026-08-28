<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑结算' : '新增结算'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">结算单号</label><input v-model="form.settlementNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in SETTLEMENT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联订单ID</label><input v-model="form.orderId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联合同ID</label><input v-model="form.contractId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">结算双方</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款方 <span class="text-red-500">*</span></label><input v-model="form.payer" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">收款方 <span class="text-red-500">*</span></label><input v-model="form.payee" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">金额信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">总金额(元) <span class="text-red-500">*</span></label><input v-model.number="form.totalAmount" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">总税额(元)</label><input v-model.number="form.totalTax" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">价税合计(元)</label><input v-model.number="form.totalWithTax" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">已付金额(元)</label><input v-model.number="form.paidAmount" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">未付金额(元)</label><input v-model.number="form.remainingAmount" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款日期</label><input v-model="form.paidDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">发票信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">发票号</label><input v-model="form.invoiceNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">开票日期</label><input v-model="form.invoiceDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">发票类型</label><input v-model="form.invoiceType" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="增值税专用/普通" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">开票金额(元)</label><input v-model.number="form.invoiceAmount" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">数量核对</h3>
          <div class="grid grid-cols-3 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">计划数量(吨)</label><input v-model.number="form.plannedQty" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">实际数量(吨)</label><input v-model.number="form.actualQty" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">差异数量(吨)</label><input v-model.number="form.differenceQty" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建结算' }}</button>
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
import { SETTLEMENT_STATUS_META } from '@/types'
import type { Settlement, SettlementStatus } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Settlement>>({ settlementNo: '', orderId: '', contractId: '', payer: '', payee: '', totalAmount: 0, totalTax: 0, totalWithTax: 0, paidAmount: 0, remainingAmount: 0, paidDate: '', invoiceNo: '', invoiceDate: '', invoiceType: '', invoiceAmount: 0, plannedQty: 0, actualQty: 0, differenceQty: 0, status: 'pending' as SettlementStatus, remark: '', items: [] })
const handleSubmit = () => { if (isEdit.value) business.updateSettlement(itemId.value, form.value); else business.addSettlement(form.value); router.push('/settlement') }
onMounted(() => { business.loadSettlements(); if (isEdit.value) { const item = business.settlements.find((s) => s.id === itemId.value); if (item) form.value = { ...item } } })
</script>
