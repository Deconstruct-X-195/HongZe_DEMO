<template>
  <div class="space-y-4">
    <!-- 通道选择 -->
    <div>
      <label class="field-label">运输通道 <span class="text-apple-red">*</span></label>
      <select v-model="form.capacityId" class="field-input">
        <option value="" disabled>请选择运输通道</option>
        <option v-for="ch in availableChannels" :key="ch.id" :value="ch.id">{{ ch.label }}（剩余可发运 {{ fmtNum(ch.unshipped) }}吨）</option>
      </select>
    </div>

    <!-- 选中通道实时状态 -->
    <div v-if="form.capacityId" class="grid grid-cols-3 gap-2">
      <div class="rounded-apple bg-apple-fill/40 px-3 py-2 border border-apple-border/40 text-center">
        <div class="text-[11px] text-apple-subtext">通道总量</div>
        <div class="text-sm font-bold text-apple-text mt-0.5">{{ fmtNum(shippingOf(shippings, form.capacityId)?.plannedQty || 0) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
      <div class="rounded-apple bg-apple-blue/5 px-3 py-2 border border-apple-blue/15 text-center">
        <div class="text-[11px] text-apple-blue">已发运</div>
        <div class="text-sm font-bold text-apple-blue mt-0.5">{{ fmtNum(shippingOf(shippings, form.capacityId)?.shippedQty || 0) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
      <div class="rounded-apple bg-apple-fill px-3 py-2 border border-apple-border/40 text-center">
        <div class="text-[11px] text-apple-subtext">剩余可发运</div>
        <div class="text-sm font-bold text-apple-subtext mt-0.5">{{ fmtNum(selectedUnshipped) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
    </div>

    <!-- 发货量 + 时间 -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">本次发货量（吨）<span class="text-apple-red">*</span></label>
        <input type="number" v-model.number="form.shipQty" min="0" :max="selectedUnshipped" class="field-input" placeholder="如：20000" />
      </div>
      <div>
        <label class="field-label">发货时间</label>
        <input type="datetime-local" v-model="form.shipDate" class="field-input" />
      </div>
    </div>

    <!-- 凭证（选填） -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="field-label">发运凭证名称（选填）</label>
        <input v-model="form.voucherName" class="field-input" placeholder="如：请车计划、运单编号" />
      </div>
      <div>
        <label class="field-label">凭证类型</label>
        <select v-model="form.voucherType" class="field-input">
          <option v-for="t in VOUCHER_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>

    <!-- 反馈提示 -->
    <div v-if="tip.show" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium"
      :class="tip.type === 'success' ? 'bg-apple-green/10 text-apple-green border border-apple-green/20' : 'bg-apple-red/10 text-apple-red border border-apple-red/20'">
      <Icon :name="tip.type === 'success' ? 'check-circle' : 'alert'" :size="14" />
      {{ tip.msg }}
    </div>

    <!-- 执行按钮 -->
    <div class="pt-2 border-t border-apple-border/40">
      <button @click="execute" class="btn-primary w-full justify-center">
        <Icon name="send" :size="15" />
        执行发货
      </button>
      <p class="text-[11px] text-apple-subtext mt-2 text-center">发运量、货物动态与时间轴将自动同步</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { useOrderStore } from '@/stores/order'
import { fmtNum } from '@/lib/format'
import { CHANNEL_META, VOUCHER_TYPES } from '@/types'
import type { Capacity, ChannelShipping, ChannelType } from '@/types'
import { autoShippingState, shippingOf } from '../order-detail/shipping-helpers'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ done: [] }>()
const store = useOrderStore()

/* 初始化通道与发运数据 */
const capacities: Capacity[] = store.capacitiesOf(props.orderId)
const shippings = reactive<ChannelShipping[]>(store.ensureShippings(props.orderId, capacities))

const form = reactive({
  capacityId: '',
  shipQty: 0,
  shipDate: new Date().toISOString().slice(0, 16),
  voucherName: '',
  voucherType: VOUCHER_TYPES[0],
})

const tip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })
function showTip(type: 'success' | 'error', msg: string) {
  tip.value = { show: true, type, msg }
  setTimeout(() => (tip.value.show = false), 3000)
}

/** 可选通道列表（仅显示已编制计划的通道，过滤未使用的空通道） */
const availableChannels = computed(() =>
  shippings
    .filter((s) => (s.plannedQty || 0) > 0)
    .map((s) => {
      const cap = capacities.find((c) => c.id === s.capacityId)
      return {
        id: s.capacityId,
        label: `${cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'} · ${cap ? `${cap.origin || '—'} → ${cap.destination || '—'}` : '—'}`,
        unshipped: Math.max(0, (s.plannedQty || 0) - (s.shippedQty || 0)),
      }
    }),
)

/** 选中通道剩余可发运量 */
const selectedUnshipped = computed(() => {
  const ch = availableChannels.value.find((c) => c.id === form.capacityId)
  return ch ? ch.unshipped : 0
})

/** 执行发货：累加数量 + 自动状态流转 + 日志 */
function execute() {
  if (!form.capacityId) {
    showTip('error', '请选择运输通道')
    return
  }
  if (form.shipQty <= 0) {
    showTip('error', '请填写本次发货量')
    return
  }
  if (form.shipQty > selectedUnshipped.value) {
    showTip('error', `发货量（${fmtNum(form.shipQty)}吨）不能超过剩余可发运量（${fmtNum(selectedUnshipped.value)}吨）`)
    return
  }
  const s = shippingOf(shippings, form.capacityId)
  if (!s) return
  const cap = capacities.find((c) => c.id === form.capacityId)
  const chLabel = cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'
  const oldState = s.state

  s.shippedQty += form.shipQty
  if (!s.actualDate) s.actualDate = form.shipDate
  if (!s.planDate) s.planDate = form.shipDate
  s.state = autoShippingState(s.shippedQty, s.plannedQty)

  if (form.voucherName) {
    store.addVoucher(s, {
      name: form.voucherName,
      type: form.voucherType,
      uploadedBy: '运输人员',
      note: `${form.shipDate} 发货 ${fmtNum(form.shipQty)}吨`,
    })
  }

  store.saveShippings(props.orderId, shippings.map((x) => ({ ...x })))
  store.addOperationLog(props.orderId, '运输专员', 'transport', '批次发货操作', {
    remark: `${chLabel}（${cap?.origin || ''} → ${cap?.destination || ''}）：发货 ${fmtNum(form.shipQty)}吨（累计 ${fmtNum(s.shippedQty)}/${fmtNum(s.plannedQty)}吨）${oldState !== s.state ? '，通道发运状态已更新' : ''}`,
  })

  // 订单级状态流转（只统计已编制计划的有效通道，未使用的空通道不阻塞闭环）
  const validChannels = shippings.filter((x) => (x.plannedQty || 0) > 0)
  const allCompleted = validChannels.length > 0 && validChannels.every((x) => x.state === 'completed')
  const anyShipping = shippings.some((x) => x.state === 'shipping' || x.state === 'completed')
  const orderStatus = store.getById(props.orderId)?.status
  if (allCompleted && (orderStatus === 'shipping' || orderStatus === 'shipped')) {
    if (orderStatus === 'shipping') store.transitionStatus(props.orderId, 'shipped', '运输专员', 'transport', '全部通道发运完成')
  } else if (anyShipping && orderStatus === 'confirmed') {
    store.transitionStatus(props.orderId, 'shipping', '运输专员', 'transport', '开始发运')
  }

  showTip('success', `${chLabel}发货成功 · 发货 ${fmtNum(form.shipQty)}吨（累计 ${fmtNum(s.shippedQty)}/${fmtNum(s.plannedQty)}吨）`)
  form.shipQty = 0
  form.voucherName = ''
  // 通知工作台刷新列表（订单状态可能已流转）
  emit('done')
}
</script>
