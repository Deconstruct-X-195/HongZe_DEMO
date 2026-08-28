<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑派单' : '新增派单'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">派单号</label><input v-model="form.dispatchNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">派单类型</label><select v-model="form.type" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in DISPATCH_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">关联订单ID</label><input v-model="form.orderId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in DISPATCH_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物与运输</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">货物名称 <span class="text-red-500">*</span></label><input v-model="form.cargoName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">数量(吨) <span class="text-red-500">*</span></label><input v-model.number="form.cargoQty" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">起运地 <span class="text-red-500">*</span></label><input v-model="form.origin" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">目的地 <span class="text-red-500">*</span></label><input v-model="form.destination" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">计划发运日期</label><input v-model="form.plannedDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">调度员</label><input v-model="form.dispatcher" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6" v-if="form.type === 'rail'">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">铁路信息(95306)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">发货人</label><input v-model="form.railShipper" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">收货人</label><input v-model="form.railConsignee" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车次</label><input v-model="form.railTrainNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车数</label><input v-model.number="form.railWagonCount" type="number" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6" v-if="form.type === 'road'">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">公路信息(万和)</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车牌号</label><input v-model="form.roadVehicleNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机姓名</label><input v-model="form.roadDriverName" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">司机电话</label><input v-model="form.roadDriverPhone" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">车队/承运方</label><input v-model="form.roadFleet" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
          </div>
        </div>
        <div class="mb-6"><label class="block text-sm font-medium text-apple-text mb-1.5">备注</label><textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600">{{ isEdit ? '保存修改' : '创建派单' }}</button>
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
