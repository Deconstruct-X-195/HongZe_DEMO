<template>
  <div class="min-h-screen bg-apple-bg">
    <TopBar :title="isEdit ? '编辑询价' : '新增询价'" />
    <div class="max-w-3xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">询价单号</label><input v-model="form.inquiryNo" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm bg-apple-bg" placeholder="自动生成" readonly /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">状态</label><select v-model="form.status" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in INQUIRY_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">客户信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户ID</label><input v-model="form.customerId" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="选择客户" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">客户名称 <span class="text-red-500">*</span></label><input v-model="form.customerName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="客户名称" /></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">货物信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">货物名称 <span class="text-red-500">*</span></label><input v-model="form.cargoName" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="如：铁矿石" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">品类</label><input v-model="form.cargoType" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="如：粉矿/块矿" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">品质</label><input v-model="form.cargoQuality" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="品位/指标" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">数量(吨) <span class="text-red-500">*</span></label><input v-model.number="form.cargoQty" type="number" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="0" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">来源矿山</label><input v-model="form.mine" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="矿山名称" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">现货/期货</label><select v-model="form.isSpot" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option :value="true">现货</option><option :value="false">期货</option></select></div>
          </div>
        </div>

        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">运输需求</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">运输方式</label><select v-model="form.transportMode" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm"><option v-for="(meta, key) in TRANSPORT_MODE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">期望运输时间</label><input v-model="form.expectedDate" type="date" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">起点/发货地 <span class="text-red-500">*</span></label><input v-model="form.origin" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="起运地" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">终点/目的地 <span class="text-red-500">*</span></label><input v-model="form.destination" type="text" required class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="目的地" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">交易地点</label><input v-model="form.tradeLocation" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="交易地" /></div>
            <div><label class="block text-sm font-medium text-apple-text mb-1.5">交割地点</label><input v-model="form.deliveryLocation" type="text" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm" placeholder="交割地" /></div>
          </div>
        </div>

        <div class="mb-6">
          <label class="block text-sm font-medium text-apple-text mb-1.5">备注</label>
          <textarea v-model="form.remark" rows="3" class="w-full px-3 py-2 rounded-lg border border-apple-border text-sm focus:outline-none resize-none" placeholder="备注信息"></textarea>
        </div>

        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="px-4 py-2 text-sm font-medium text-apple-text border border-apple-border rounded-lg hover:bg-apple-bg transition-colors">取消</button>
          <button type="submit" class="px-4 py-2 bg-apple-blue text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">{{ isEdit ? '保存修改' : '创建询价' }}</button>
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
