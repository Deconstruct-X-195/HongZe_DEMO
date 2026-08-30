<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑合同' : '新增合同'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">合同号</label><input v-model="form.contractNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">合同类型</label><select v-model="form.type" class="field-input"><option v-for="(meta, key) in CONTRACT_TYPE_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
            <div class="col-span-2"><label class="field-label">合同标题 <span class="text-apple-red">*</span></label><input v-model="form.title" type="text" required class="field-input" placeholder="合同标题" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">签约双方</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">客户ID</label><input v-model="form.customerId" type="text" class="field-input" /></div>
            <div><label class="field-label">客户名称(甲方) <span class="text-apple-red">*</span></label><input v-model="form.customerName" type="text" required class="field-input" /></div>
            <div class="col-span-2"><label class="field-label">乙方</label><input v-model="form.partyB" type="text" class="field-input" /></div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">合同内容</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">合同金额(元) <span class="text-apple-red">*</span></label><input v-model.number="form.amount" type="number" required class="field-input" /></div>
            <div><label class="field-label">币种</label><input v-model="form.currency" type="text" class="field-input" placeholder="CNY" /></div>
            <div><label class="field-label">货物名称</label><input v-model="form.cargoName" type="text" class="field-input" /></div>
            <div><label class="field-label">数量(吨)</label><input v-model.number="form.cargoQty" type="number" class="field-input" /></div>
            <div><label class="field-label">起点</label><input v-model="form.origin" type="text" class="field-input" /></div>
            <div><label class="field-label">终点</label><input v-model="form.destination" type="text" class="field-input" /></div>
            <div><label class="field-label">签署日期</label><input v-model="form.signDate" type="date" class="field-input" /></div>
            <div><label class="field-label">生效日期</label><input v-model="form.effectiveDate" type="date" class="field-input" /></div>
            <div><label class="field-label">到期日期</label><input v-model="form.expireDate" type="date" class="field-input" /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option v-for="(meta, key) in CONTRACT_STATUS_META" :key="key" :value="key">{{ meta.label }}</option></select></div>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建合同' }}</button>
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
import { CONTRACT_STATUS_META, CONTRACT_TYPE_META } from '@/types'
import type { Contract, ContractStatus, ContractType } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const contractId = computed(() => route.params.id as string)
const form = ref<Partial<Contract>>({ contractNo: '', type: 'transport' as ContractType, title: '', customerId: '', customerName: '', partyB: '泓泽宜通', amount: 0, currency: 'CNY', cargoName: '', cargoQty: 0, origin: '', destination: '', signDate: '', effectiveDate: '', expireDate: '', status: 'draft' as ContractStatus, remark: '', attachments: [] })
const handleSubmit = () => { if (isEdit.value) business.updateContract(contractId.value, form.value); else business.addContract(form.value); router.push('/contracts') }
onMounted(() => { business.loadContracts(); if (isEdit.value) { const item = business.contracts.find((c) => c.id === contractId.value); if (item) form.value = { ...item } } })
</script>
