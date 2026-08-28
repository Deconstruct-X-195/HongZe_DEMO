<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import InfoRow from '@/components/InfoRow.vue'
import TransportPlanReport from '@/components/TransportPlanReport.vue'
import { useOrderStore } from '@/stores/order'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import { exportTransportPlanPdf } from '@/lib/pdfExport'
import {
  CHANNEL_META,
  CHANNEL_GROUP_META,
  STATUS_META,
  PAYMENT_META,
  INVOICE_META,
  SHIPPING_META,
  ROLE_META,
  VOUCHER_TYPES,
  toChannelGroup,
  customersDisplay,
  customersTotalQty,
  migrateStatus,
} from '@/types'
import type {
  ChannelType,
  ChannelGroup,
  OrderStatus,
  FinancialInfo,
  ChannelShipping,
  OperatorRole,
  PaymentStatus,
  InvoiceStatus,
  ShippingState,
} from '@/types'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const id = route.params.id as string

/* ---------- 当前操作角色（模拟登录角色） ---------- */
const currentRole = ref<OperatorRole>('admin')
const roleOptions: { key: OperatorRole; label: string }[] = [
  { key: 'finance', label: '财务人员' },
  { key: 'transport', label: '运输人员' },
  { key: 'admin', label: '管理员' },
]

/* ---------- 标签页 ---------- */
type Tab = 'basic' | 'finance' | 'shipping' | 'warehouse' | 'cargo' | 'log'
const activeTab = ref<Tab>('basic')
const tabs: { key: Tab; label: string; icon: any }[] = [
  { key: 'basic', label: '基本信息', icon: 'clipboard-list' },
  { key: 'finance', label: '财务状态', icon: 'dollar' },
  { key: 'shipping', label: '发运状态', icon: 'send' },
  { key: 'warehouse', label: '仓储堆存', icon: 'package' },
  { key: 'cargo', label: '货物动态', icon: 'route' },
  { key: 'log', label: '运输时间轴', icon: 'history' },
]

/* ---------- 数据加载 ---------- */
const order = computed(() => store.getById(id))
const port = computed(() => store.portOf(id))
const capacities = computed(() => store.capacitiesOf(id))
const plan = computed(() => store.planOf(id))

const currentStatus = computed<NonNullable<OrderStatus>>(() => migrateStatus(order.value?.status) ?? 'draft')

/* ---------- 状态流转步骤 ---------- */
const statusSteps: NonNullable<OrderStatus>[] = [
  'draft', 'port', 'capacity', 'plan',
  'pending_confirm', 'confirmed', 'shipping', 'shipped', 'completed',
]
const currentStepIdx = computed(() => {
  const s = currentStatus.value
  return s ? statusSteps.indexOf(s) : 0
})

/* ---------- 业务数据（响应式，便于操作后刷新） ---------- */
const financial = reactive<FinancialInfo>(store.financialOf(id))
const shippings = reactive<ChannelShipping[]>(store.ensureShippings(id, capacities.value))
const logs = computed(() => store.logsOf(id))

/* ---------- 凭证上传表单 ---------- */
const voucherForms = reactive<Record<string, { name: string; type: string; note: string }>>({})
function getVoucherForm(key: string) {
  if (!voucherForms[key]) {
    voucherForms[key] = { name: '', type: VOUCHER_TYPES[0], note: '' }
  }
  return voucherForms[key]
}
function handleFileSelect(e: Event, form: { name: string }) {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    form.name = form.name || input.files[0].name
  }
}

/* ---------- 财务操作 ---------- */
// 财务操作反馈：区分保存与确认收款的提示
const financeTip = ref<{ show: boolean; type: 'success' | 'error' | 'info'; msg: string }>({
  show: false,
  type: 'success',
  msg: '',
})
function showFinanceTip(type: 'success' | 'error' | 'info', msg: string) {
  financeTip.value = { show: true, type, msg }
  setTimeout(() => (financeTip.value.show = false), 2500)
}

function setPaymentStatus(s: PaymentStatus) {
  financial.paymentStatus = s
}
function setInvoiceStatus(s: InvoiceStatus) {
  financial.invoiceStatus = s
}
function saveFinancial() {
  // 自动计算收款状态
  if (financial.totalAmount > 0) {
    if (financial.receivedAmount >= financial.totalAmount) financial.paymentStatus = 'paid'
    else if (financial.receivedAmount > 0) financial.paymentStatus = 'partial'
    else financial.paymentStatus = 'unpaid'
  }
  store.saveFinancial({ ...financial })
  store.addOperationLog(id, '当前操作员', currentRole.value, '更新财务信息', {
    remark: `收款状态：${PAYMENT_META[financial.paymentStatus].label}，已收 ${fmtMoney(financial.receivedAmount)}`,
  })
  showFinanceTip('success', `财务信息已保存 · 收款状态：${PAYMENT_META[financial.paymentStatus].label}`)
}
function addFinancialVoucher() {
  const form = getVoucherForm('financial')
  if (!form.name) {
    alert('请填写凭证名称')
    return
  }
  store.addVoucher(financial, {
    name: form.name,
    type: form.type,
    uploadedBy: ROLE_META[currentRole.value].label,
    note: form.note,
  })
  store.saveFinancial({ ...financial })
  form.name = ''
  form.note = ''
}
function removeFinancialVoucher(vid: string) {
  store.removeVoucher(financial, vid)
  store.saveFinancial({ ...financial })
}

/** 财务确认收款 → 状态流转到"订单已确认" + 跳转发运状态 */
const confirmingPayment = ref(false)
function confirmPayment() {
  if (financial.receivedAmount <= 0) {
    showFinanceTip('error', '确认收款失败：请先填写已收金额')
    return
  }
  confirmingPayment.value = true
  const ok = store.transitionStatus(id, 'confirmed', '当前操作员', 'finance', '财务确认收款')
  if (ok) {
    if (financial.receivedAmount >= financial.totalAmount && financial.totalAmount > 0) {
      financial.paymentStatus = 'paid'
    } else {
      financial.paymentStatus = 'partial'
    }
    store.saveFinancial({ ...financial })
    showFinanceTip('success', `收款已确认 · 即将跳转至发运状态`)
    // 延迟跳转，让用户看到成功反馈
    setTimeout(() => {
      activeTab.value = 'shipping'
      confirmingPayment.value = false
    }, 800)
  } else {
    confirmingPayment.value = false
    showFinanceTip('error', '确认收款失败：当前状态不允许此操作')
  }
}

/* ---------- 发运操作（运输通道维度） ---------- */
function shippingOf(capId: string): ChannelShipping | undefined {
  return shippings.find((s) => s.capacityId === capId)
}

/** 发运统计（订单整体） */
const shippingStats = computed(() => {
  const planned = shippings.reduce((s, x) => s + (x.plannedQty || 0), 0)
  const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
  const stored = shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
  const pickedUp = shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  const remaining = planned - shipped
  const rate = planned > 0 ? Math.min(100, Math.round((shipped / planned) * 100)) : 0
  const completedChannels = shippings.filter((s) => s.state === 'completed').length
  const shippingChannels = shippings.filter((s) => s.state === 'shipping').length
  return { planned, shipped, stored, pickedUp, remaining, rate, completedChannels, shippingChannels, total: shippings.length }
})

/** 订单总货物量（用于数据溯源） */
const cargoTotal = computed(() => order.value?.cargoTotal || 0)

/** 货物动态分布：运输中 = 已发运 - 仓储堆存 - 已提货出关 */
const inTransitQty = computed(() => {
  const shipped = shippingStats.value.shipped
  const stored = shippingStats.value.stored
  const pickedUp = shippingStats.value.pickedUp
  return Math.max(0, shipped - stored - pickedUp)
})

/** 货物状态分布数据（用于可视化） */
const cargoDistribution = computed(() => {
  const total = cargoTotal.value
  const unshipped = Math.max(0, shippingStats.value.planned - shippingStats.value.shipped)
  const inTransit = inTransitQty.value
  const stored = shippingStats.value.stored
  const pickedUp = shippingStats.value.pickedUp
  return {
    total,
    unshipped,
    inTransit,
    stored,
    pickedUp,
    // 各阶段占比
    unshippedPct: total > 0 ? pct(unshipped, total) : 0,
    inTransitPct: total > 0 ? pct(inTransit, total) : 0,
    storedPct: total > 0 ? pct(stored, total) : 0,
    pickedUpPct: total > 0 ? pct(pickedUp, total) : 0,
    // 发运进度
    shippedPct: total > 0 ? pct(shippingStats.value.shipped, total) : 0,
  }
})

/** 通道货物追踪（每条通道的货物流转状态） */
const channelCargoTracking = computed(() => {
  return shippings.map((s) => {
    const cap = capacities.value.find((c) => c.id === s.capacityId)
    const inTransit = Math.max(0, (s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0))
    return {
      shipping: s,
      capacity: cap,
      channelLabel: cap ? CHANNEL_META[cap.channelType as ChannelType].short : '—',
      channelColor: cap ? CHANNEL_META[cap.channelType as ChannelType].color : '#8e8e93',
      route: cap ? `${cap.origin || '—'}${cap.transfer ? ` → ${cap.transfer}` : ''} → ${cap.destination || '—'}` : '—',
      planned: s.plannedQty || 0,
      shipped: s.shippedQty || 0,
      inTransit,
      stored: s.storedQty || 0,
      pickedUp: s.pickedUpQty || 0,
      unshipped: Math.max(0, (s.plannedQty || 0) - (s.shippedQty || 0)),
      progress: s.plannedQty > 0 ? pct(s.shippedQty || 0, s.plannedQty) : 0,
    }
  })
})

/** 发运相关操作日志（用于历史发运记录） */
const shippingLogs = computed(() => {
  return logs.value.filter(
    (log) => log.action.includes('发运') || log.action.includes('货物') || log.toStatus === 'shipping' || log.toStatus === 'shipped',
  )
})

/** 按通道大类分组的板块（仅显示实际使用的通道类型） */
const channelGroups = computed(() => {
  const groupMap = new Map<ChannelGroup, { capacities: typeof capacities.value; shippings: ChannelShipping[] }>()
  capacities.value.forEach((c) => {
    const g = toChannelGroup(c.channelType as ChannelType)
    if (!groupMap.has(g)) groupMap.set(g, { capacities: [], shippings: [] })
    const entry = groupMap.get(g)!
    entry.capacities.push(c)
    const ship = shippings.find((s) => s.capacityId === c.id)
    if (ship) entry.shippings.push(ship)
  })
  // 按固定顺序输出：铁路直达 → 公铁联运 → 公路直达
  const order: ChannelGroup[] = ['rail_direct', 'rail_transit', 'road']
  return order
    .filter((g) => groupMap.has(g))
    .map((g) => {
      const entry = groupMap.get(g)!
      const meta = CHANNEL_GROUP_META[g]
      const planned = entry.shippings.reduce((s, x) => s + (x.plannedQty || 0), 0)
      const shipped = entry.shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
      const stored = entry.shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
      const pickedUp = entry.shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
      return {
        group: g,
        meta,
        capacities: entry.capacities,
        shippings: entry.shippings,
        planned,
        shipped,
        stored,
        pickedUp,
        // 占比（相对通道总量）
        shippedRate: planned > 0 ? Math.min(100, Math.round((shipped / planned) * 100)) : 0,
        storedRate: planned > 0 ? Math.min(100, Math.round((stored / planned) * 100)) : 0,
        pickedUpRate: planned > 0 ? Math.min(100, Math.round((pickedUp / planned) * 100)) : 0,
        // 占订单总货物量比例（数据溯源）
        totalRate: cargoTotal.value > 0 ? Math.min(100, Math.round((planned / cargoTotal.value) * 100)) : 0,
      }
    })
})

/** 计算占比百分比（安全除法） */
function pct(n: number, d: number): number {
  return d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0
}

/* ---------- 货物动态：自动时间轴（从操作日志生成，无需手动录入） ---------- */
interface TimelineNode {
  id: string
  stage: string
  time: string
  role: OperatorRole
  operator: string
  state: 'completed' | 'in_progress' | 'exception' | 'pending'
  remark?: string
  icon: any
  color: string
}

const autoTimeline = computed<TimelineNode[]>(() => {
  const nodes: TimelineNode[] = []
  // 1. 订单创建
  if (order.value?.createdAt) {
    nodes.push({
      id: 'order-created', stage: '订单创建', time: order.value.createdAt,
      role: 'sales', operator: '系统', state: 'completed',
      remark: `订单编号 ${order.value.id} · 货物 ${order.value.cargoName} ${fmtNum(order.value.cargoTotal)} 吨`,
      icon: 'clipboard-list', color: '#8e8e93',
    })
  }
  // 2. 港口信息录入
  if (port.value?.updatedAt) {
    nodes.push({
      id: 'port-saved', stage: '港口信息录入', time: port.value.updatedAt,
      role: 'port', operator: '港口专员', state: 'completed',
      remark: `${port.value.portName} · ${congLabel(port.value.congestion)} · 等待 ${port.value.waitHours}h`,
      icon: 'anchor', color: '#ff9500',
    })
  }
  // 3. 运力方案录入
  if (capacities.value.length > 0) {
    const latestCap = capacities.value.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b))
    nodes.push({
      id: 'capacity-saved', stage: '运输组织方案录入', time: latestCap.updatedAt,
      role: 'capacity', operator: '运力专员', state: 'completed',
      remark: `${capacities.value.length} 条运输通道 · 总运费 ${fmtMoney(totalFreight.value)} · 运输时间 ${maxLeadTime.value} 天`,
      icon: 'route', color: '#af52de',
    })
  }
  // 4. 从操作日志提取关键事件
  logs.value.forEach((log) => {
    let stage = ''
    let icon = 'circle'
    let color = '#8e8e93'
    let state: TimelineNode['state'] = 'completed'

    if (log.toStatus === 'pending_confirm') {
      stage = '运输方案完成'; icon = 'check-circle'; color = '#af52de'
    } else if (log.toStatus === 'confirmed') {
      stage = '财务确认收款'; icon = 'dollar'; color = '#34c759'
    } else if (log.toStatus === 'shipping') {
      stage = '开始发运'; icon = 'send'; color = '#0071e3'
    } else if (log.toStatus === 'shipped') {
      stage = '全部发运完成'; icon = 'check-circle'; color = '#34c759'
    } else if (log.toStatus === 'completed') {
      stage = '订单已完成'; icon = 'check-circle'; color = '#34c759'
    } else if (log.action.includes('发运')) {
      stage = '更新发运信息'; icon = 'send'; color = '#0071e3'
    } else if (log.action.includes('财务')) {
      stage = log.action; icon = 'dollar'; color = '#34c759'
    } else {
      return // 跳过非关键日志
    }

    nodes.push({
      id: log.id, stage, time: log.createdAt,
      role: log.role, operator: log.operator, state,
      remark: log.remark,
      icon, color,
    })
  })
  // 按时间排序
  return nodes.sort((a, b) => a.time.localeCompare(b.time))
})

/* ---------- 发运操作：权限控制 + 验证 + 批次发货 ---------- */
/** 是否可编辑发运信息（仅运输人员和管理员） */
const canEditShipping = computed(() => {
  return currentRole.value === 'transport' || currentRole.value === 'admin'
})

/** 根据发运量自动推断发运状态 */
function autoShippingState(shipped: number, planned: number): ShippingState {
  if (shipped <= 0) return 'not_started'
  if (shipped >= planned && planned > 0) return 'completed'
  return 'shipping'
}

/* ---------- 批次发货操作（核心操作功能，仅发货环节） ---------- */
interface BatchShipForm {
  capacityId: string
  shipQty: number // 本次发货量（吨）
  shipDate: string // 发货时间
  voucherName: string
  voucherType: string
  remark: string
}
const batchForm = reactive<BatchShipForm>({
  capacityId: '',
  shipQty: 0,
  shipDate: new Date().toISOString().slice(0, 16),
  voucherName: '',
  voucherType: VOUCHER_TYPES[0],
  remark: '',
})

/** 可选通道列表（仅显示有运力的通道） */
const availableChannels = computed(() => {
  return channelCargoTracking.value.map((t) => ({
    id: t.shipping.capacityId,
    label: `${t.channelLabel} · ${t.route}`,
    unshipped: t.unshipped,
  }))
})

/** 批次发货反馈 */
const batchTip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })
function showBatchTip(type: 'success' | 'error', msg: string) {
  batchTip.value = { show: true, type, msg }
  setTimeout(() => (batchTip.value.show = false), 3000)
}

/** 选中通道的剩余可发运量 */
const selectedChannelUnshipped = computed(() => {
  if (!batchForm.capacityId) return 0
  const ch = availableChannels.value.find((c) => c.id === batchForm.capacityId)
  return ch ? ch.unshipped : 0
})

/** 执行批次发货：累加发运量 + 自动更新状态 + 记录日志 + 同步货物动态 */
function executeBatchShip() {
  // 验证
  if (!batchForm.capacityId) {
    showBatchTip('error', '请选择运输通道')
    return
  }
  if (batchForm.shipQty <= 0) {
    showBatchTip('error', '请填写本次发货量')
    return
  }
  if (batchForm.shipQty > selectedChannelUnshipped.value) {
    showBatchTip('error', `发货量（${fmtNum(batchForm.shipQty)}吨）不能超过剩余可发运量（${fmtNum(selectedChannelUnshipped.value)}吨）`)
    return
  }
  const s = shippingOf(batchForm.capacityId)
  if (!s) {
    showBatchTip('error', '通道数据异常，请刷新重试')
    return
  }
  const cap = capacities.value.find((c) => c.id === batchForm.capacityId)
  const chLabel = cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'

  // 记录变更前的状态
  const oldState = s.state

  // 累加发运量
  s.shippedQty += batchForm.shipQty
  // 更新实际发运时间
  if (!s.actualDate) {
    s.actualDate = batchForm.shipDate
  }
  if (!s.planDate) {
    s.planDate = batchForm.shipDate
  }
  // 自动推断状态
  s.state = autoShippingState(s.shippedQty, s.plannedQty)

  // 上传凭证
  if (batchForm.voucherName) {
    store.addVoucher(s, {
      name: batchForm.voucherName,
      type: batchForm.voucherType,
      uploadedBy: ROLE_META[currentRole.value].label,
      note: batchForm.remark || `${batchForm.shipDate} 发货 ${fmtNum(batchForm.shipQty)}吨`,
    })
  }

  // 保存
  store.saveShippings(id, shippings.map((x) => ({ ...x })))

  // 记录操作日志
  store.addOperationLog(id, '当前操作员', currentRole.value, '批次发货操作', {
    remark: `${chLabel}（${cap?.origin || ''} → ${cap?.destination || ''}）：发货 ${fmtNum(batchForm.shipQty)}吨（累计 ${fmtNum(s.shippedQty)}/${fmtNum(s.plannedQty)}吨）${oldState !== s.state ? `，状态变更：${SHIPPING_META[oldState].label} → ${SHIPPING_META[s.state].label}` : ''}`,
  })

  // 状态流转判断
  const allCompleted = shippings.length > 0 && shippings.every((x) => x.state === 'completed')
  const anyShipping = shippings.some((x) => x.state === 'shipping' || x.state === 'completed')
  if (allCompleted && currentStatus.value === 'shipping') {
    store.transitionStatus(id, 'shipped', '当前操作员', 'transport', '全部通道发运完成')
  } else if (anyShipping && currentStatus.value === 'confirmed') {
    store.transitionStatus(id, 'shipping', '当前操作员', 'transport', '开始发运')
  }

  // 反馈
  showBatchTip('success', `${chLabel}发货操作完成 · 发货 ${fmtNum(batchForm.shipQty)}吨（累计 ${fmtNum(s.shippedQty)}/${fmtNum(s.plannedQty)}吨）· 货物动态已同步`)

  // 重置表单（保留通道选择）
  batchForm.shipQty = 0
  batchForm.voucherName = ''
  batchForm.remark = ''
}

/* ---------- 仓储堆存操作（独立环节，由仓储人员操作） ---------- */
interface WarehouseForm {
  capacityId: string
  arriveQty: number // 本次到货入库量（吨）
  pickupQty: number // 本次提货出关量（吨）
  operateDate: string // 操作时间
  voucherName: string
  voucherType: string
  remark: string
}
const warehouseForm = reactive<WarehouseForm>({
  capacityId: '',
  arriveQty: 0,
  pickupQty: 0,
  operateDate: new Date().toISOString().slice(0, 16),
  voucherName: '',
  voucherType: VOUCHER_TYPES[0],
  remark: '',
})

/** 仓储操作反馈 */
const warehouseTip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })
function showWarehouseTip(type: 'success' | 'error', msg: string) {
  warehouseTip.value = { show: true, type, msg }
  setTimeout(() => (warehouseTip.value.show = false), 3000)
}

/** 选中通道的当前堆存量（可提货上限） */
const selectedChannelStoredForWarehouse = computed(() => {
  if (!warehouseForm.capacityId) return 0
  const s = shippingOf(warehouseForm.capacityId)
  return s ? (s.storedQty || 0) : 0
})

/** 选中通道的已发运量（到货上限参考） */
const selectedChannelShippedForWarehouse = computed(() => {
  if (!warehouseForm.capacityId) return 0
  const s = shippingOf(warehouseForm.capacityId)
  return s ? (s.shippedQty || 0) : 0
})

/** 可仓储操作的通道列表（仅显示已发运量>0的通道） */
const warehouseChannels = computed(() => {
  return channelCargoTracking.value
    .filter((t) => t.shipped > 0)
    .map((t) => ({
      id: t.shipping.capacityId,
      label: `${t.channelLabel} · ${t.route}`,
      shipped: t.shipped,
      stored: t.stored,
      pickedUp: t.pickedUp,
    }))
})

/** 执行仓储操作：到货入库 + 提货出关 */
function executeWarehouseOp() {
  // 验证
  if (!warehouseForm.capacityId) {
    showWarehouseTip('error', '请选择运输通道')
    return
  }
  if (warehouseForm.arriveQty <= 0 && warehouseForm.pickupQty <= 0) {
    showWarehouseTip('error', '请至少填写一项操作数量（到货入库/提货出关）')
    return
  }
  const s = shippingOf(warehouseForm.capacityId)
  if (!s) {
    showWarehouseTip('error', '通道数据异常，请刷新重试')
    return
  }
  // 验证：到货入库后堆存量不超过已发运量
  const newStored = (s.storedQty || 0) + warehouseForm.arriveQty - warehouseForm.pickupQty
  if (newStored < 0) {
    showWarehouseTip('error', `提货量（${fmtNum(warehouseForm.pickupQty)}吨）不能超过当前堆存量（${fmtNum(s.storedQty || 0)}吨）`)
    return
  }
  if (warehouseForm.arriveQty > (s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0)) {
    showWarehouseTip('error', `到货入库量（${fmtNum(warehouseForm.arriveQty)}吨）不能超过在途量（${fmtNum((s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0))}吨）`)
    return
  }

  const cap = capacities.value.find((c) => c.id === warehouseForm.capacityId)
  const chLabel = cap ? CHANNEL_META[cap.channelType as ChannelType].short : '通道'

  // 累加数量
  s.storedQty = newStored
  s.pickedUpQty = (s.pickedUpQty || 0) + warehouseForm.pickupQty

  // 上传凭证
  if (warehouseForm.voucherName) {
    store.addVoucher(s, {
      name: warehouseForm.voucherName,
      type: warehouseForm.voucherType,
      uploadedBy: ROLE_META[currentRole.value].label,
      note: warehouseForm.remark || `${warehouseForm.operateDate} ${warehouseForm.arriveQty > 0 ? '到货' : '提货'}操作`,
    })
  }

  // 保存
  store.saveShippings(id, shippings.map((x) => ({ ...x })))

  // 记录操作日志
  const parts: string[] = []
  if (warehouseForm.arriveQty > 0) parts.push(`到货入库 ${fmtNum(warehouseForm.arriveQty)}吨（累计堆存 ${fmtNum(s.storedQty || 0)}吨）`)
  if (warehouseForm.pickupQty > 0) parts.push(`提货出关 ${fmtNum(warehouseForm.pickupQty)}吨（累计提货 ${fmtNum(s.pickedUpQty || 0)}吨）`)
  store.addOperationLog(id, '当前操作员', currentRole.value, '仓储堆存操作', {
    remark: `${chLabel}（${cap?.origin || ''} → ${cap?.destination || ''}）：${parts.join('，')}`,
  })

  // 反馈
  showWarehouseTip('success', `${chLabel}仓储操作完成 · ${parts.join('，')} · 货物动态已同步`)

  // 重置表单
  warehouseForm.arriveQty = 0
  warehouseForm.pickupQty = 0
  warehouseForm.voucherName = ''
  warehouseForm.remark = ''
}

/* ---------- 通道类型标签 ---------- */

/* ---------- 折叠面板状态 ---------- */
const orderOpen = ref(false)
const portOpen = ref(false)
const transportOpen = ref(false) // 运力信息 + 运输方案 整合板块

function congLabel(v?: string) {
  if (!v) return '—'
  return ({ normal: '正常', mild: '轻度拥堵', severe: '严重拥堵' } as const)[v as 'normal' | 'mild' | 'severe']
}

function handleDelete() {
  if (!order.value) return
  if (confirm(`确认删除订单 ${order.value.id} 及其所有关联数据？`)) {
    store.removeOrder(order.value.id)
    router.push('/')
  }
}

/** 是否可执行财务确认 */
const canConfirmPayment = computed(() => {
  const s = currentStatus.value
  return s === 'pending_confirm'
})
/** 是否可执行发运操作 */
const canShip = computed(() => {
  const s = currentStatus.value
  return s === 'confirmed' || s === 'shipping'
})

/* ---------- 运输组织方案汇总（运力 + 方案整合） ---------- */
// 总运费 = 各通道 (计划运输量 × 单位运价) 之和
const totalFreight = computed(() =>
  capacities.value.reduce((s, c) => s + ((c.plannedQty || 0) * (c.price || 0)), 0),
)
// 总金额自动同步总运费（系统自动计算，用户不可编辑）
watch(totalFreight, (val) => {
  financial.totalAmount = val
}, { immediate: true })
// 运输时间 = 所有通道中最长时效（关键路径）
const maxLeadTime = computed(() => {
  const all = capacities.value.map((c) => c.leadTime || 0)
  return all.length > 0 ? Math.max(...all) : 0
})
// 总闲置运力
const totalIdle = computed(() =>
  capacities.value.reduce((s, c) => s + (c.idleCapacity || 0), 0),
)
// 已分配货物量
const allocatedQty = computed(() =>
  capacities.value.reduce((s, c) => s + (c.plannedQty || 0), 0),
)

/* ---------- PDF 下载 ---------- */
const exporting = ref(false)
const reportRef = ref<HTMLDivElement | null>(null)

async function downloadPdf() {
  if (!reportRef.value || !order.value) return
  exporting.value = true
  try {
    await exportTransportPlanPdf(reportRef.value, order.value.id)
  } catch (err) {
    console.error(err)
    alert('PDF 导出失败，请重试')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <div v-if="!order" class="card">
    <EmptyState icon="alert" title="订单不存在" desc="可能已被删除">
      <RouterLink to="/" class="btn-primary">返回首页</RouterLink>
    </EmptyState>
  </div>

  <div v-else class="space-y-4 animate-fade-in">
    <!-- 头部：订单号 + 状态 + 状态流转步骤 -->
    <div class="card p-5 sm:p-6">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h1 class="text-xl font-semibold tracking-tight text-apple-text font-mono">{{ order.id }}</h1>
            <Badge
              :label="STATUS_META[currentStatus].label"
              :color="STATUS_META[currentStatus].color"
              :bg="STATUS_META[currentStatus].bg"
            />
          </div>
          <p class="text-xs text-apple-subtext mt-1.5">
            创建于 {{ fmtDate(order.createdAt) }} · 最后更新 {{ fmtDate(order.updatedAt) }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- 角色切换 -->
          <select v-model="currentRole" class="field-input py-1.5 text-xs w-auto">
            <option v-for="r in roleOptions" :key="r.key" :value="r.key">{{ r.label }}</option>
          </select>
          <button @click="downloadPdf" :disabled="exporting || capacities.length === 0" class="btn-secondary">
            <Icon name="download" :size="15" />
            {{ exporting ? '导出中…' : '下载PDF' }}
          </button>
          <button @click="handleDelete" class="btn-danger">
            <Icon name="trash" :size="15" /> 删除
          </button>
        </div>
      </div>

      <!-- 状态流转步骤条 -->
      <div class="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        <template v-for="(s, idx) in statusSteps" :key="s">
          <div
            class="flex items-center gap-1 shrink-0"
          >
            <div
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-300"
              :class="idx <= currentStepIdx
                ? 'text-white'
                : 'text-apple-subtext bg-gray-100'"
              :style="idx <= currentStepIdx ? { backgroundColor: STATUS_META[s].color } : {}"
            >
              <span class="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                :class="idx < currentStepIdx ? 'bg-white/30' : 'bg-white/20'">
                {{ idx + 1 }}
              </span>
              {{ STATUS_META[s].label }}
            </div>
            <Icon v-if="idx < statusSteps.length - 1" name="chevron-right" :size="12" class="text-apple-subtext shrink-0" />
          </div>
        </template>
      </div>
    </div>

    <!-- 标签页导航 -->
    <div class="flex items-center gap-1 p-1 rounded-apple bg-apple-card border border-apple-border/50 overflow-x-auto">
      <button
        v-for="t in tabs"
        :key="t.key"
        @click="activeTab = t.key"
        class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-[10px] transition-all duration-200 whitespace-nowrap"
        :class="activeTab === t.key ? 'bg-apple-blue text-white shadow-sm' : 'text-apple-subtext hover:text-apple-text hover:bg-black/5'"
      >
        <Icon :name="t.icon" :size="14" />
        {{ t.label }}
        <span v-if="t.key === 'log' && logs.length > 0" class="text-[10px] px-1.5 py-0.5 rounded-full"
          :class="activeTab === t.key ? 'bg-white/20' : 'bg-apple-blue/10 text-apple-blue'">
          {{ logs.length }}
        </span>
      </button>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      mode="out-in"
    >
      <!-- ============ 基本信息 ============ -->
      <div v-if="activeTab === 'basic'" key="basic" class="space-y-3">
        <!-- 订单信息 -->
        <section class="card overflow-hidden">
          <button @click="orderOpen = !orderOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-apple-blue/10 text-apple-blue"><Icon name="clipboard-list" :size="16" /></div>
              <div class="text-left">
                <h2 class="text-sm font-semibold text-apple-text">订单信息</h2>
                <p class="text-xs text-apple-subtext mt-0.5">{{ order.trader }} · {{ order.cargoName }} · {{ fmtNum(order.cargoTotal) }} 吨</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink :to="`/orders/${order.id}/edit`" class="btn-ghost text-xs" @click.stop>编辑 <Icon name="chevron-right" :size="13" /></RouterLink>
              <Icon name="chevron-right" :size="16" class="text-apple-subtext transition-transform duration-300" :class="orderOpen ? 'rotate-90' : ''" />
            </div>
          </button>
          <div v-show="orderOpen" class="px-5 pb-5 pt-4 border-t border-apple-border/40">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
              <InfoRow label="客户" :value="order.trader" />
              <InfoRow v-if="order.traderContact" label="联系人" :value="order.traderContact" />
              <InfoRow v-if="order.traderContactInfo" label="联系方式" :value="order.traderContactInfo" />
              <InfoRow label="货物名称" :value="order.cargoName" />
              <InfoRow label="货物总量" :value="`${fmtNum(order.cargoTotal)} 吨`" strong />
              <InfoRow label="货物单价" :value="`${fmtMoney(order.cargoPrice)} /吨`" />
              <InfoRow label="货物品质" :value="order.cargoQuality" />
              <InfoRow label="来源矿山" :value="order.mine" />
              <InfoRow label="运输船舶" :value="order.vessel" />
              <InfoRow label="装船开始" :value="fmtDate(order.loadingStart)" />
              <InfoRow label="起运时间" :value="fmtDate(order.departure)" />
              <InfoRow label="预计到达港口" :value="order.destPort" />
              <InfoRow label="水尺数" :value="`${order.draftMark} 米`" />
              <InfoRow label="终端钢厂" :value="customersDisplay(order.customers) || '—'" />
              <InfoRow label="销售数量合计" :value="`${fmtNum(customersTotalQty(order.customers))} 吨`" strong />
            </div>
            <div v-if="order.customers && order.customers.length > 0" class="mt-4 pt-4 border-t border-apple-border/40">
              <div class="text-[11px] text-apple-subtext mb-2">终端客户明细</div>
              <div class="flex flex-wrap gap-2">
                <span v-for="(c, i) in order.customers" :key="c.id" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-apple bg-apple-blue/[0.06] text-xs">
                  <span class="text-apple-subtext">{{ i + 1 }}.</span>
                  <span class="text-apple-text font-medium">{{ c.name || '—' }}</span>
                  <span class="text-apple-blue font-semibold">{{ fmtNum(c.qty) }} 吨</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 港口信息 -->
        <section class="card overflow-hidden">
          <button @click="portOpen = !portOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-apple-orange/10 text-apple-orange"><Icon name="anchor" :size="16" /></div>
              <div class="text-left">
                <h2 class="text-sm font-semibold text-apple-text">港口信息</h2>
                <p class="text-xs text-apple-subtext mt-0.5">{{ port ? `${port.portName} · ${congLabel(port.congestion)}` : '未填写' }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink :to="`/orders/${order.id}/port`" class="btn-ghost text-xs" @click.stop>{{ port ? '编辑' : '去录入' }} <Icon name="chevron-right" :size="13" /></RouterLink>
              <Icon name="chevron-right" :size="16" class="text-apple-subtext transition-transform duration-300" :class="portOpen ? 'rotate-90' : ''" />
            </div>
          </button>
          <div v-show="portOpen" class="px-5 pb-5 pt-4 border-t border-apple-border/40">
            <div v-if="port" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
              <InfoRow label="港口名称" :value="port.portName" />
              <InfoRow label="拥堵情况" :value="congLabel(port.congestion)" />
              <InfoRow label="装卸效率" :value="port.efficiency" />
              <InfoRow label="等待时间" :value="`${fmtNum(port.waitHours)} 小时`" />
              <InfoRow label="码头" :value="port.wharf || '—'" />
              <InfoRow label="泊位" :value="port.berth || '—'" />
              <div class="col-span-full"><InfoRow label="堆场" :value="port.yard || '—'" /></div>
            </div>
            <p v-else class="text-sm text-apple-subtext py-2">尚未录入港口信息</p>
          </div>
        </section>

        <!-- 运输组织方案（运力信息 + 运输方案 整合） -->
        <section class="card overflow-hidden">
          <button @click="transportOpen = !transportOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-apple-purple/10 text-apple-purple"><Icon name="route" :size="16" /></div>
              <div class="text-left">
                <h2 class="text-sm font-semibold text-apple-text">运输组织方案</h2>
                <p class="text-xs text-apple-subtext mt-0.5">
                  {{ capacities.length > 0
                    ? `${capacities.length} 条通道 · 总运费 ${fmtMoney(totalFreight)} · 运输时间 ${maxLeadTime} 天`
                    : '未填写' }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <RouterLink :to="`/orders/${order.id}/capacity`" class="btn-ghost text-xs" @click.stop>{{ capacities.length > 0 ? '编辑' : '去录入' }} <Icon name="chevron-right" :size="13" /></RouterLink>
              <Icon name="chevron-right" :size="16" class="text-apple-subtext transition-transform duration-300" :class="transportOpen ? 'rotate-90' : ''" />
            </div>
          </button>
          <div v-show="transportOpen" class="px-5 pb-5 pt-4 border-t border-apple-border/40">
            <div v-if="capacities.length > 0">
              <!-- 核心指标 -->
              <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div class="rounded-apple-lg bg-gradient-to-br from-apple-blue/10 to-transparent border border-apple-blue/20 px-4 py-3">
                  <div class="flex items-center gap-1.5 text-[11px] text-apple-subtext">
                    <Icon name="dollar" :size="12" class="text-apple-blue" />
                    <span>总运费</span>
                  </div>
                  <div class="text-lg font-bold text-apple-blue mt-1 tracking-tight">{{ fmtMoney(totalFreight) }}</div>
                </div>
                <div class="rounded-apple-lg bg-gradient-to-br from-apple-purple/10 to-transparent border border-apple-purple/20 px-4 py-3">
                  <div class="flex items-center gap-1.5 text-[11px] text-apple-subtext">
                    <Icon name="clock" :size="12" class="text-apple-purple" />
                    <span>运输时间</span>
                  </div>
                  <div class="text-lg font-bold text-apple-purple mt-1 tracking-tight">{{ maxLeadTime }}<span class="text-xs font-medium ml-0.5">天</span></div>
                </div>
                <div class="rounded-apple-lg bg-gradient-to-br from-apple-green/10 to-transparent border border-apple-green/20 px-4 py-3">
                  <div class="flex items-center gap-1.5 text-[11px] text-apple-subtext">
                    <Icon name="layers" :size="12" class="text-apple-green" />
                    <span>总闲置运力</span>
                  </div>
                  <div class="text-lg font-bold text-apple-green mt-1 tracking-tight">{{ fmtNum(totalIdle) }}<span class="text-xs font-medium ml-0.5">吨/天</span></div>
                </div>
                <div class="rounded-apple-lg bg-gradient-to-br from-apple-orange/10 to-transparent border border-apple-orange/20 px-4 py-3">
                  <div class="flex items-center gap-1.5 text-[11px] text-apple-subtext">
                    <Icon name="package" :size="12" class="text-apple-orange" />
                    <span>货物分配</span>
                  </div>
                  <div class="text-lg font-bold text-apple-orange mt-1 tracking-tight">{{ fmtNum(allocatedQty) }}<span class="text-xs font-medium ml-0.5">/ {{ fmtNum(cargoTotal) }} 吨</span></div>
                </div>
              </div>

              <!-- 通道明细表 -->
              <div class="overflow-x-auto -mx-1 px-1">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                      <th class="py-2 pr-3 font-medium">通道</th>
                      <th class="py-2 pr-3 font-medium">路线</th>
                      <th class="py-2 pr-3 font-medium">运力</th>
                      <th class="py-2 pr-3 font-medium">计划运输量</th>
                      <th class="py-2 pr-3 font-medium">运价</th>
                      <th class="py-2 pr-3 font-medium">时效</th>
                      <th class="py-2 pr-3 font-medium">运费</th>
                      <th class="py-2 pr-3 font-medium">承运商</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in capacities" :key="c.id" class="border-b border-apple-border/40 last:border-0">
                      <td class="py-2.5 pr-3">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" :style="{ backgroundColor: CHANNEL_META[c.channelType as ChannelType].color + '1a', color: CHANNEL_META[c.channelType as ChannelType].color }">{{ CHANNEL_META[c.channelType as ChannelType].short }}</span>
                      </td>
                      <td class="py-2.5 pr-3 text-apple-text">{{ c.origin || '—' }}{{ c.transfer ? ` → ${c.transfer}` : '' }} → {{ c.destination || '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-text">{{ c.idleCapacity ? `${fmtNum(c.idleCapacity)} 吨/天` : '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-text font-medium">{{ c.plannedQty ? `${fmtNum(c.plannedQty)} 吨` : '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-text">{{ c.price ? `${fmtNum(c.price)} 元/吨` : '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-text">{{ c.leadTime ? `${c.leadTime} 天` : '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-text font-semibold">{{ c.plannedQty && c.price ? fmtMoney(c.plannedQty * c.price) : '—' }}</td>
                      <td class="py-2.5 pr-3 text-apple-subtext">{{ c.carrier || '—' }}{{ c.roadCarrier ? ` / ${c.roadCarrier}` : '' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 历史方案批次（兼容显示） -->
              <div v-if="plan && plan.batches.length > 0" class="mt-4 pt-4 border-t border-apple-border/40">
                <div class="text-[11px] text-apple-subtext mb-2">历史方案批次</div>
                <div class="overflow-x-auto -mx-1 px-1">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                        <th class="py-2 pr-3 font-medium">批次</th><th class="py-2 pr-3 font-medium">运量</th><th class="py-2 pr-3 font-medium">通道</th><th class="py-2 pr-3 font-medium">时效</th><th class="py-2 pr-3 font-medium">运价</th><th class="py-2 pr-3 font-medium">运费</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(b, i) in plan.batches" :key="i" class="border-b border-apple-border/40 last:border-0">
                        <td class="py-2.5 pr-3 text-apple-text font-medium">{{ b.batchNo }}</td>
                        <td class="py-2.5 pr-3 text-apple-text">{{ fmtNum(b.qty) }} 吨</td>
                        <td class="py-2.5 pr-3"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" :style="{ backgroundColor: CHANNEL_META[b.channelType].color + '1a', color: CHANNEL_META[b.channelType].color }">{{ CHANNEL_META[b.channelType].short }}</span></td>
                        <td class="py-2.5 pr-3 text-apple-text">{{ b.leadTime }} 天</td>
                        <td class="py-2.5 pr-3 text-apple-text">{{ fmtNum(b.price) }} 元/吨</td>
                        <td class="py-2.5 pr-3 text-apple-text font-semibold">{{ fmtMoney(b.qty * b.price) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p class="text-[11px] text-apple-subtext mt-2">方案更新于 {{ fmtDate(plan.updatedAt) }}</p>
              </div>
            </div>
            <p v-else class="text-sm text-apple-subtext py-2">尚未录入运输组织方案，请前往运力信息页面录入运输通道及计划。</p>
          </div>
        </section>
      </div>

      <!-- ============ 财务状态 ============ -->
      <div v-else-if="activeTab === 'finance'" key="finance" class="space-y-3">
        <!-- 收款概览 -->
        <div class="grid sm:grid-cols-3 gap-3">
          <div class="card p-4">
            <div class="text-xs text-apple-subtext">总金额</div>
            <div class="text-xl font-bold text-apple-text mt-1">{{ fmtMoney(financial.totalAmount) }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-apple-subtext">已收金额</div>
            <div class="text-xl font-bold text-apple-green mt-1">{{ fmtMoney(financial.receivedAmount) }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-apple-subtext">未收金额</div>
            <div class="text-xl font-bold text-apple-red mt-1">{{ fmtMoney(financial.totalAmount - financial.receivedAmount) }}</div>
          </div>
        </div>

        <div class="card p-5 space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <h3 class="text-sm font-semibold text-apple-text">财务信息</h3>
            <div class="flex items-center gap-2">
              <button @click="saveFinancial" class="btn-secondary text-xs">
                <Icon name="save" :size="14" />
                保存财务信息
              </button>
            </div>
          </div>

          <!-- 操作说明 -->
          <div class="rounded-apple-lg bg-apple-blue/[0.04] border border-apple-blue/15 px-4 py-2.5 flex items-start gap-2.5">
            <Icon name="info" :size="14" class="text-apple-blue shrink-0 mt-0.5" />
            <div class="text-[11px] text-apple-subtext leading-relaxed">
              <span class="text-apple-text font-medium">「保存财务信息」</span>仅保存当前填写的金额、收款状态和凭证，不改变订单状态。
              <span class="text-apple-text font-medium">「确认收款」</span>在下方操作区，确认收款后订单状态将从"待确认"流转至"订单已确认"，进入发运环节。
            </div>
          </div>

          <!-- 操作反馈提示 -->
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 -translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
          >
            <div v-if="financeTip.show" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium animate-fade-in"
              :class="{
                'bg-apple-green/10 text-apple-green border border-apple-green/20': financeTip.type === 'success',
                'bg-apple-red/10 text-apple-red border border-apple-red/20': financeTip.type === 'error',
                'bg-apple-blue/10 text-apple-blue border border-apple-blue/20': financeTip.type === 'info',
              }">
              <Icon :name="financeTip.type === 'success' ? 'check-circle' : financeTip.type === 'error' ? 'alert' : 'info'" :size="14" />
              {{ financeTip.msg }}
            </div>
          </Transition>

          <!-- 金额输入 -->
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="field-label flex items-center gap-1.5">
                总金额（元）
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">系统自动计算</span>
              </label>
              <div class="field-input flex items-center justify-between bg-gray-50 cursor-not-allowed">
                <span class="text-apple-text font-semibold">{{ fmtMoney(financial.totalAmount) }}</span>
                <span class="text-[10px] text-apple-subtext flex items-center gap-1">
                  <Icon name="info" :size="11" /> 基于运输方案运费汇总
                </span>
              </div>
            </div>
            <div>
              <label class="field-label">已收金额（元）</label>
              <input type="number" v-model.number="financial.receivedAmount" class="field-input" placeholder="如：2500000" />
            </div>
          </div>

          <!-- 收款状态 -->
          <div>
            <label class="field-label">收款状态</label>
            <div class="flex items-center gap-2">
              <button v-for="(m, k) in PAYMENT_META" :key="k" @click="setPaymentStatus(k as PaymentStatus)"
                class="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
                :class="financial.paymentStatus === k ? 'text-white shadow-sm' : 'text-apple-subtext border border-apple-border/50 hover:text-apple-text'"
                :style="financial.paymentStatus === k ? { backgroundColor: m.color } : {}">
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- 发票状态 -->
          <div>
            <label class="field-label">发票/收据状态</label>
            <div class="flex items-center gap-2">
              <button v-for="(m, k) in INVOICE_META" :key="k" @click="setInvoiceStatus(k as InvoiceStatus)"
                class="px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-200"
                :class="financial.invoiceStatus === k ? 'text-white shadow-sm' : 'text-apple-subtext border border-apple-border/50 hover:text-apple-text'"
                :style="financial.invoiceStatus === k ? { backgroundColor: m.color } : {}">
                {{ m.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="field-label">备注</label>
            <textarea v-model="financial.remark" class="field-input" rows="2" placeholder="财务备注信息"></textarea>
          </div>
        </div>

        <!-- 财务凭证 -->
        <div class="card p-5 space-y-3">
          <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2"><Icon name="paperclip" :size="15" class="text-apple-subtext" /> 财务凭证</h3>
          <!-- 凭证列表 -->
          <div v-if="financial.vouchers.length > 0" class="space-y-2">
            <div v-for="v in financial.vouchers" :key="v.id" class="flex items-center gap-3 p-2.5 rounded-apple bg-gray-50/60 border border-apple-border/40">
              <Icon name="file-text" :size="15" class="text-apple-blue shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="text-sm text-apple-text font-medium truncate">{{ v.name }}</div>
                <div class="text-[11px] text-apple-subtext">{{ v.type }} · {{ v.uploadedBy }} · {{ fmtDate(v.uploadedAt) }}</div>
              </div>
              <button @click="removeFinancialVoucher(v.id)" class="text-apple-subtext hover:text-apple-red transition-colors shrink-0"><Icon name="x" :size="15" /></button>
            </div>
          </div>
          <p v-else class="text-xs text-apple-subtext py-2">暂无凭证</p>
          <!-- 上传凭证 -->
          <div class="pt-3 border-t border-apple-border/40 space-y-2">
            <div class="grid sm:grid-cols-2 gap-2">
              <input v-model="getVoucherForm('financial').name" class="field-input" placeholder="凭证名称，如：增值税发票" />
              <select v-model="getVoucherForm('financial').type" class="field-input">
                <option v-for="t in VOUCHER_TYPES" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input type="file" @change="handleFileSelect($event, getVoucherForm('financial'))" class="text-xs text-apple-subtext file:mr-2 file:py-1 file:px-2 file:rounded-apple file:border-0 file:bg-apple-blue/10 file:text-apple-blue" />
              <input v-model="getVoucherForm('financial').note" class="field-input flex-1" placeholder="备注（选填）" />
              <button @click="addFinancialVoucher" class="btn-secondary text-xs shrink-0"><Icon name="plus" :size="14" /> 添加</button>
            </div>
          </div>
        </div>

        <!-- 财务确认收款（状态流转，关键操作） -->
        <div v-if="canConfirmPayment" class="card p-5 border-2 border-apple-orange/30 bg-gradient-to-br from-apple-orange/[0.06] to-transparent">
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="flex items-start gap-3">
              <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-orange/15 text-apple-orange shrink-0">
                <Icon name="check-circle" :size="20" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                  财务确认收款
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-apple-orange/15 text-apple-orange font-medium">关键操作</span>
                </h3>
                <p class="text-xs text-apple-subtext mt-1 leading-relaxed">
                  点击确认后，订单状态将从<span class="text-apple-orange font-medium">"待确认"</span>流转至<span class="text-apple-green font-medium">"订单已确认"</span>，解锁发运操作权限。<br />
                  此操作不可逆，请确保已核实收款金额与凭证。
                </p>
              </div>
            </div>
            <button @click="confirmPayment" :disabled="confirmingPayment" class="btn-primary text-xs bg-apple-orange hover:bg-apple-orange/90 shrink-0">
              <Icon v-if="confirmingPayment" name="clock" :size="14" class="animate-spin" />
              <Icon v-else name="check-circle" :size="14" />
              {{ confirmingPayment ? '确认中…' : '确认收款' }}
            </button>
          </div>
        </div>
        <div v-else-if="currentStatus === 'confirmed' || currentStatus === 'shipping' || currentStatus === 'shipped' || currentStatus === 'completed'" class="card p-4 border border-apple-green/20 bg-apple-green/[0.03]">
          <p class="text-xs text-apple-green flex items-center gap-1.5">
            <Icon name="check-circle" :size="14" />
            财务已确认收款，订单已进入发运环节
            <span class="text-apple-subtext ml-2">· 确认时间 {{ fmtDate(financial.updatedAt) }}</span>
          </p>
        </div>
      </div>

      <!-- ============ 发运操作（工作人员操作界面） ============ -->
      <div v-else-if="activeTab === 'shipping'" key="shipping" class="space-y-3">
        <!-- 不可发运提示 -->
        <div v-if="!canShip && currentStatus !== 'shipped' && currentStatus !== 'completed'" class="card p-5">
          <EmptyState icon="info" title="暂不可发运" desc="需财务确认收款后，订单进入「订单已确认」状态方可进行发运操作。">
            <button @click="activeTab = 'finance'" class="btn-primary text-xs">前往财务确认</button>
          </EmptyState>
        </div>

        <template v-else>
          <!-- 权限提示 -->
          <div v-if="!canEditShipping" class="card p-4 border border-apple-orange/20 bg-apple-orange/[0.04]">
            <p class="text-xs text-apple-orange flex items-center gap-1.5">
              <Icon name="info" :size="14" />
              当前角色为「{{ ROLE_META[currentRole].label }}」，仅可查看发运信息。切换为「运输人员」或「管理员」角色方可执行发货操作。
            </p>
          </div>

          <div v-if="channelGroups.length === 0" class="card p-5">
            <EmptyState icon="train" title="暂无运输通道" desc="请先在运力信息中录入运输通道。" />
          </div>

          <template v-else>
            <!-- 1. 订单发运总览（精简，去除重复） -->
            <div class="card p-5">
              <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
                <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                  <Icon name="route" :size="16" class="text-apple-subtext" />
                  发运总览
                </h3>
                <button @click="activeTab = 'cargo'" class="text-[11px] text-apple-blue font-medium hover:underline flex items-center gap-1">
                  查看货物动态 <Icon name="arrow-right" :size="11" />
                </button>
              </div>
              <!-- 单行进度条 + 关键数据 -->
              <div class="grid grid-cols-3 gap-3 mb-3">
                <div class="text-center">
                  <div class="text-[11px] text-apple-subtext">订单总量</div>
                  <div class="text-lg font-bold text-apple-text mt-0.5">{{ fmtNum(cargoTotal) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
                <div class="text-center">
                  <div class="text-[11px] text-apple-blue">已发运</div>
                  <div class="text-lg font-bold text-apple-blue mt-0.5">{{ fmtNum(shippingStats.shipped) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
                <div class="text-center">
                  <div class="text-[11px] text-apple-subtext">未发运</div>
                  <div class="text-lg font-bold text-apple-subtext mt-0.5">{{ fmtNum(Math.max(0, shippingStats.planned - shippingStats.shipped)) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
              </div>
              <!-- 发运进度条 -->
              <div class="h-2.5 rounded-full bg-gray-200/60 overflow-hidden">
                <div class="h-full bg-apple-blue transition-all duration-500" :style="{ width: pct(shippingStats.shipped, shippingStats.planned) + '%' }"></div>
              </div>
              <div class="flex items-center gap-4 mt-2 text-[10px] text-apple-subtext">
                <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue"></span>已发运 {{ pct(shippingStats.shipped, shippingStats.planned) }}%</span>
                <span class="ml-auto">通道 {{ shippingStats.total }}（发运中 {{ shippingStats.shippingChannels }} / 已完成 {{ shippingStats.completedChannels }}）</span>
              </div>
            </div>

            <!-- 2. 批次发货操作区（核心功能） -->
            <div v-if="canEditShipping" class="card p-5 border-2 border-apple-blue/20 bg-gradient-to-br from-apple-blue/[0.03] to-transparent">
              <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
                <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                  <div class="flex items-center justify-center w-7 h-7 rounded-apple bg-apple-blue/15 text-apple-blue">
                    <Icon name="send" :size="14" />
                  </div>
                  批次发货操作
                  <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">核心功能</span>
                </h3>
              </div>

              <!-- 操作指南 -->
              <div class="rounded-apple-lg bg-white/60 border border-apple-border/40 px-3 py-2 mb-4 text-[11px] text-apple-subtext leading-relaxed">
                <span class="text-apple-text font-medium">操作说明：</span>
                选择运输通道 → 填写本次发货量（吨）→ 上传发运凭证 → 点击「执行发货」。
                系统将自动累加发运数量、更新货物状态、记录操作日志，并同步至「货物动态」标签页。
                <span class="text-apple-blue">注：到货入库和提货出关请前往「仓储堆存」标签页操作。</span>
              </div>

              <!-- 发货表单 -->
              <div class="space-y-3">
                <!-- 通道选择 -->
                <div>
                  <label class="field-label">运输通道 <span class="text-apple-red">*</span></label>
                  <select v-model="batchForm.capacityId" class="field-input">
                    <option value="" disabled>请选择运输通道</option>
                    <option v-for="ch in availableChannels" :key="ch.id" :value="ch.id">{{ ch.label }}（剩余可发运 {{ fmtNum(ch.unshipped) }}吨）</option>
                  </select>
                </div>

                <!-- 选中通道的实时状态 -->
                <div v-if="batchForm.capacityId" class="grid grid-cols-3 gap-2">
                  <div class="rounded-apple bg-white/60 px-3 py-2 border border-apple-border/40 text-center">
                    <div class="text-[10px] text-apple-subtext">通道总量</div>
                    <div class="text-sm font-bold text-apple-text">{{ fmtNum(shippingOf(batchForm.capacityId)?.plannedQty || 0) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                  </div>
                  <div class="rounded-apple bg-apple-blue/5 px-3 py-2 border border-apple-blue/15 text-center">
                    <div class="text-[10px] text-apple-blue">已发运</div>
                    <div class="text-sm font-bold text-apple-blue">{{ fmtNum(shippingOf(batchForm.capacityId)?.shippedQty || 0) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                  </div>
                  <div class="rounded-apple bg-gray-50 px-3 py-2 border border-apple-border/40 text-center">
                    <div class="text-[10px] text-apple-subtext">剩余可发运</div>
                    <div class="text-sm font-bold text-apple-subtext">{{ fmtNum(selectedChannelUnshipped) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                  </div>
                </div>

                <!-- 操作数量输入 -->
                <div class="grid sm:grid-cols-2 gap-2">
                  <div>
                    <label class="field-label flex items-center gap-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-apple-blue"></span>
                      本次发货量（吨）<span class="text-apple-red">*</span>
                    </label>
                    <input type="number" v-model.number="batchForm.shipQty" min="0" :max="selectedChannelUnshipped" class="field-input" placeholder="如：20000" />
                    <p class="text-[9px] text-apple-subtext mt-0.5">从港口发运的货物量</p>
                  </div>
                  <div>
                    <label class="field-label flex items-center gap-1">
                      <Icon name="clock" :size="10" />
                      发货时间
                    </label>
                    <input type="datetime-local" v-model="batchForm.shipDate" class="field-input" />
                    <p class="text-[9px] text-apple-subtext mt-0.5">本次操作的时间记录</p>
                  </div>
                </div>

                <!-- 凭证上传 -->
                <div class="grid sm:grid-cols-3 gap-2">
                  <div>
                    <label class="field-label">发运凭证名称</label>
                    <input v-model="batchForm.voucherName" class="field-input" placeholder="如：请车计划、运单编号" />
                  </div>
                  <div>
                    <label class="field-label">凭证类型</label>
                    <select v-model="batchForm.voucherType" class="field-input">
                      <option v-for="t in VOUCHER_TYPES" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="field-label">备注</label>
                    <input v-model="batchForm.remark" class="field-input" placeholder="选填" />
                  </div>
                </div>

                <!-- 反馈提示 -->
                <Transition
                  enter-active-class="transition duration-300 ease-out"
                  enter-from-class="opacity-0 -translate-y-1"
                  enter-to-class="opacity-100 translate-y-0"
                  leave-active-class="transition duration-200 ease-in"
                  leave-from-class="opacity-100"
                  leave-to-class="opacity-0"
                >
                  <div v-if="batchTip.show" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium"
                    :class="{
                      'bg-apple-green/10 text-apple-green border border-apple-green/20': batchTip.type === 'success',
                      'bg-apple-red/10 text-apple-red border border-apple-red/20': batchTip.type === 'error',
                    }">
                    <Icon :name="batchTip.type === 'success' ? 'check-circle' : 'alert'" :size="14" />
                    {{ batchTip.msg }}
                  </div>
                </Transition>

                <!-- 执行按钮 -->
                <div class="flex items-center justify-end gap-2 pt-2 border-t border-apple-border/40">
                  <button @click="executeBatchShip" class="btn-primary">
                    <Icon name="send" :size="15" />
                    执行发货
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. 各通道发运状态（精简展示，去除重复） -->
            <div class="card p-5">
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
                <Icon name="layers" :size="15" class="text-apple-subtext" />
                各通道发运状态
              </h3>
              <div class="space-y-2.5">
                <div v-for="t in channelCargoTracking" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
                  <!-- 通道头 -->
                  <div class="flex items-center justify-between gap-3 px-4 py-3" :style="{ borderLeft: `3px solid ${t.channelColor}` }">
                    <div class="flex items-center gap-2.5 flex-1 min-w-0">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
                      <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <Badge :label="SHIPPING_META[t.shipping.state].label" :color="SHIPPING_META[t.shipping.state].color" :bg="SHIPPING_META[t.shipping.state].bg" />
                    </div>
                  </div>
                  <!-- 通道数据（仅3项核心数据） -->
                  <div class="px-4 py-2.5 bg-gray-50/30 border-t border-apple-border/30">
                    <div class="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div class="text-[10px] text-apple-subtext">通道总量</div>
                        <div class="text-apple-text font-semibold mt-0.5">{{ fmtNum(t.planned) }}<span class="text-[9px] font-normal">吨</span></div>
                      </div>
                      <div>
                        <div class="text-[10px] text-apple-blue">已发运</div>
                        <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.shipped) }}<span class="text-[9px] font-normal">吨</span></div>
                      </div>
                      <div>
                        <div class="text-[10px] text-apple-subtext">未发运</div>
                        <div class="text-apple-subtext font-semibold mt-0.5">{{ fmtNum(t.unshipped) }}<span class="text-[9px] font-normal">吨</span></div>
                      </div>
                    </div>
                    <!-- 发运进度条 -->
                    <div class="h-1.5 rounded-full bg-gray-200/60 overflow-hidden mt-2">
                      <div class="h-full bg-apple-blue transition-all duration-500" :style="{ width: pct(t.shipped, t.planned) + '%' }"></div>
                    </div>
                    <!-- 发运时间 + 凭证数 -->
                    <div class="flex items-center gap-3 mt-2 text-[10px] text-apple-subtext">
                      <span v-if="t.shipping.actualDate" class="flex items-center gap-1 text-apple-green"><Icon name="check-circle" :size="10" /> 实际发运 {{ fmtDate(t.shipping.actualDate) }}</span>
                      <span v-else-if="t.shipping.planDate" class="flex items-center gap-1"><Icon name="clock" :size="10" /> 计划发运 {{ fmtDate(t.shipping.planDate) }}</span>
                      <span v-if="t.shipping.vouchers.length > 0" class="flex items-center gap-1"><Icon name="paperclip" :size="10" /> {{ t.shipping.vouchers.length }} 个凭证</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 4. 最近发运记录（从操作日志提取） -->
            <div v-if="shippingLogs.length > 0" class="card p-5">
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
                <Icon name="history" :size="15" class="text-apple-subtext" />
                最近发运记录
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">{{ shippingLogs.length }}</span>
                <button @click="activeTab = 'log'" class="ml-auto text-[11px] text-apple-blue font-medium hover:underline">查看全部</button>
              </h3>
              <div class="space-y-2">
                <div v-for="log in shippingLogs.slice(0, 5)" :key="log.id" class="flex items-start gap-2.5 p-2.5 rounded-apple bg-gray-50/40 border border-apple-border/30">
                  <div class="w-2 h-2 rounded-full mt-1.5 shrink-0" :style="{ backgroundColor: ROLE_META[log.role].color }"></div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-xs text-apple-text font-medium">{{ log.action }}</span>
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                        :style="{ backgroundColor: ROLE_META[log.role].color + '1a', color: ROLE_META[log.role].color }">
                        {{ ROLE_META[log.role].label }}
                      </span>
                    </div>
                    <p v-if="log.remark" class="text-[11px] text-apple-subtext mt-0.5">{{ log.remark }}</p>
                    <div class="text-[10px] text-apple-subtext mt-0.5">{{ log.operator }} · {{ fmtDate(log.createdAt) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>

      <!-- ============ 仓储堆存（仓储人员操作界面） ============ -->
      <div v-else-if="activeTab === 'warehouse'" key="warehouse" class="space-y-3">
        <!-- 导航提示 -->
        <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1">
          <Icon name="info" :size="12" />
          <span>仓储堆存管理 · 发货操作请前往</span>
          <button @click="activeTab = 'shipping'" class="text-apple-blue font-medium hover:underline">「发运状态」</button>
          <span>· 综合数据查看</span>
          <button @click="activeTab = 'cargo'" class="text-apple-blue font-medium hover:underline">「货物动态」</button>
        </div>

        <!-- 无可仓储通道提示 -->
        <div v-if="warehouseChannels.length === 0" class="card p-5">
          <EmptyState icon="info" title="暂无可操作的通道" desc="需要先在「发运状态」中执行发货操作，通道有已发运量后方可进行仓储管理。" />
        </div>

        <template v-else>
          <!-- 1. 仓储总览 -->
          <div class="card p-5">
            <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                <Icon name="package" :size="16" class="text-apple-subtext" />
                仓储总览
              </h3>
              <button @click="activeTab = 'cargo'" class="text-[11px] text-apple-blue font-medium hover:underline flex items-center gap-1">
                查看货物动态 <Icon name="arrow-right" :size="11" />
              </button>
            </div>
            <!-- 3项核心数据 -->
            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-apple-lg border border-apple-blue/20 bg-apple-blue/[0.04] p-3.5 text-center">
                <div class="text-[11px] text-apple-subtext">在途运输量</div>
                <div class="text-lg font-bold text-apple-blue mt-1">{{ fmtNum(inTransitQty) }}<span class="text-xs font-normal ml-1">吨</span></div>
              </div>
              <div class="rounded-apple-lg border border-apple-orange/20 bg-apple-orange/[0.04] p-3.5 text-center">
                <div class="text-[11px] text-apple-subtext">仓储堆存量</div>
                <div class="text-lg font-bold text-apple-orange mt-1">{{ fmtNum(shippingStats.stored) }}<span class="text-xs font-normal ml-1">吨</span></div>
              </div>
              <div class="rounded-apple-lg border border-apple-green/20 bg-apple-green/[0.04] p-3.5 text-center">
                <div class="text-[11px] text-apple-subtext">已提货出关</div>
                <div class="text-lg font-bold text-apple-green mt-1">{{ fmtNum(shippingStats.pickedUp) }}<span class="text-xs font-normal ml-1">吨</span></div>
              </div>
            </div>
            <!-- 数据流转关系说明 -->
            <div class="mt-3 text-[10px] text-apple-subtext flex items-center gap-2 flex-wrap">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue"></span>在途运输</span>
              <Icon name="arrow-right" :size="10" />
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-orange"></span>到货入库（堆存）</span>
              <Icon name="arrow-right" :size="10" />
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-green"></span>提货出关</span>
            </div>
          </div>

          <!-- 2. 仓储操作区（核心功能） -->
          <div v-if="canEditShipping" class="card p-5 border-2 border-apple-orange/20 bg-gradient-to-br from-apple-orange/[0.03] to-transparent">
            <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
              <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
                <div class="flex items-center justify-center w-7 h-7 rounded-apple bg-apple-orange/15 text-apple-orange">
                  <Icon name="package" :size="14" />
                </div>
                仓储操作
                <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-orange/10 text-apple-orange font-medium">核心功能</span>
              </h3>
            </div>

            <!-- 操作指南 -->
            <div class="rounded-apple-lg bg-white/60 border border-apple-border/40 px-3 py-2 mb-4 text-[11px] text-apple-subtext leading-relaxed">
              <span class="text-apple-text font-medium">操作说明：</span>
              选择已有发运记录的运输通道 → 填写到货入库量（货物到达终点站）和/或提货出关量（客户提货）→ 上传凭证 → 点击「执行操作」。
              <span class="text-apple-orange">注：在途运输量 = 发运量 - 仓储堆存量 - 已提货出关量，到货入库量不能超过在途运输量。</span>
            </div>

            <!-- 仓储表单 -->
            <div class="space-y-3">
              <!-- 通道选择 -->
              <div>
                <label class="field-label">运输通道 <span class="text-apple-red">*</span></label>
                <select v-model="warehouseForm.capacityId" class="field-input">
                  <option value="" disabled>请选择运输通道（仅显示已发运通道）</option>
                  <option v-for="ch in warehouseChannels" :key="ch.id" :value="ch.id">{{ ch.label }}（已发运 {{ fmtNum(ch.shipped) }}吨，堆存 {{ fmtNum(ch.stored) }}吨）</option>
                </select>
              </div>

              <!-- 选中通道的实时状态 -->
              <div v-if="warehouseForm.capacityId" class="grid grid-cols-3 gap-2">
                <div class="rounded-apple bg-apple-blue/5 px-3 py-2 border border-apple-blue/15 text-center">
                  <div class="text-[10px] text-apple-blue">在途运输</div>
                  <div class="text-sm font-bold text-apple-blue">{{ fmtNum(selectedChannelShippedForWarehouse - selectedChannelStoredForWarehouse - (shippingOf(warehouseForm.capacityId)?.pickedUpQty || 0)) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
                <div class="rounded-apple bg-apple-orange/5 px-3 py-2 border border-apple-orange/15 text-center">
                  <div class="text-[10px] text-apple-orange">仓储堆存</div>
                  <div class="text-sm font-bold text-apple-orange">{{ fmtNum(selectedChannelStoredForWarehouse) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
                <div class="rounded-apple bg-apple-green/5 px-3 py-2 border border-apple-green/15 text-center">
                  <div class="text-[10px] text-apple-green">已提货</div>
                  <div class="text-sm font-bold text-apple-green">{{ fmtNum(shippingOf(warehouseForm.capacityId)?.pickedUpQty || 0) }}<span class="text-[10px] font-normal ml-0.5">吨</span></div>
                </div>
              </div>

              <!-- 操作数量输入 -->
              <div class="grid sm:grid-cols-3 gap-2">
                <div>
                  <label class="field-label flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-apple-orange"></span>
                    到货入库量（吨）
                  </label>
                  <input type="number" v-model.number="warehouseForm.arriveQty" min="0" class="field-input" placeholder="如：20000" />
                  <p class="text-[9px] text-apple-subtext mt-0.5">货物到达终点站入仓</p>
                </div>
                <div>
                  <label class="field-label flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-apple-green"></span>
                    提货出关量（吨）
                  </label>
                  <input type="number" v-model.number="warehouseForm.pickupQty" min="0" :max="selectedChannelStoredForWarehouse + warehouseForm.arriveQty" class="field-input" placeholder="如：15000" />
                  <p class="text-[9px] text-apple-subtext mt-0.5">客户从堆场提货出关</p>
                </div>
                <div>
                  <label class="field-label flex items-center gap-1">
                    <Icon name="clock" :size="10" />
                    操作时间
                  </label>
                  <input type="datetime-local" v-model="warehouseForm.operateDate" class="field-input" />
                  <p class="text-[9px] text-apple-subtext mt-0.5">本次操作的时间记录</p>
                </div>
              </div>

              <!-- 凭证上传 -->
              <div class="grid sm:grid-cols-3 gap-2">
                <div>
                  <label class="field-label">仓储凭证名称</label>
                  <input v-model="warehouseForm.voucherName" class="field-input" placeholder="如：入库单、提货单" />
                </div>
                <div>
                  <label class="field-label">凭证类型</label>
                  <select v-model="warehouseForm.voucherType" class="field-input">
                    <option v-for="t in VOUCHER_TYPES" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">备注</label>
                  <input v-model="warehouseForm.remark" class="field-input" placeholder="选填" />
                </div>
              </div>

              <!-- 反馈提示 -->
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-1"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
              >
                <div v-if="warehouseTip.show" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium"
                  :class="{
                    'bg-apple-green/10 text-apple-green border border-apple-green/20': warehouseTip.type === 'success',
                    'bg-apple-red/10 text-apple-red border border-apple-red/20': warehouseTip.type === 'error',
                  }">
                  <Icon :name="warehouseTip.type === 'success' ? 'check-circle' : 'alert'" :size="14" />
                  {{ warehouseTip.msg }}
                </div>
              </Transition>

              <!-- 执行按钮 -->
              <div class="flex items-center justify-end gap-2 pt-2 border-t border-apple-border/40">
                <button @click="executeWarehouseOp" class="btn-primary bg-apple-orange hover:bg-apple-orange/90">
                  <Icon name="package" :size="15" />
                  执行操作
                </button>
              </div>
            </div>
          </div>

          <!-- 3. 各通道仓储状态 -->
          <div class="card p-5">
            <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2 mb-4">
              <Icon name="layers" :size="15" class="text-apple-subtext" />
              各通道仓储状态
            </h3>
            <div class="space-y-2.5">
              <div v-for="t in channelCargoTracking.filter((x) => x.shipped > 0)" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
                <!-- 通道头 -->
                <div class="flex items-center justify-between gap-3 px-4 py-3" :style="{ borderLeft: `3px solid ${t.channelColor}` }">
                  <div class="flex items-center gap-2.5 flex-1 min-w-0">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
                    <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
                  </div>
                </div>
                <!-- 通道仓储数据 -->
                <div class="px-4 py-2.5 bg-gray-50/30 border-t border-apple-border/30">
                  <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <div class="text-[10px] text-apple-blue">在途运输</div>
                      <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.inTransit) }}<span class="text-[9px] font-normal">吨</span></div>
                    </div>
                    <div>
                      <div class="text-[10px] text-apple-orange">仓储堆存</div>
                      <div class="text-apple-orange font-semibold mt-0.5">{{ fmtNum(t.stored) }}<span class="text-[9px] font-normal">吨</span></div>
                    </div>
                    <div>
                      <div class="text-[10px] text-apple-green">已提货出关</div>
                      <div class="text-apple-green font-semibold mt-0.5">{{ fmtNum(t.pickedUp) }}<span class="text-[9px] font-normal">吨</span></div>
                    </div>
                  </div>
                  <!-- 堆叠进度条 -->
                  <div class="h-1.5 rounded-full bg-gray-200/60 overflow-hidden flex mt-2">
                    <div class="h-full bg-apple-green transition-all duration-500" :style="{ width: pct(t.pickedUp, t.planned) + '%' }"></div>
                    <div class="h-full bg-apple-orange transition-all duration-500" :style="{ width: pct(t.stored, t.planned) + '%' }"></div>
                    <div class="h-full bg-apple-blue/40 transition-all duration-500" :style="{ width: pct(t.inTransit, t.planned) + '%' }"></div>
                  </div>
                  <div class="flex items-center gap-4 mt-2 text-[10px] text-apple-subtext">
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-blue/40"></span>在途 {{ fmtNum(t.inTransit) }}吨</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-orange"></span>堆存 {{ fmtNum(t.stored) }}吨</span>
                    <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-apple-green"></span>提货 {{ fmtNum(t.pickedUp) }}吨</span>
                    <span v-if="t.shipping.vouchers.length > 0" class="ml-auto flex items-center gap-1"><Icon name="paperclip" :size="10" /> {{ t.shipping.vouchers.length }} 个凭证</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- ============ 货物动态 ============ -->
      <div v-else-if="activeTab === 'cargo'" key="cargo" class="space-y-3">
        <!-- 跨标签页导航提示 -->
        <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1 flex-wrap">
          <Icon name="info" :size="12" />
          <span>货物综合数据展示 · 发货操作</span>
          <button @click="activeTab = 'shipping'" class="text-apple-blue font-medium hover:underline">「发运状态」</button>
          <span>· 仓储操作</span>
          <button @click="activeTab = 'warehouse'" class="text-apple-blue font-medium hover:underline">「仓储堆存」</button>
          <span>· 财务确认</span>
          <button @click="activeTab = 'finance'" class="text-apple-blue font-medium hover:underline">「财务状态」</button>
        </div>
        <!-- 1. 初始分配总量 + 货物状态分布概览 -->
        <div class="card overflow-hidden">
          <div class="px-5 py-4 bg-gradient-to-br from-apple-text/[0.03] to-transparent border-b border-apple-border/40">
            <div class="flex items-center justify-between flex-wrap gap-3">
              <div class="flex items-center gap-3">
                <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-text/5 text-apple-text">
                  <Icon name="package" :size="20" />
                </div>
                <div>
                  <div class="text-[11px] text-apple-subtext uppercase tracking-wider">初始分配总量</div>
                  <div class="text-2xl font-bold text-apple-text tracking-tight mt-0.5">
                    {{ fmtNum(cargoDistribution.total) }}<span class="text-sm font-normal text-apple-subtext ml-1">吨</span>
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-4 text-xs">
                <div class="text-center">
                  <div class="text-apple-subtext">已发运</div>
                  <div class="text-lg font-bold text-apple-blue mt-0.5">{{ cargoDistribution.shippedPct }}%</div>
                </div>
                <div class="w-px h-8 bg-apple-border/40"></div>
                <div class="text-center">
                  <div class="text-apple-subtext">已提货出关</div>
                  <div class="text-lg font-bold text-apple-green mt-0.5">{{ cargoDistribution.pickedUpPct }}%</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 堆叠进度条：未发运 → 运输中 → 仓储堆存 → 已提货出关 -->
          <div class="px-5 py-4">
            <div class="flex items-center justify-between text-[11px] text-apple-subtext mb-2">
              <span class="font-medium text-apple-text">货物状态分布</span>
              <span>基于初始分配总量 {{ fmtNum(cargoDistribution.total) }} 吨</span>
            </div>
            <div class="h-7 rounded-apple overflow-hidden flex bg-gray-100/60">
              <div v-if="cargoDistribution.unshipped > 0" class="h-full flex items-center justify-center text-[10px] font-medium text-apple-subtext transition-all duration-500"
                :style="{ width: cargoDistribution.unshippedPct + '%', backgroundColor: '#e5e5ea' }"
                :title="`未发运 ${fmtNum(cargoDistribution.unshipped)} 吨`">
                <span v-if="cargoDistribution.unshippedPct >= 8">{{ cargoDistribution.unshippedPct }}%</span>
              </div>
              <div v-if="cargoDistribution.inTransit > 0" class="h-full flex items-center justify-center text-[10px] font-medium text-white transition-all duration-500"
                :style="{ width: cargoDistribution.inTransitPct + '%', backgroundColor: '#0071e3' }"
                :title="`运输中 ${fmtNum(cargoDistribution.inTransit)} 吨`">
                <span v-if="cargoDistribution.inTransitPct >= 8">{{ cargoDistribution.inTransitPct }}%</span>
              </div>
              <div v-if="cargoDistribution.stored > 0" class="h-full flex items-center justify-center text-[10px] font-medium text-white transition-all duration-500"
                :style="{ width: cargoDistribution.storedPct + '%', backgroundColor: '#ff9500' }"
                :title="`仓储堆存 ${fmtNum(cargoDistribution.stored)} 吨`">
                <span v-if="cargoDistribution.storedPct >= 8">{{ cargoDistribution.storedPct }}%</span>
              </div>
              <div v-if="cargoDistribution.pickedUp > 0" class="h-full flex items-center justify-center text-[10px] font-medium text-white transition-all duration-500"
                :style="{ width: cargoDistribution.pickedUpPct + '%', backgroundColor: '#34c759' }"
                :title="`已提货出关 ${fmtNum(cargoDistribution.pickedUp)} 吨`">
                <span v-if="cargoDistribution.pickedUpPct >= 8">{{ cargoDistribution.pickedUpPct }}%</span>
              </div>
            </div>
            <!-- 图例 -->
            <div class="flex items-center gap-4 mt-2.5 text-[10px] flex-wrap">
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#e5e5ea"></span><span class="text-apple-subtext">未发运</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.unshipped) }} 吨</span></span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#0071e3"></span><span class="text-apple-subtext">运输中</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.inTransit) }} 吨</span></span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#ff9500"></span><span class="text-apple-subtext">仓储堆存</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.stored) }} 吨</span></span>
              <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-sm" style="background:#34c759"></span><span class="text-apple-subtext">已提货出关</span><span class="text-apple-text font-medium">{{ fmtNum(cargoDistribution.pickedUp) }} 吨</span></span>
            </div>
          </div>
        </div>

        <!-- 2. 货物流转状态卡片（四阶段） -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- 未发运 -->
          <div class="card p-4 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-gray-300"></div>
            <div class="flex items-center gap-1.5 text-[11px] text-apple-subtext mb-1">
              <Icon name="clock" :size="12" />
              <span>未发运</span>
            </div>
            <div class="text-2xl font-bold text-apple-subtext tracking-tight">{{ fmtNum(cargoDistribution.unshipped) }}<span class="text-xs font-normal ml-1">吨</span></div>
            <div class="text-[10px] text-apple-subtext mt-1">占总量 {{ cargoDistribution.unshippedPct }}%</div>
          </div>
          <!-- 运输中 -->
          <div class="card p-4 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-apple-blue"></div>
            <div class="flex items-center gap-1.5 text-[11px] text-apple-blue mb-1">
              <Icon name="train" :size="12" />
              <span>运输中</span>
            </div>
            <div class="text-2xl font-bold text-apple-blue tracking-tight">{{ fmtNum(cargoDistribution.inTransit) }}<span class="text-xs font-normal ml-1">吨</span></div>
            <div class="text-[10px] text-apple-subtext mt-1">在途未到站</div>
          </div>
          <!-- 仓储堆存 -->
          <div class="card p-4 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-apple-orange"></div>
            <div class="flex items-center gap-1.5 text-[11px] text-apple-orange mb-1">
              <Icon name="package" :size="12" />
              <span>仓储堆存</span>
            </div>
            <div class="text-2xl font-bold text-apple-orange tracking-tight">{{ fmtNum(cargoDistribution.stored) }}<span class="text-xs font-normal ml-1">吨</span></div>
            <div class="text-[10px] text-apple-subtext mt-1">已到站未提货</div>
          </div>
          <!-- 已提货出关 -->
          <div class="card p-4 relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-1 bg-apple-green"></div>
            <div class="flex items-center gap-1.5 text-[11px] text-apple-green mb-1">
              <Icon name="check-circle" :size="12" />
              <span>已提货出关</span>
            </div>
            <div class="text-2xl font-bold text-apple-green tracking-tight">{{ fmtNum(cargoDistribution.pickedUp) }}<span class="text-xs font-normal ml-1">吨</span></div>
            <div class="text-[10px] text-apple-subtext mt-1">已完成交付</div>
          </div>
        </div>

        <!-- 3. 通道货物追踪（按通道维度展示货物流转） -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
            <Icon name="route" :size="15" class="text-apple-subtext" />
            通道货物追踪
          </h3>
          <div v-if="channelCargoTracking.length === 0" class="py-4">
            <EmptyState icon="train" title="暂无通道数据" desc="请先在运力信息中录入运输通道并填写发运信息。" />
          </div>
          <div v-else class="space-y-3">
            <div v-for="t in channelCargoTracking" :key="t.shipping.capacityId" class="rounded-apple-lg border border-apple-border/40 overflow-hidden">
              <!-- 通道头部 -->
              <div class="flex items-center justify-between gap-3 px-4 py-3 bg-gray-50/40">
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0" :style="{ backgroundColor: t.channelColor + '1a', color: t.channelColor }">{{ t.channelLabel }}</span>
                  <span class="text-sm text-apple-text font-medium truncate">{{ t.route }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <Badge :label="SHIPPING_META[t.shipping.state].label" :color="SHIPPING_META[t.shipping.state].color" :bg="SHIPPING_META[t.shipping.state].bg" />
                  <span class="text-[11px] text-apple-subtext">进度 {{ t.progress }}%</span>
                </div>
              </div>
              <!-- 通道货物分布 -->
              <div class="px-4 py-3">
                <!-- 迷你堆叠条 -->
                <div class="h-3 rounded-full overflow-hidden flex bg-gray-100/60 mb-3">
                  <div v-if="t.unshipped > 0" class="h-full transition-all duration-500" style="background:#e5e5ea" :style="{ width: pct(t.unshipped, t.planned) + '%' }"></div>
                  <div v-if="t.inTransit > 0" class="h-full transition-all duration-500" style="background:#0071e3" :style="{ width: pct(t.inTransit, t.planned) + '%' }"></div>
                  <div v-if="t.stored > 0" class="h-full transition-all duration-500" style="background:#ff9500" :style="{ width: pct(t.stored, t.planned) + '%' }"></div>
                  <div v-if="t.pickedUp > 0" class="h-full transition-all duration-500" style="background:#34c759" :style="{ width: pct(t.pickedUp, t.planned) + '%' }"></div>
                </div>
                <!-- 数据明细 -->
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div class="text-center">
                    <div class="text-[10px] text-apple-subtext">计划总量</div>
                    <div class="text-apple-text font-semibold mt-0.5">{{ fmtNum(t.planned) }} 吨</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[10px] text-apple-subtext">未发运</div>
                    <div class="text-apple-subtext font-semibold mt-0.5">{{ fmtNum(t.unshipped) }} 吨</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[10px] text-apple-blue">运输中</div>
                    <div class="text-apple-blue font-semibold mt-0.5">{{ fmtNum(t.inTransit) }} 吨</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[10px] text-apple-orange">仓储堆存</div>
                    <div class="text-apple-orange font-semibold mt-0.5">{{ fmtNum(t.stored) }} 吨</div>
                  </div>
                  <div class="text-center">
                    <div class="text-[10px] text-apple-green">已提货出关</div>
                    <div class="text-apple-green font-semibold mt-0.5">{{ fmtNum(t.pickedUp) }} 吨</div>
                  </div>
                </div>
                <!-- 发运时间 -->
                <div v-if="t.shipping.actualDate || t.shipping.planDate" class="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-apple-border/40 text-[10px] text-apple-subtext">
                  <span v-if="t.shipping.planDate" class="flex items-center gap-1"><Icon name="clock" :size="10" /> 计划发运 {{ fmtDate(t.shipping.planDate) }}</span>
                  <span v-if="t.shipping.actualDate" class="flex items-center gap-1 text-apple-green"><Icon name="check-circle" :size="10" /> 实际发运 {{ fmtDate(t.shipping.actualDate) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. 跳转运输时间轴（避免内容重复） -->
        <div class="card p-5 bg-gradient-to-br from-apple-subtext/[0.03] to-transparent border border-apple-border/40">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-3">
              <div class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-subtext/10 text-apple-subtext">
                <Icon name="map-pin" :size="18" />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-apple-text">运输环节时间记录</h3>
                <p class="text-[11px] text-apple-subtext mt-0.5">完整的货物运输时间轴与操作日志，按时间顺序记录所有关键节点</p>
              </div>
            </div>
            <button @click="activeTab = 'log'" class="btn-secondary text-xs">
              查看运输时间轴
              <Icon name="arrow-right" :size="13" />
            </button>
          </div>
        </div>
      </div>

      <!-- ============ 运输时间轴（原操作日志，整合自动时间轴） ============ -->
      <div v-else-if="activeTab === 'log'" key="log" class="space-y-3">
        <!-- 跨标签页导航提示 -->
        <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1">
          <Icon name="info" :size="12" />
          <span>货物运输全程时间记录 · 发运数据编辑请前往</span>
          <button @click="activeTab = 'shipping'" class="text-apple-blue font-medium hover:underline">「发运状态」</button>
        </div>

        <!-- 1. 运输环节时间轴（主要视图，自动生成） -->
        <div class="card p-5">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
              <Icon name="map-pin" :size="15" class="text-apple-subtext" />
              货物运输时间轴
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-apple-green/10 text-apple-green font-medium">自动记录</span>
            </h3>
            <span class="text-[11px] text-apple-subtext">{{ autoTimeline.length }} 个关键节点 · 按时间排序</span>
          </div>

          <div v-if="autoTimeline.length === 0" class="py-6 text-center">
            <EmptyState icon="route" title="暂无时间轴记录" desc="随着订单流程推进，关键节点将自动记录到此处。" />
          </div>

          <!-- 自动时间轴 -->
          <div v-else class="relative pl-6">
            <div class="absolute left-2 top-2 bottom-2 w-px bg-apple-border/60"></div>
            <div v-for="node in autoTimeline" :key="node.id" class="relative pb-4 last:pb-0">
              <div class="absolute -left-[18px] top-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                :style="{ backgroundColor: node.color }">
              </div>
              <div class="rounded-apple-lg border border-apple-border/40 p-3 bg-white/40">
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <div class="flex items-center gap-2">
                    <div class="flex items-center justify-center w-6 h-6 rounded-md shrink-0" :style="{ backgroundColor: node.color + '1a', color: node.color }">
                      <Icon :name="node.icon" :size="13" />
                    </div>
                    <span class="text-sm text-apple-text font-medium">{{ node.stage }}</span>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                      :style="{ backgroundColor: ROLE_META[node.role].color + '1a', color: ROLE_META[node.role].color }">
                      {{ ROLE_META[node.role].label }}
                    </span>
                  </div>
                  <span class="text-[11px] text-apple-subtext flex items-center gap-1">
                    <Icon name="clock" :size="11" />{{ fmtDate(node.time) }}
                  </span>
                </div>
                <p v-if="node.remark" class="text-xs text-apple-subtext mt-1.5 leading-relaxed">{{ node.remark }}</p>
                <div class="text-[10px] text-apple-subtext mt-1 flex items-center gap-1">
                  <Icon name="user" :size="10" />{{ node.operator }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. 完整操作日志（详细记录，可折叠） -->
        <div class="card p-5">
          <div class="flex items-center justify-between flex-wrap gap-2 mb-4">
            <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
              <Icon name="history" :size="15" class="text-apple-subtext" />
              完整操作日志
              <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-apple-subtext font-medium">{{ logs.length }} 条</span>
            </h3>
          </div>
          <div v-if="logs.length === 0" class="py-6 text-center">
            <EmptyState icon="history" title="暂无操作记录" desc="订单状态变更、信息更新等操作将记录于此。" />
          </div>
          <div v-else class="relative pl-6">
            <div class="absolute left-2 top-2 bottom-2 w-px bg-apple-border/60"></div>
            <div v-for="log in logs" :key="log.id" class="relative pb-4 last:pb-0">
              <div class="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm"
                :style="{ backgroundColor: ROLE_META[log.role].color }"></div>
              <div class="flex items-start justify-between gap-2 flex-wrap">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm text-apple-text font-medium">{{ log.action }}</span>
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                      :style="{ backgroundColor: ROLE_META[log.role].color + '1a', color: ROLE_META[log.role].color }">
                      {{ ROLE_META[log.role].label }}
                    </span>
                  </div>
                  <p v-if="log.remark" class="text-xs text-apple-subtext mt-1">{{ log.remark }}</p>
                  <div class="flex items-center gap-2 mt-1.5 text-[11px] text-apple-subtext">
                    <Icon name="user" :size="11" />
                    <span>{{ log.operator }}</span>
                    <span>·</span>
                    <Icon name="clock" :size="11" />
                    <span>{{ fmtDate(log.createdAt) }}</span>
                  </div>
                </div>
                <!-- 状态变更标签 -->
                <div v-if="log.fromStatus || log.toStatus" class="flex items-center gap-1.5 shrink-0">
                  <span v-if="log.fromStatus" class="text-[11px] px-2 py-0.5 rounded-full" :style="{ backgroundColor: STATUS_META[log.fromStatus].bg, color: STATUS_META[log.fromStatus].color }">{{ STATUS_META[log.fromStatus].label }}</span>
                  <Icon name="arrow-right" :size="12" class="text-apple-subtext" />
                  <span v-if="log.toStatus" class="text-[11px] px-2 py-0.5 rounded-full" :style="{ backgroundColor: STATUS_META[log.toStatus].bg, color: STATUS_META[log.toStatus].color }">{{ STATUS_META[log.toStatus].label }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- PDF 报告容器（隐藏，仅用于导出） -->
    <div ref="reportRef" class="hidden">
      <TransportPlanReport
        :order="order"
        :port="port"
        :capacities="capacities"
        :total-freight="totalFreight"
        :max-lead-time="maxLeadTime"
        :total-idle="totalIdle"
      />
    </div>

    <div class="flex items-center justify-between gap-3 pt-2">
      <RouterLink to="/" class="btn-ghost"><Icon name="arrow-left" :size="15" /> 返回首页</RouterLink>
      <RouterLink :to="`/orders/${order.id}/plan`" class="btn-primary"><Icon name="file-text" :size="15" /> 查看方案报告</RouterLink>
    </div>
  </div>
</template>
