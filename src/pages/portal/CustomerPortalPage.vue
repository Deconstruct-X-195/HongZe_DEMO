<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import TaskDrawer from '../workspace/TaskDrawer.vue'
import { useOrderStore } from '@/stores/order'
import { useBusinessStore } from '@/stores/business'
import { useAuthStore } from '@/stores/auth'
import { fmtNum } from '@/lib/format'
import { INQUIRY_STATUS_META, QUOTE_STATUS_META, TRANSPORT_MODE_META } from '@/types'
import { STATUS_META, migrateStatus } from '@/types'
import type { Inquiry, Quote } from '@/types'

const business = useBusinessStore()
const store = useOrderStore()
const auth = useAuthStore()
onMounted(() => {
  business.loadInquiries()
  business.loadQuotes()
  store.refresh()
})

/* ---------- 客户视角数据（演示环境：当前客户 = 登录名，无匹配时看全部） ---------- */
const customerName = computed(() => auth.user?.name ?? '客户')
const myInquiries = computed<Inquiry[]>(() => {
  const sorted = (list: Inquiry[]) => [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const mine = business.inquiries.filter((i) => !i.customerName || i.customerName === customerName.value)
  // 演示兜底：登录名与询价客户名不一致时展示全部，避免演示流程中断
  return mine.length > 0 ? sorted(mine) : sorted(business.inquiries)
})
const quotesByInquiry = computed(() => {
  const map = new Map<string, Quote[]>()
  business.quotes.forEach((q) => {
    if (q.status === 'rejected' || q.status === 'expired') return
    // 兼容历史数据：报价关联值可能是询价 id 或询价编号，统一归并到询价 id
    const inquiry = business.inquiries.find((i) => i.id === q.inquiryId || i.inquiryNo === q.inquiryId)
    const key = inquiry ? inquiry.id : q.inquiryId
    const list = map.get(key) ?? []
    list.push(q)
    map.set(key, list)
  })
  return map
})

/* ---------- 我的订单（由成交报价生成，或业务代录） ---------- */
const myOrders = computed(() => {
  const sorted = (list: typeof store.orders) => [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const mine = store.orders.filter((o) => !o.trader || o.trader === customerName.value)
  return mine.length > 0 ? sorted(mine) : sorted(store.orders)
})

/** 订单货物动态摘要：计划 → 已发运 → 已入库 → 已提货 */
function flowOf(orderId: string) {
  const shippings = store.shippingsOf(orderId)
  const capacities = store.capacitiesOf(orderId)
  const planned = capacities.reduce((s, c) => s + (c.plannedQty || 0), 0)
  const shipped = shippings.reduce((s, x) => s + (x.shippedQty || 0), 0)
  const stored = shippings.reduce((s, x) => s + (x.storedQty || 0), 0)
  const pickedUp = shippings.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  return { planned, shipped, stored, pickedUp }
}

const stats = computed(() => {
  const pendingQuotes = myInquiries.value.reduce((s, i) => {
    const qs = quotesByInquiry.value.get(i.id) ?? []
    return s + qs.filter((q) => q.status === 'negotiating' || q.status === 'draft').length
  }, 0)
  const activeOrders = myOrders.value.filter((o) => {
    const s = migrateStatus(o.status)
    return s !== 'completed' && s !== undefined
  }).length
  return { inquiries: myInquiries.value.length, pendingQuotes, activeOrders }
})

/* ---------- 发起询价（居中悬浮窗口） ---------- */
const inquiryOpen = ref(false)
const inquiryForm = reactive({
  cargoName: '',
  cargoQty: 0,
  cargoQuality: '',
  origin: '',
  destination: '',
  transportMode: 'rail' as Inquiry['transportMode'],
  expectedDate: '',
  remark: '',
})
const inquiryErrors = reactive<Record<string, boolean>>({})
const inquiryTip = ref('')

function openInquiryForm() {
  Object.assign(inquiryForm, { cargoName: '', cargoQty: 0, cargoQuality: '', origin: '', destination: '', transportMode: 'rail', expectedDate: '', remark: '' })
  inquiryTip.value = ''
  Object.keys(inquiryErrors).forEach((k) => delete inquiryErrors[k])
  inquiryOpen.value = true
}

function submitInquiry() {
  if (!inquiryForm.cargoName.trim()) inquiryErrors.cargoName = true
  if (!(inquiryForm.cargoQty > 0)) inquiryErrors.cargoQty = true
  if (!inquiryForm.origin.trim()) inquiryErrors.origin = true
  if (!inquiryForm.destination.trim()) inquiryErrors.destination = true
  if (Object.keys(inquiryErrors).length > 0) {
    inquiryTip.value = '请补全带 * 的必填项'
    return
  }
  business.addInquiry({
    customerId: 'demo-customer',
    customerName: customerName.value,
    cargoName: inquiryForm.cargoName.trim(),
    cargoQty: inquiryForm.cargoQty,
    cargoQuality: inquiryForm.cargoQuality.trim(),
    origin: inquiryForm.origin.trim(),
    destination: inquiryForm.destination.trim(),
    transportMode: inquiryForm.transportMode,
    expectedDate: inquiryForm.expectedDate,
    status: 'submitted',
    remark: inquiryForm.remark.trim(),
  })
  inquiryOpen.value = false
}

/* ---------- 查看报价 + 接受报价 ---------- */
const quoteOpen = ref(false)
const currentQuotes = ref<Quote[]>([])
const currentInquiry = ref<Inquiry | null>(null)
const dealTip = ref<{ show: boolean; type: 'success' | 'error'; msg: string }>({ show: false, type: 'success', msg: '' })

function openQuotes(inquiry: Inquiry) {
  currentInquiry.value = inquiry
  currentQuotes.value = quotesByInquiry.value.get(inquiry.id) ?? []
  dealTip.value = { show: false, type: 'success', msg: '' }
  quoteOpen.value = true
}

/** 报价最优单价（总价最低的方案） */
function bestUnitPrice(q: Quote): number {
  if (q.finalPrice && q.finalPrice > 0) return q.finalPrice
  if (q.items.length === 0) return 0
  return Math.min(...q.items.map((it) => (it.totalPrice > 0 && it.unitPrice > 0 ? it.unitPrice : Number.MAX_SAFE_INTEGER)))
}

/** 接受报价：生成订单草稿，回填关联，闭环询价 */
function acceptQuote(q: Quote) {
  const inquiry = currentInquiry.value
  if (!inquiry) return
  const unitPrice = bestUnitPrice(q)
  if (!(unitPrice > 0) || unitPrice === Number.MAX_SAFE_INTEGER) {
    dealTip.value = { show: true, type: 'error', msg: '该报价缺少有效单价，请联系业务人员补充' }
    return
  }
  const orderId = store.generateId()
  store.saveOrder({
    id: orderId,
    trader: inquiry.customerName || customerName.value,
    cargoName: inquiry.cargoName,
    cargoTotal: inquiry.cargoQty,
    cargoPrice: unitPrice,
    cargoQuality: inquiry.cargoQuality,
    mine: inquiry.mine ?? '',
    vessel: '',
    loadingStart: '',
    departure: '',
    destPort: inquiry.destination,
    draftMark: 0,
    customers: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft',
  })
  business.updateQuote(q.id, { status: 'accepted', orderId, finalPrice: unitPrice })
  business.updateInquiry(inquiry.id, { status: 'closed' })
  dealTip.value = { show: true, type: 'success', msg: `报价已接受，订单 ${orderId} 已生成，等待业务人员完善运输方案` }
  store.refresh()
  setTimeout(() => { quoteOpen.value = false }, 1600)
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <PageHeader title="客户门户" :subtitle="`${customerName} · 发起询价、确认报价、跟踪货物运输动态`" />

    <!-- 摘要条 -->
    <div class="card px-5 py-3 flex items-center gap-5 flex-wrap">
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-text tabular-nums">{{ stats.inquiries }}</span>
        <span class="text-xs text-apple-subtext">条询价</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-blue tabular-nums">{{ stats.pendingQuotes }}</span>
        <span class="text-xs text-apple-subtext">条报价待确认</span>
      </div>
      <div class="w-px h-6 bg-apple-border/70"></div>
      <div class="flex items-baseline gap-1.5">
        <span class="text-lg font-bold text-apple-orange tabular-nums">{{ stats.activeOrders }}</span>
        <span class="text-xs text-apple-subtext">单订单在途</span>
      </div>
      <button @click="openInquiryForm" class="btn-primary ml-auto text-xs">
        <Icon name="plus" :size="14" />
        发起询价
      </button>
    </div>

    <!-- 询价与报价 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="search" :size="14" class="text-apple-blue" />
          我的询价
        </h2>
        <span class="text-xs text-apple-tertiary tabular-nums">业务人员将根据询价编制运输报价</span>
      </div>
      <div v-if="myInquiries.length === 0">
        <EmptyState icon="search" title="暂无询价" desc="点击右上角「发起询价」，提交您的运输需求。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="i in myInquiries" :key="i.id" class="px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm font-medium text-apple-text font-mono">{{ i.inquiryNo }}</span>
            <span class="text-xs text-apple-subtext">{{ i.cargoName }} · {{ fmtNum(i.cargoQty) }} 吨</span>
            <span class="text-xs text-apple-tertiary">{{ i.origin }} → {{ i.destination }}</span>
            <span class="text-[11px] px-2 py-0.5 rounded-full" :style="{ backgroundColor: (TRANSPORT_MODE_META[i.transportMode]?.color ?? '#8e8e93') + '1f', color: TRANSPORT_MODE_META[i.transportMode]?.color ?? '#8e8e93' }">
              {{ TRANSPORT_MODE_META[i.transportMode]?.label ?? i.transportMode }}
            </span>
            <Badge :label="INQUIRY_STATUS_META[i.status].label" :color="INQUIRY_STATUS_META[i.status].color" :bg="INQUIRY_STATUS_META[i.status].bg" />
            <div class="ml-auto flex items-center gap-2">
              <button v-if="(quotesByInquiry.get(i.id)?.length ?? 0) > 0" @click="openQuotes(i)" class="text-xs font-medium text-apple-blue hover:underline">
                查看报价（{{ quotesByInquiry.get(i.id)?.length }}）
              </button>
              <span v-else-if="i.status === 'submitted' || i.status === 'received' || i.status === 'in_plan'" class="text-[11px] text-apple-tertiary">报价编制中…</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 我的订单 -->
    <section class="card overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3.5 border-b border-apple-border/60">
        <h2 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="clipboard-list" :size="14" class="text-apple-blue" />
          我的订单
        </h2>
        <span class="text-xs text-apple-tertiary">接受报价后自动生成，也可由业务人员代录</span>
      </div>
      <div v-if="myOrders.length === 0">
        <EmptyState icon="package" title="暂无订单" desc="接受一条报价后，订单会自动生成并出现在此处。" />
      </div>
      <div v-else class="divide-y divide-apple-border/40">
        <div v-for="o in myOrders" :key="o.id" class="px-5 py-4 hover:bg-apple-hover/10 transition-colors">
          <div class="flex items-center gap-3 flex-wrap">
            <RouterLink :to="`/orders/${o.id}`" class="text-sm font-semibold text-apple-text font-mono hover:text-apple-blue transition-colors">{{ o.id }}</RouterLink>
            <span class="text-xs text-apple-subtext">{{ o.cargoName }} · {{ fmtNum(o.cargoTotal) }} 吨</span>
            <Badge :label="STATUS_META[migrateStatus(o.status) ?? 'draft'].label" :color="STATUS_META[migrateStatus(o.status) ?? 'draft'].color" :bg="STATUS_META[migrateStatus(o.status) ?? 'draft'].bg" />
            <RouterLink :to="`/orders/${o.id}`" class="ml-auto text-xs font-medium text-apple-blue hover:underline">订单详情 →</RouterLink>
          </div>
          <!-- 货物动态四段进度 -->
          <div class="flex items-center gap-4 mt-2.5 text-[11px] text-apple-subtext flex-wrap">
            <template v-if="flowOf(o.id).planned > 0">
              <span>计划 <span class="font-medium text-apple-text tabular-nums">{{ fmtNum(flowOf(o.id).planned) }}</span> 吨</span>
              <Icon name="chevron-right" :size="10" class="text-apple-tertiary" />
              <span>已发运 <span class="font-medium text-apple-blue tabular-nums">{{ fmtNum(flowOf(o.id).shipped) }}</span> 吨</span>
              <Icon name="chevron-right" :size="10" class="text-apple-tertiary" />
              <span>已入库 <span class="font-medium text-apple-orange tabular-nums">{{ fmtNum(flowOf(o.id).stored) }}</span> 吨</span>
              <Icon name="chevron-right" :size="10" class="text-apple-tertiary" />
              <span>已提货 <span class="font-medium text-apple-green tabular-nums">{{ fmtNum(flowOf(o.id).pickedUp) }}</span> 吨</span>
            </template>
            <span v-else class="text-apple-tertiary">运输方案编制中，暂无发运动态</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 发起询价（居中悬浮窗口） -->
    <TaskDrawer
      :open="inquiryOpen"
      title="发起询价"
      subtitle="提交运输需求，业务人员将编制报价方案"
      icon="search"
      icon-wrap-class="bg-apple-blue/10 text-apple-blue"
      @close="inquiryOpen = false"
    >
      <div class="space-y-4">
        <div v-if="inquiryTip" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium bg-apple-red/10 text-apple-red border border-apple-red/20">
          <Icon name="alert" :size="14" /> {{ inquiryTip }}
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">货物名称 <span class="text-apple-red">*</span></label>
            <input v-model="inquiryForm.cargoName" class="field-input" :data-error="inquiryErrors.cargoName" placeholder="如：铁矿石" />
          </div>
          <div>
            <label class="field-label">数量（吨）<span class="text-apple-red">*</span></label>
            <input v-model.number="inquiryForm.cargoQty" type="number" min="1" class="field-input" :data-error="inquiryErrors.cargoQty" placeholder="如：30000" />
          </div>
        </div>
        <div>
          <label class="field-label">货物品质</label>
          <input v-model="inquiryForm.cargoQuality" class="field-input" placeholder="如：热值5500大卡/千克" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">起点（发货地）<span class="text-apple-red">*</span></label>
            <input v-model="inquiryForm.origin" class="field-input" :data-error="inquiryErrors.origin" placeholder="如：黄骅港" />
          </div>
          <div>
            <label class="field-label">终点（目的地）<span class="text-apple-red">*</span></label>
            <input v-model="inquiryForm.destination" class="field-input" :data-error="inquiryErrors.destination" placeholder="如：邯郸武安钢厂" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">运输方式</label>
            <select v-model="inquiryForm.transportMode" class="field-input">
              <option v-for="(m, k) in TRANSPORT_MODE_META" :key="k" :value="k">{{ m.label }}</option>
            </select>
          </div>
          <div>
            <label class="field-label">期望运输时间</label>
            <input v-model="inquiryForm.expectedDate" type="date" class="field-input" />
          </div>
        </div>
        <div>
          <label class="field-label">备注</label>
          <textarea v-model="inquiryForm.remark" rows="2" class="field-input" placeholder="其他运输要求（选填）"></textarea>
        </div>
        <div class="pt-2 border-t border-apple-border/40">
          <button @click="submitInquiry" class="btn-primary w-full justify-center">
            <Icon name="send" :size="15" />
            提交询价
          </button>
        </div>
      </div>
    </TaskDrawer>

    <!-- 查看报价（居中悬浮窗口） -->
    <TaskDrawer
      :open="quoteOpen"
      :title="`报价方案 · ${currentInquiry?.inquiryNo ?? ''}`"
      :subtitle="currentInquiry ? `${currentInquiry.cargoName} ${fmtNum(currentInquiry.cargoQty)} 吨 · ${currentInquiry.origin} → ${currentInquiry.destination}` : ''"
      icon="send"
      icon-wrap-class="bg-apple-purple/10 text-apple-purple"
      @close="quoteOpen = false"
    >
      <div class="space-y-4">
        <div v-if="dealTip.show" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium"
          :class="dealTip.type === 'success' ? 'bg-apple-green/10 text-apple-green border border-apple-green/20' : 'bg-apple-red/10 text-apple-red border border-apple-red/20'">
          <Icon :name="dealTip.type === 'success' ? 'check-circle' : 'alert'" :size="14" /> {{ dealTip.msg }}
        </div>
        <div v-for="q in currentQuotes" :key="q.id" class="rounded-apple-lg border border-apple-border/50 overflow-hidden">
          <div class="flex items-center gap-2.5 px-4 py-3 bg-apple-fill/30">
            <span class="text-sm font-semibold text-apple-text font-mono">{{ q.quoteNo }}</span>
            <Badge :label="QUOTE_STATUS_META[q.status].label" :color="QUOTE_STATUS_META[q.status].color" :bg="QUOTE_STATUS_META[q.status].bg" />
            <button
              v-if="q.status === 'draft' || q.status === 'negotiating'"
              @click="acceptQuote(q)"
              class="btn-primary ml-auto text-xs"
            >
              <Icon name="check-circle" :size="13" />
              接受并生成订单
            </button>
          </div>
          <div class="px-4 py-3 space-y-2">
            <div v-for="it in q.items" :key="it.id" class="flex items-center gap-3 text-xs flex-wrap">
              <span class="font-medium text-apple-text">{{ it.channel }}</span>
              <span class="text-apple-tertiary">{{ it.transportMode }} · 时效 {{ it.transitDays }} 天</span>
              <span class="ml-auto text-apple-text tabular-nums">{{ fmtNum(it.unitPrice) }} 元/吨</span>
              <span class="text-apple-subtext tabular-nums">总价 {{ fmtNum(it.totalPrice) }} 元</span>
            </div>
            <div v-if="q.items.length === 0" class="text-xs text-apple-tertiary">报价方案编制中</div>
          </div>
        </div>
      </div>
    </TaskDrawer>
  </div>
</template>
