<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑接货' : '新增接货'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">接货单号</label><input v-model="form.receiptNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in RECEIPT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联订单ID</label><input v-model="form.orderId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户ID</label><input v-model="form.customerId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户名称</label><input v-model="form.customerName" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">接货地点 <span class="text-red-500">*</span></label><input v-model="form.location" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="港口/货源地" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">仓库/堆场</label><input v-model="form.warehouse" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">货物名称 <span class="text-red-500">*</span></label><input v-model="form.cargoName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">品类</label><input v-model="form.cargoType" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">品质</label><input v-model="form.cargoQuality" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">计划数量(吨) <span class="text-red-500">*</span></label><input v-model.number="form.plannedQty" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">实际数量(吨)</label><input v-model.number="form.actualQty" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">差异数量(吨)</label><input v-model.number="form.difference" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">交接双方</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">交货方(货主/上游)</label><input v-model="form.consignor" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">交货方联系人</label><input v-model="form.consignorContact" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">接货人</label><input v-model="form.receiver" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">接货人联系方式</label><input v-model="form.receiverContact" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与时间</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车牌号/车次</label><input v-model="form.vehicleNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机姓名</label><input v-model="form.driverName" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机电话</label><input v-model="form.driverPhone" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">计划接货日期</label><input v-model="form.plannedDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">实际接货日期</label><input v-model="form.actualDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建接货单' }}</button>
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
import { RECEIPT_STATUS_META } from '@/types'
import type { Receipt, ReceiptStatus } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Receipt>>({ receiptNo: '', orderId: '', customerId: '', customerName: '', cargoName: '', cargoType: '', cargoQuality: '', plannedQty: 0, actualQty: 0, difference: 0, location: '', warehouse: '', consignor: '', consignorContact: '', receiver: '', receiverContact: '', vehicleNo: '', driverName: '', driverPhone: '', plannedDate: '', actualDate: '', status: 'pending' as ReceiptStatus, remark: '' })
const handleSubmit = () => { if (isEdit.value) business.updateReceipt(itemId.value, form.value); else business.addReceipt(form.value); router.push('/receipts') }
onMounted(() => { business.loadReceipts(); if (isEdit.value) { const item = business.receipts.find((r) => r.id === itemId.value); if (item) form.value = { ...item } } })
</script>
