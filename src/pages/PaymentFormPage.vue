<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑付款' : '新增付款'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款单号</label><input v-model="form.paymentNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in PAYMENT_RECORD_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">付款信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户ID</label><input v-model="form.customerId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户名称 <span class="text-red-500">*</span></label><input v-model="form.customerName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款类型</label><select v-model="form.type" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in PAYMENT_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款方式</label><select v-model="form.method" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in PAYMENT_METHOD_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">金额(元) <span class="text-red-500">*</span></label><input v-model.number="form.amount" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">币种</label><input v-model="form.currency" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="CNY" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">应付款日期</label><input v-model="form.dueDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">实际付款日期</label><input v-model="form.paidDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">银行信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款方账户</label><input v-model="form.payerAccount" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款方银行</label><input v-model="form.payerBank" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">收款方账户</label><input v-model="form.payeeAccount" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">收款方银行</label><input v-model="form.payeeBank" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建付款' }}</button>
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
import { PAYMENT_RECORD_STATUS_META, PAYMENT_TYPE_META, PAYMENT_METHOD_META } from '@/types'
import type { Payment, PaymentRecordStatus, PaymentType, PaymentMethod } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const paymentId = computed(() => route.params.id as string)
const form = ref<Partial<Payment>>({ paymentNo: '', customerId: '', customerName: '', type: 'prepay' as PaymentType, method: 'bank_transfer' as PaymentMethod, amount: 0, currency: 'CNY', dueDate: '', paidDate: '', payerAccount: '', payerBank: '', payeeAccount: '', payeeBank: '', status: 'pending' as PaymentRecordStatus, remark: '', vouchers: [] })
const handleSubmit = () => { if (isEdit.value) business.updatePayment(paymentId.value, form.value); else business.addPayment(form.value); router.push('/payments') }
onMounted(() => { business.loadPayments(); if (isEdit.value) { const item = business.payments.find((p) => p.id === paymentId.value); if (item) form.value = { ...item } } })
</script>
