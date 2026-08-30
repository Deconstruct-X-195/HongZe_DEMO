<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑运输记录' : '新增运输记录'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">关联派单ID</label><input v-model="form.dispatchId" type="text" class="field-input" /></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" /></div>
            <div><label class="field-label">数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.cargoQty" type="number" required class="field-input" /></div>
            <div><label class="field-label">起运地</label><input v-model="form.origin" type="text" class="field-input" /></div>
            <div><label class="field-label">目的地</label><input v-model="form.destination" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">车辆与司机</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">车牌号/车次</label><input v-model="form.vehicleNo" type="text" class="field-input" /></div>
            <div><label class="field-label">司机姓名</label><input v-model="form.driverName" type="text" class="field-input" /></div>
            <div><label class="field-label">司机电话</label><input v-model="form.driverPhone" type="text" class="field-input" /></div>
            <div><label class="field-label">承运方</label><input v-model="form.carrier" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">时间节点</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">装车时间</label><input v-model="form.loadingTime" type="datetime-local" class="field-input" /></div>
            <div><label class="field-label">发车时间</label><input v-model="form.departureTime" type="datetime-local" class="field-input" /></div>
            <div><label class="field-label">到达时间</label><input v-model="form.arrivalTime" type="datetime-local" class="field-input" /></div>
            <div><label class="field-label">卸车时间</label><input v-model="form.unloadingTime" type="datetime-local" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">损耗与状态</h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="field-label">损耗数量(吨)</label>
              <input v-model.number="form.lossQty" type="number" min="0" class="field-input" :data-error="!!lossQtyError" />
              <p v-if="lossQtyError" class="text-[11px] text-apple-red mt-1">{{ lossQtyError }}</p>
            </div>
            <div>
              <label class="field-label">损耗率(%)</label>
              <input v-model.number="form.lossRate" type="number" step="0.01" min="0" max="100" class="field-input" :data-error="!!lossRateError" />
              <p v-if="lossRateError" class="text-[11px] text-apple-red mt-1">{{ lossRateError }}</p>
            </div>
            <div><label class="field-label">跟单员</label><input v-model="form.tracker" type="text" class="field-input" /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in TRANSPORT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建运输记录' }}</button>
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
import { TRANSPORT_STATUS_META } from '@/types'
import { percentError, nonNegativeError } from '@/lib/validators'
import type { TransportRecord } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<TransportRecord>>({ dispatchId: '', orderId: '', cargoName: '', cargoQty: 0, origin: '', destination: '', vehicleNo: '', driverName: '', driverPhone: '', carrier: '', loadingTime: '', departureTime: '', arrivalTime: '', unloadingTime: '', lossQty: 0, lossRate: 0, tracker: '', status: 'pending', nodes: [], remark: '' })

/* ---------- 客观事实范围校验 ---------- */
const lossQtyError = computed(() => {
  const base = nonNegativeError(form.value.lossQty)
  if (base) return base
  if ((form.value.lossQty || 0) > (form.value.cargoQty || 0)) return '损耗数量不能超过运输数量'
  return null
})
const lossRateError = computed(() => percentError(form.value.lossRate))

const handleSubmit = () => {
  if (lossQtyError.value || lossRateError.value) return
  if (isEdit.value) business.updateTransportRecord(itemId.value, form.value); else business.addTransportRecord(form.value); router.push('/transport') }
onMounted(() => { business.loadTransportRecords(); if (isEdit.value) { const item = business.transportRecords.find((t) => t.id === itemId.value); if (item) form.value = { ...item } } })
</script>
