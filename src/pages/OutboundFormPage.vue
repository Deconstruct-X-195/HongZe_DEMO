<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑出库' : '新增出库'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">出库单号</label><input v-model="form.outboundNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in OUTBOUND_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">关联库存批次ID</label><input v-model="form.batchId" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">提货信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">提货主体 <span class="text-apple-red">*</span></label><input v-model="form.picker" type="text" required class="field-input" /></div>
            <div><label class="field-label">联系人</label><input v-model="form.pickerContact" type="text" class="field-input" /></div>
            <div><label class="field-label">联系电话</label><input v-model="form.pickerPhone" type="text" class="field-input" /></div>
            <div><label class="field-label">申请人</label><input v-model="form.applicant" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物与仓储</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" /></div>
            <div><label class="field-label">品类</label><input v-model="form.cargoType" type="text" class="field-input" /></div>
            <div><label class="field-label">计划数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.plannedQty" type="number" required class="field-input" /></div>
            <div><label class="field-label">实际数量(吨)</label><input v-model.number="form.actualQty" type="number" class="field-input" /></div>
            <div><label class="field-label">仓库/堆场 <span class="text-apple-red">*</span></label><input v-model="form.warehouse" type="text" required class="field-input" /></div>
            <div><label class="field-label">库位/堆位</label><input v-model="form.location" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与付款</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">车牌号</label><input v-model="form.vehicleNo" type="text" class="field-input" /></div>
            <div><label class="field-label">司机姓名</label><input v-model="form.driverName" type="text" class="field-input" /></div>
            <div><label class="field-label">司机电话</label><input v-model="form.driverPhone" type="text" class="field-input" /></div>
            <div><label class="field-label">是否需要付款</label><select v-model="form.paymentRequired" class="field-input"><option :value="true">是</option><option :value="false">否</option></select></div>
            <div><label class="field-label">付款是否已核实</label><select v-model="form.paymentVerified" class="field-input"><option :value="true">是</option><option :value="false">否</option></select></div>
            <div><label class="field-label">应付金额(元)</label><input v-model.number="form.paymentAmount" type="number" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建出库' }}</button>
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
import { OUTBOUND_STATUS_META } from '@/types'
import type { Outbound, OutboundStatus } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Outbound>>({ outboundNo: '', orderId: '', batchId: '', picker: '', pickerContact: '', pickerPhone: '', applicant: '', cargoName: '', cargoType: '', plannedQty: 0, actualQty: 0, warehouse: '', location: '', vehicleNo: '', driverName: '', driverPhone: '', paymentRequired: false, paymentVerified: false, paymentAmount: 0, status: 'pending' as OutboundStatus, remark: '' })
const handleSubmit = () => { if (isEdit.value) business.updateOutbound(itemId.value, form.value); else business.addOutbound(form.value); router.push('/outbound') }
onMounted(() => { business.loadOutbounds(); if (isEdit.value) { const item = business.outbounds.find((o) => o.id === itemId.value); if (item) form.value = { ...item } } })
</script>
