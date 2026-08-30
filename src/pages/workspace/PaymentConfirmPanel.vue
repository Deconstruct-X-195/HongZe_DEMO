<template>
  <div class="space-y-4">
    <!-- 金额概览 -->
    <div class="rounded-apple-lg border border-apple-border/50 p-4 space-y-2.5">
      <div class="flex items-center justify-between text-sm">
        <span class="text-apple-subtext">总金额（系统自动计算）</span>
        <span class="font-semibold text-apple-text tabular-nums">{{ fmtMoney(financial.totalAmount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-apple-subtext">已收金额</span>
        <span class="font-semibold text-apple-green tabular-nums">{{ fmtMoney(financial.receivedAmount) }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-apple-subtext">未收金额</span>
        <span class="font-semibold text-apple-red tabular-nums">{{ fmtMoney(financial.totalAmount - financial.receivedAmount) }}</span>
      </div>
    </div>

    <!-- 收款录入 -->
    <div>
      <label class="field-label">本次确认已收金额（元）<span class="text-apple-red">*</span></label>
      <input type="number" v-model.number="amount" min="0" class="field-input" placeholder="如：2500000" />
      <p class="text-[11px] text-apple-subtext mt-1">确认后订单状态将从「待确认」流转至「订单已确认」，解锁发运操作</p>
    </div>

    <!-- 凭证（选填） -->
    <div>
      <label class="field-label">收款凭证（选填）</label>
      <div class="grid grid-cols-2 gap-2">
        <input v-model="voucherName" class="field-input" placeholder="凭证名称，如：银行回单" />
        <select v-model="voucherType" class="field-input">
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

    <!-- 确认按钮 -->
    <div class="pt-2 border-t border-apple-border/40">
      <button @click="confirm" :disabled="confirming" class="btn-primary w-full justify-center">
        <Icon :name="confirming ? 'clock' : 'check-circle'" :size="15" :class="confirming ? 'animate-spin' : ''" />
        {{ confirming ? '确认中…' : '确认收款' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import { useOrderStore } from '@/stores/order'
import { fmtMoney } from '@/lib/format'
import { VOUCHER_TYPES } from '@/types'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ done: [] }>()
const store = useOrderStore()

const financial = reactive(store.financialOf(props.orderId))
const amount = ref(financial.receivedAmount || 0)
const voucherName = ref('')
const voucherType = ref(VOUCHER_TYPES[0])
const confirming = ref(false)
const tip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })

function showTip(type: 'success' | 'error', msg: string) {
  tip.value = { show: true, type, msg }
}

function confirm() {
  if (amount.value <= 0) {
    showTip('error', '请先填写本次确认的已收金额')
    return
  }
  confirming.value = true
  // 更新财务信息
  financial.receivedAmount = amount.value
  if (financial.totalAmount > 0) {
    financial.paymentStatus = amount.value >= financial.totalAmount ? 'paid' : 'partial'
  }
  // 上传凭证（若填写）
  if (voucherName.value) {
    store.addVoucher(financial, {
      name: voucherName.value,
      type: voucherType.value,
      uploadedBy: '财务人员',
    })
  }
  store.saveFinancial({ ...financial })
  // 状态流转：待确认 → 订单已确认
  const ok = store.transitionStatus(props.orderId, 'confirmed', '财务专员', 'finance', '财务确认收款')
  if (ok) {
    showTip('success', '收款已确认，订单已解锁发运')
    setTimeout(() => {
      confirming.value = false
      emit('done')
    }, 600)
  } else {
    // 先货后款：订单可能已到发运完成，尾款结清时直接完结（双条件闭环：货已全部出库 + 款已结清）
    const order = store.getById(props.orderId)
    const shippings = store.shippingsOf(props.orderId)
    const allPickedUp = shippings.length > 0 && shippings.every((x) => (x.pickedUpQty || 0) >= (x.shippedQty || 0))
    if (order?.status === 'shipped' && allPickedUp && financial.receivedAmount >= financial.totalAmount) {
      store.transitionStatus(props.orderId, 'completed', '财务专员', 'finance', '双条件闭环：货物全部出库且财务已结清')
      showTip('success', '尾款已结清，订单已完成')
      setTimeout(() => {
        confirming.value = false
        emit('done')
      }, 600)
    } else {
      confirming.value = false
      showTip('error', '确认失败：当前订单状态不允许此操作')
    }
  }
}
</script>
