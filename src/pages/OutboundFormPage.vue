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
            <div>
              <label class="field-label">关联货物批次</label>
              <select v-model="form.cargoBatchId" class="field-input">
                <option value="">不关联批次</option>
                <option v-for="b in orderBatches" :key="b.id" :value="b.id">{{ b.batchNo }}（库存 {{ batchStock(b) }}吨 / 已出库 {{ b.outboundQty }}吨）</option>
              </select>
              <p class="text-[9px] text-apple-subtext mt-0.5">选择批次后，保存时将自动校验并累加批次的出库量</p>
            </div>
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
        <p v-if="submitError" class="mb-4 text-xs text-apple-red">{{ submitError }}</p>
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
import type { Outbound, OutboundStatus, CargoBatch } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<Outbound>>({ outboundNo: '', orderId: '', cargoBatchId: '', batchId: '', picker: '', pickerContact: '', pickerPhone: '', applicant: '', cargoName: '', cargoType: '', plannedQty: 0, actualQty: 0, warehouse: '', location: '', vehicleNo: '', driverName: '', driverPhone: '', paymentRequired: false, paymentVerified: false, paymentAmount: 0, status: 'pending' as OutboundStatus, remark: '' })
// 当前订单下的可选货物批次（V3 批次模型）
const orderBatches = computed(() => business.cargoBatches.filter((b) => b.orderId === form.value.orderId))
function batchStock(b: CargoBatch): number {
  return b.inboundQty - b.outboundQty
}
const submitError = ref('')
const handleSubmit = () => {
  submitError.value = ''
  if (!isEdit.value) {
    const created = business.addOutbound(form.value)
    // 数量联动：出库量自动累加到货物批次，校验出库量 ≤ 库存量
    if (created.cargoBatchId) {
      const qty = created.actualQty || created.plannedQty || 0
      const ok = business.registerBatchOutbound(created.cargoBatchId, qty)
      if (!ok) {
        submitError.value = '批次出库量登记失败：出库量不得超过批次库存量（累计入库-累计出库），单据已保存但未挂载批次'
        return
      }
    }
  } else {
    business.updateOutbound(itemId.value, form.value)
  }
  router.push('/outbound')
}
onMounted(() => {
  business.loadOutbounds()
  business.loadCargoBatches()
  if (isEdit.value) { const item = business.outbounds.find((o) => o.id === itemId.value); if (item) form.value = { ...item } }
})
</script>
