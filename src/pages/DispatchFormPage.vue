<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑派单' : '新增派单'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">派单号</label><input v-model="form.dispatchNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">派单类型</label><select v-model="form.type" class="field-input"><option v-for="(meta, key) in DISPATCH_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in DISPATCH_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物与运输</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" /></div>
            <div><label class="field-label">数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.cargoQty" type="number" required class="field-input" /></div>
            <div><label class="field-label">起运地 <span class="text-apple-red">*</span></label><input v-model="form.origin" type="text" required class="field-input" /></div>
            <div><label class="field-label">目的地 <span class="text-apple-red">*</span></label><input v-model="form.destination" type="text" required class="field-input" /></div>
            <div><label class="field-label">计划发运日期</label><input v-model="form.plannedDate" type="date" class="field-input" /></div>
            <div><label class="field-label">调度员</label><input v-model="form.dispatcher" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6" v-if="form.type === 'rail'">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">铁路信息(95306)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">发货人</label><input v-model="form.railShipper" type="text" class="field-input" /></div>
            <div><label class="field-label">收货人</label><input v-model="form.railConsignee" type="text" class="field-input" /></div>
            <div><label class="field-label">车次</label><input v-model="form.railTrainNo" type="text" class="field-input" /></div>
            <div><label class="field-label">车数</label><input v-model.number="form.railWagonCount" type="number" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6" v-if="form.type === 'road'">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">公路信息(万和)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">车牌号</label><input v-model="form.roadVehicleNo" type="text" class="field-input" /></div>
            <div><label class="field-label">司机姓名</label><input v-model="form.roadDriverName" type="text" class="field-input" /></div>
            <div><label class="field-label">司机电话</label><input v-model="form.roadDriverPhone" type="text" class="field-input" /></div>
            <div><label class="field-label">车队/承运方</label><input v-model="form.roadFleet" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建派单' }}</button>
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
import { DISPATCH_STATUS_META, DISPATCH_TYPE_META } from '@/types'
import type { Dispatch, DispatchStatus, DispatchType } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Dispatch>>({ dispatchNo: '', orderId: '', type: 'rail' as DispatchType, cargoName: '', cargoQty: 0, origin: '', destination: '', plannedDate: '', dispatcher: '', status: 'draft' as DispatchStatus, remark: '' })
const handleSubmit = () => { if (isEdit.value) business.updateDispatch(itemId.value, form.value); else business.addDispatch(form.value); router.push('/dispatch') }
onMounted(() => { business.loadDispatches(); if (isEdit.value) { const item = business.dispatches.find((d) => d.id === itemId.value); if (item) form.value = { ...item } } })
</script>
