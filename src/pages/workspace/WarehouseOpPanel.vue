<template>
  <div class="space-y-4">
    <!-- 通道选择 -->
    <div>
      <label class="field-label">运输通道 <span class="text-apple-red">*</span></label>
      <select v-model="form.capacityId" class="field-input">
        <option value="" disabled>请选择运输通道（仅显示已发运通道）</option>
        <option v-for="ch in warehouseChannels" :key="ch.id" :value="ch.id">{{ ch.label }}（在途 {{ fmtNum(ch.inTransit) }}吨，堆存 {{ fmtNum(ch.stored) }}吨）</option>
      </select>
    </div>

    <!-- 选中通道实时状态 -->
    <div v-if="form.capacityId" class="grid grid-cols-3 gap-2">
      <div class="rounded-apple bg-apple-blue/5 px-3 py-2 border border-apple-blue/15 text-center">
        <div class="text-[11px] text-apple-blue">在途运输</div>
        <div class="text-sm font-bold text-apple-blue mt-0.5">{{ fmtNum(selectedInTransit) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
      <div class="rounded-apple bg-apple-orange/5 px-3 py-2 border border-apple-orange/15 text-center">
        <div class="text-[11px] text-apple-orange">仓储堆存</div>
        <div class="text-sm font-bold text-apple-orange mt-0.5">{{ fmtNum(selectedStored) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
      <div class="rounded-apple bg-apple-green/5 px-3 py-2 border border-apple-green/15 text-center">
        <div class="text-[11px] text-apple-green">已提货出关</div>
        <div class="text-sm font-bold text-apple-green mt-0.5">{{ fmtNum(selectedPickedUp) }}<span class="text-[11px] font-normal ml-0.5">吨</span></div>
      </div>
    </div>

    <!-- 操作数量 -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-apple-orange"></span>到货入库量（吨）</label>
        <input type="number" v-model.number="form.arriveQty" min="0" class="field-input" placeholder="货物到达终点站" />
        <p class="text-[11px] text-apple-subtext mt-1">不得超过在途量 {{ fmtNum(selectedInTransit) }} 吨</p>
      </div>
      <div>
        <label class="field-label flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-apple-green"></span>提货出关量（吨）</label>
        <input type="number" v-model.number="form.pickupQty" min="0" class="field-input" placeholder="客户从堆场提货" />
        <p class="text-[11px] text-apple-subtext mt-1">不得超过堆存量 {{ fmtNum(selectedStored + form.arriveQty) }} 吨</p>
      </div>
    </div>

    <!-- 凭证（选填） -->
    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="field-label">仓储凭证名称（选填）</label>
        <input v-model="form.voucherName" class="field-input" placeholder="如：入库单、提货单" />
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
      <button @click="execute" class="btn-primary w-full justify-center bg-apple-orange hover:bg-apple-orange/90">
        <Icon name="package" :size="15" />
        执行操作
      </button>
      <p class="text-[11px] text-apple-subtext mt-2 text-center">在途运输量 = 发运量 − 仓储堆存量 − 已提货出关量</p>
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
import { shippingOf } from '../order-detail/shipping-helpers'

const props = defineProps<{ orderId: string }>()
const emit = defineEmits<{ done: [] }>()
const store = useOrderStore()

/* 初始化通道与发运数据 */
const capacities: Capacity[] = store.capacitiesOf(props.orderId)
const shippings = reactive<ChannelShipping[]>(store.ensureShippings(props.orderId, capacities))

const form = reactive({
  capacityId: '',
  arriveQty: 0,
  pickupQty: 0,
  voucherName: '',
  voucherType: VOUCHER_TYPES[0],
})

const tip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })
function showTip(type: 'success' | 'error', msg: string) {
  tip.value = { show: true, type, msg }
  setTimeout(() => (tip.value.show = false), 3000)
}

/** 当前选中通道的发运数据 */
const selectedShipping = computed(() => shippingOf(shippings, form.capacityId))
const selectedStored = computed(() => selectedShipping.value?.storedQty || 0)
const selectedPickedUp = computed(() => selectedShipping.value?.pickedUpQty || 0)
const selectedInTransit = computed(() => {
  const s = selectedShipping.value
  if (!s) return 0
  return Math.max(0, (s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0))
})

/** 可操作通道列表（已发运量 > 0） */
const warehouseChannels = computed(() =>
  shippings
    .filter((s) => (s.shippedQty || 0) > 0)
    .map((s) => {
      const cap = capacities.find((c) => c.id === s.capacityId)
      const inTransit = Math.max(0, (s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0))
      return {
        id: s.capacityId,
        label: `${cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'} · ${cap ? `${cap.origin || '—'} → ${cap.destination || '—'}` : '—'}`,
        inTransit,
        stored: s.storedQty || 0,
      }
    }),
)

/** 执行仓储操作：到货入库 + 提货出关 */
function execute() {
  if (!form.capacityId) {
    showTip('error', '请选择运输通道')
    return
  }
  if (form.arriveQty <= 0 && form.pickupQty <= 0) {
    showTip('error', '请至少填写一项操作数量（到货入库/提货出关）')
    return
  }
  const s = selectedShipping.value
  if (!s) return

  // 校验：到货入库 ≤ 在途量
  if (form.arriveQty > selectedInTransit.value) {
    showTip('error', `到货入库量（${fmtNum(form.arriveQty)}吨）不能超过在途量（${fmtNum(selectedInTransit.value)}吨）`)
    return
  }
  // 校验：提货 ≤ 堆存 + 本次到货
  if (form.pickupQty > (s.storedQty || 0) + form.arriveQty) {
    showTip('error', `提货量（${fmtNum(form.pickupQty)}吨）不能超过当前堆存量（${fmtNum((s.storedQty || 0) + form.arriveQty)}吨）`)
    return
  }

  const cap = capacities.find((c) => c.id === form.capacityId)
  const chLabel = cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'

  s.storedQty = (s.storedQty || 0) + form.arriveQty - form.pickupQty
  s.pickedUpQty = (s.pickedUpQty || 0) + form.pickupQty

  if (form.voucherName) {
    store.addVoucher(s, {
      name: form.voucherName,
      type: form.voucherType,
      uploadedBy: '仓储人员',
      note: form.arriveQty > 0 ? '到货入库操作' : '提货出关操作',
    })
  }

  store.saveShippings(props.orderId, shippings.map((x) => ({ ...x })))

  const parts: string[] = []
  if (form.arriveQty > 0) parts.push(`到货入库 ${fmtNum(form.arriveQty)}吨（累计堆存 ${fmtNum(s.storedQty || 0)}吨）`)
  if (form.pickupQty > 0) parts.push(`提货出关 ${fmtNum(form.pickupQty)}吨（累计提货 ${fmtNum(s.pickedUpQty || 0)}吨）`)
  store.addOperationLog(props.orderId, '仓储专员', 'transport', '仓储堆存操作', {
    remark: `${chLabel}（${cap?.origin || ''} → ${cap?.destination || ''}）：${parts.join('，')}`,
  })

  // 订单级闭环流转：全部货物提货出关（业务口径）→ 发运完成；财务已结清（资金口径）→ 已完成
  const validChannels = shippings.filter((x) => (x.shippedQty || 0) > 0)
  const allPickedUp = validChannels.length > 0 && validChannels.every((x) => (x.pickedUpQty || 0) >= (x.shippedQty || 0))
  const orderStatus = store.getById(props.orderId)?.status
  if (allPickedUp && (orderStatus === 'shipping' || orderStatus === 'shipped')) {
    if (orderStatus === 'shipping') {
      store.transitionStatus(props.orderId, 'shipped', '仓储专员', 'transport', '全部货物提货出关，业务发运闭环')
    }
    const fin = store.financialOf(props.orderId)
    if (fin.totalAmount > 0 && fin.receivedAmount >= fin.totalAmount) {
      store.transitionStatus(props.orderId, 'completed', '仓储专员', 'transport', '双条件闭环：货物全部出库且财务已结清')
    }
  }

  showTip('success', `${chLabel}仓储操作完成 · ${parts.join('，')}`)
  form.arriveQty = 0
  form.pickupQty = 0
  form.voucherName = ''
}
</script>
