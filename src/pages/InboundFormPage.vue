<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑入库' : '新增入库'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">入库单号</label><input v-model="form.inboundNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in INBOUND_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">关联派单ID</label><input v-model="form.dispatchId" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" /></div>
            <div><label class="field-label">品类</label><input v-model="form.cargoType" type="text" class="field-input" /></div>
            <div><label class="field-label">品质</label><input v-model="form.cargoQuality" type="text" class="field-input" /></div>
            <div><label class="field-label">计划数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.plannedQty" type="number" required class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与仓储</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">车牌号/车次</label><input v-model="form.vehicleNo" type="text" class="field-input" /></div>
            <div><label class="field-label">司机姓名</label><input v-model="form.driverName" type="text" class="field-input" /></div>
            <div><label class="field-label">仓库/堆场 <span class="text-apple-red">*</span></label><input v-model="form.warehouse" type="text" required class="field-input" /></div>
            <div><label class="field-label">库位/堆位</label><input v-model="form.location" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">计量信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">毛重(吨)</label><input v-model.number="form.grossWeight" type="number" step="0.01" class="field-input" /></div>
            <div><label class="field-label">皮重(吨)</label><input v-model.number="form.tareWeight" type="number" step="0.01" class="field-input" /></div>
            <div><label class="field-label">净重(吨)</label><input v-model.number="form.netWeight" type="number" step="0.01" class="field-input" /></div>
            <div><label class="field-label">实际入库数量(吨)</label><input v-model.number="form.actualQty" type="number" step="0.01" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建入库' }}</button>
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
import { INBOUND_STATUS_META } from '@/types'
import type { Inbound, InboundStatus } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Inbound>>({ inboundNo: '', orderId: '', dispatchId: '', cargoName: '', cargoType: '', cargoQuality: '', plannedQty: 0, vehicleNo: '', driverName: '', warehouse: '', location: '', grossWeight: 0, tareWeight: 0, netWeight: 0, actualQty: 0, status: 'pending' as InboundStatus, remark: '' })
const handleSubmit = () => { if (isEdit.value) business.updateInbound(itemId.value, form.value); else business.addInbound(form.value); router.push('/inbound') }
onMounted(() => { business.loadInbounds(); if (isEdit.value) { const item = business.inbounds.find((i) => i.id === itemId.value); if (item) form.value = { ...item } } })
</script>
