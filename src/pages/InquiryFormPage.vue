<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑询价' : '新增询价'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">询价单号</label><input v-model="form.inquiryNo" type="text" class="field-input bg-apple-fill/50" placeholder="自动生成" readonly /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in INQUIRY_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">客户信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">客户ID</label><input v-model="form.customerId" type="text" class="field-input" placeholder="选择客户" /></div>
            <div><label class="field-label">客户名称 <span class="text-apple-red">*</span></label><input v-model="form.customerName" type="text" required class="field-input" placeholder="客户名称" /></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">货物名称 <span class="text-apple-red">*</span></label><input v-model="form.cargoName" type="text" required class="field-input" placeholder="如：铁矿石" /></div>
            <div><label class="field-label">品类</label><input v-model="form.cargoType" type="text" class="field-input" placeholder="如：粉矿/块矿" /></div>
            <div><label class="field-label">品质</label><input v-model="form.cargoQuality" type="text" class="field-input" placeholder="品位/指标" /></div>
            <div><label class="field-label">数量(吨) <span class="text-apple-red">*</span></label><input v-model.number="form.cargoQty" type="number" required class="field-input" placeholder="0" /></div>
            <div><label class="field-label">来源矿山</label><input v-model="form.mine" type="text" class="field-input" placeholder="矿山名称" /></div>
            <div><label class="field-label">现货/期货</label><select v-model="form.isSpot" class="field-input"><option :value="true">现货</option><option :value="false">期货</option></select></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">运输需求</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">运输方式</label><select v-model="form.transportMode" class="field-input"><option v-for="(meta, key) in TRANSPORT_MODE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="field-label">期望运输时间</label><input v-model="form.expectedDate" type="date" class="field-input" /></div>
            <div><label class="field-label">起点/发货地 <span class="text-apple-red">*</span></label><input v-model="form.origin" type="text" required class="field-input" placeholder="起运地" /></div>
            <div><label class="field-label">终点/目的地 <span class="text-apple-red">*</span></label><input v-model="form.destination" type="text" required class="field-input" placeholder="目的地" /></div>
            <div><label class="field-label">交易地点</label><input v-model="form.tradeLocation" type="text" class="field-input" placeholder="交易地" /></div>
            <div><label class="field-label">交割地点</label><input v-model="form.deliveryLocation" type="text" class="field-input" placeholder="交割地" /></div>
          </div>
        </div>

        <div class="mb-6">
          <label class="field-label">备注</label>
          <textarea v-model="form.remark" rows="3" class="field-input resize-none" placeholder="备注信息"></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建询价' }}</button>
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
import { INQUIRY_STATUS_META, TRANSPORT_MODE_META } from '@/types'
import type { Inquiry, InquiryStatus, TransportMode } from '@/types'

const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const inquiryId = computed(() => route.params.id as string)

const form = ref<Partial<Inquiry>>({
  inquiryNo: '',
  customerId: '',
  customerName: '',
  cargoName: '',
  cargoType: '',
  cargoQuality: '',
  cargoQty: 0,
  mine: '',
  isSpot: true,
  transportMode: 'rail' as TransportMode,
  origin: '',
  destination: '',
  expectedDate: '',
  tradeLocation: '',
  deliveryLocation: '',
  status: 'draft' as InquiryStatus,
  remark: '',
})

const handleSubmit = () => {
  if (isEdit.value) business.updateInquiry(inquiryId.value, form.value)
  else business.addInquiry(form.value)
  router.push('/inquiries')
}

onMounted(() => {
  business.loadInquiries()
  if (isEdit.value) {
    const item = business.inquiries.find((i) => i.id === inquiryId.value)
    if (item) form.value = { ...item }
  }
})
</script>
