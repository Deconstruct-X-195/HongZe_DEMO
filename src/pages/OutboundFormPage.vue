<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑出库' : '新增出库'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">出库单号</label><input v-model="form.outboundNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in OUTBOUND_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联订单ID</label><input v-model="form.orderId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联库存批次ID</label><input v-model="form.batchId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">提货信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">提货主体 <span class="text-red-500">*</span></label><input v-model="form.picker" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">联系人</label><input v-model="form.pickerContact" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">联系电话</label><input v-model="form.pickerPhone" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">申请人</label><input v-model="form.applicant" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物与仓储</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">货物名称 <span class="text-red-500">*</span></label><input v-model="form.cargoName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">品类</label><input v-model="form.cargoType" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">计划数量(吨) <span class="text-red-500">*</span></label><input v-model.number="form.plannedQty" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">实际数量(吨)</label><input v-model.number="form.actualQty" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">仓库/堆场 <span class="text-red-500">*</span></label><input v-model="form.warehouse" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">库位/堆位</label><input v-model="form.location" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与付款</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车牌号</label><input v-model="form.vehicleNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机姓名</label><input v-model="form.driverName" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机电话</label><input v-model="form.driverPhone" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">是否需要付款</label><select v-model="form.paymentRequired" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option :value="true">是</option><option :value="false">否</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">付款是否已核实</label><select v-model="form.paymentVerified" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option :value="true">是</option><option :value="false">否</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">应付金额(元)</label><input v-model.number="form.paymentAmount" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建出库' }}</button>
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
