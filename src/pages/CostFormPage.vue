<template>
  <div class="animate-fade-in">
    <PageHeader :title="isEdit ? '编辑成本核算' : '新增成本核算'" />
    <div class="max-w-3xl mx-auto space-y-5">
      <form @submit.prevent="handleSubmit" class="bg-apple-card rounded-xl shadow-sm p-6">
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">基本信息</h3>
          <div class="grid grid-cols-2 gap-4">
            <div><label class="field-label">成本单号</label><input v-model="form.costNo" type="text" class="field-input bg-apple-fill/50" readonly /></div>
            <div><label class="field-label">状态</label><select v-model="form.status" class="field-input"><option value="draft">草稿</option><option value="confirmed">已确认</option><option value="archived">已归档</option></select></div>
            <div><label class="field-label">关联订单ID</label><input v-model="form.orderId" type="text" class="field-input" /></div>
            <div><label class="field-label">关联询价ID</label><input v-model="form.inquiryId" type="text" class="field-input" /></div>
            <div><label class="field-label">关联报价ID</label><input v-model="form.quoteId" type="text" class="field-input" /></div>
            <div><label class="field-label">核算人</label><input v-model="form.calculatedBy" type="text" class="field-input" /></div>
            <div><label class="field-label">确认人</label><input v-model="form.confirmedBy" type="text" class="field-input" /></div>
            <div><label class="field-label">对客报价</label><input v-model.number="form.quotedPrice" type="number" class="field-input" /></div>
            <div><label class="field-label">毛利</label><input v-model.number="form.profit" type="number" class="field-input" /></div>
            <div>
              <label class="field-label">毛利率(%)</label>
              <input v-model.number="form.profitRate" type="number" step="0.01" min="0" max="100" class="field-input" :data-error="!!profitRateError" />
              <p v-if="profitRateError" class="text-[11px] text-apple-red mt-1">{{ profitRateError }}</p>
            </div>
          </div>
        </div>
        <div class="mb-6">
          <h3 class="text-sm font-semibold text-apple-text mb-4 pb-2 border-b border-apple-border">成本明细项</h3>
          <div class="space-y-3">
            <div v-for="(item, idx) in form.items" :key="idx" class="p-3 border border-apple-border rounded-lg bg-apple-bg/30">
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">成本类型</label>
                  <select v-model="item.type" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm">
                    <option v-for="(meta, key) in COST_ITEM_TYPE_META" :key="key" :value="key">{{ meta.label }}</option>
                  </select>
                </div>
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">成本项名称</label><input v-model="item.name" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">单位</label><input v-model="item.unit" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" placeholder="元/吨、元/车" /></div>
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">单价</label><input v-model.number="item.unitPrice" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">数量</label><input v-model.number="item.quantity" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
                <div><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">金额</label><input v-model.number="item.amount" type="number" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
              </div>
              <div class="mt-2"><label class="block text-[11px] font-medium text-apple-tertiary tracking-wide mb-1">备注</label><input v-model="item.remark" type="text" class="w-full px-2 py-1.5 rounded border border-apple-border text-sm" /></div>
              <button type="button" @click="removeItem(idx)" class="mt-2 text-xs text-apple-red hover:underline">删除此项</button>
            </div>
          </div>
          <button type="button" @click="addItem" class="mt-3 px-3 py-1.5 text-sm text-apple-blue border border-apple-blue/30 rounded-lg hover:bg-apple-blue/5">添加成本项</button>
          <div class="mt-4 p-3 bg-apple-blue/5 rounded-lg flex justify-between items-center">
            <span class="text-sm font-medium text-apple-text">总成本合计</span>
            <span class="text-lg font-semibold text-apple-blue">¥{{ computedTotal.toLocaleString() }}</span>
          </div>
        </div>
        <div class="mb-6"><label class="field-label">备注</label><textarea v-model="form.remark" rows="3" class="field-input resize-none"></textarea></div>
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-apple-border">
          <button type="button" @click="router.back()" class="btn-secondary">取消</button>
          <button type="submit" class="btn-primary">{{ isEdit ? '保存修改' : '创建核算单' }}</button>
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
import { COST_ITEM_TYPE_META } from '@/types'
import { percentError } from '@/lib/validators'
import type { CostSheet, CostItem } from '@/types'
const route = useRoute()
const router = useRouter()
const business = useBusinessStore()
const isEdit = computed(() => !!route.params.id)
const itemId = computed(() => route.params.id as string)
const form = ref<Partial<CostSheet>>({ costNo: '', orderId: '', inquiryId: '', quoteId: '', items: [], totalCost: 0, quotedPrice: 0, profit: 0, profitRate: 0, status: 'draft', calculatedBy: '', confirmedBy: '', remark: '' })
const computedTotal = computed(() => (form.value.items || []).reduce((s, item) => s + (item.amount || 0), 0))
/** 毛利率客观范围：0 - 100% */
const profitRateError = computed(() => percentError(form.value.profitRate))
const addItem = () => {
  const newItem: CostItem = { id: `item_${Date.now()}`, type: 'rail_freight', name: '', unit: '', unitPrice: 0, quantity: 0, amount: 0, remark: '' }
  form.value.items = [...(form.value.items || []), newItem]
}
const removeItem = (idx: number) => { form.value.items = (form.value.items || []).filter((_, i) => i !== idx) }
const handleSubmit = () => {
  if (profitRateError.value) return
  form.value.totalCost = computedTotal.value
  if (isEdit.value) business.updateCostSheet(itemId.value, form.value)
  else business.addCostSheet(form.value)
  router.push('/costs')
}
onMounted(() => { business.loadCostSheets(); if (isEdit.value) { const item = business.costSheets.find((c) => c.id === itemId.value); if (item) form.value = { ...item } } })
</script>
