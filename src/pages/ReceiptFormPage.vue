<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑接货' : '新增接货'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">接货单号</label><input v-model="form.receiptNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in RECEIPT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">客户ID</label><input v-model="form.customerId" type="text" class="field-input" /></div>
            <div><label class="field-label">客户名称</label><input v-model="form.customerName" type="text" class="field-input" /></div>
            <div><label class="field-label">接货地点 <span class="text-apple-red">*</span></label><input v-model="form.location" type="text" required class="field-input" placeholder="港口/货源地" /></div>
            <div><label class="field-label">仓库/堆场</label><input v-model="form.warehouse" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" /></div>
            <div><label class="field-label">品类</label><input v-model="form.cargoType" type="text" class="field-input" /></div>
            <div><label class="field-label">品质</label><input v-model="form.cargoQuality" type="text" class="field-input" /></div>
            <div><label class="field-label">计划数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.plannedQty" type="number" required class="field-input" /></div>
            <div><label class="field-label">实际数量(吨)</label><input v-model.number="form.actualQty" type="number" class="field-input" /></div>
            <div><label class="field-label">差异数量(吨)</label><input v-model.number="form.difference" type="number" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">交接双方</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">交货方(货主/上游)</label><input v-model="form.consignor" type="text" class="field-input" /></div>
            <div><label class="field-label">交货方联系人</label><input v-model="form.consignorContact" type="text" class="field-input" /></div>
            <div><label class="field-label">接货人</label><input v-model="form.receiver" type="text" class="field-input" /></div>
            <div><label class="field-label">接货人联系方式</label><input v-model="form.receiverContact" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与时间</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">车牌号/车次</label><input v-model="form.vehicleNo" type="text" class="field-input" /></div>
            <div><label class="field-label">司机姓名</label><input v-model="form.driverName" type="text" class="field-input" /></div>
            <div><label class="field-label">司机电话</label><input v-model="form.driverPhone" type="text" class="field-input" /></div>
            <div><label class="field-label">计划接货日期</label><input v-model="form.plannedDate" type="date" class="field-input" /></div>
            <div><label class="field-label">实际接货日期</label><input v-model="form.actualDate" type="date" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建接货单' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PageHeader from '@/components/PageHeader.vue'
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
