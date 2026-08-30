<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Field from '@/components/Field.vue'
import InfoRow from '@/components/InfoRow.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useOrderStore } from '@/stores/order'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import { exportTransportPlanPdf } from '@/lib/pdfExport'
import {
  CHANNEL_META,
  RAIL_CARRIERS,
  ROAD_CARRIERS,
  TRANSFER_OPTIONS,
  RAIL_STATION_OPTIONS,
  ROAD_LOCATION_OPTIONS,
  customersDisplay,
  customersTotalQty,
} from '@/types'
import type { Capacity, ChannelType, Order } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const id = route.params.id as string

const order = computed<Order | undefined>(() => store.getById(id))
const port = computed(() => store.portOf(id))

interface RailTemplate {
  id: string
  type: 'rail_direct' | 'rail_caozhuang' | 'rail_xingtai' | 'rail_transit'
  origin: string
  transfer?: string
  destination: string
  idleCapacity: number
  plannedQty: number // 计划运输货物量（吨）
  price: number
  leadTime: number // 自动计算：plannedQty / idleCapacity
  carrier: string
  roadCarrier: string // 公铁联运专用：公路承运商
}
interface RoadItem {
  id: string
  origin: string
  destination: string
  idleCapacity: number
  plannedQty: number
  price: number
  leadTime: number
  carrier: string
}

function makeRailDirect(): RailTemplate {
  return {
    id: store.genCapacityId(),
    type: 'rail_direct',
    origin: '',
    destination: '',
    idleCapacity: 0,
    plannedQty: 0,
    price: 0,
    leadTime: 0,
    carrier: '',
    roadCarrier: '',
  }
}

function makeTransit(): RailTemplate {
  return {
    id: store.genCapacityId(),
    type: 'rail_transit',
    origin: '',
    transfer: '',
    destination: '',
    idleCapacity: 0,
    plannedQty: 0,
    price: 0,
    leadTime: 0,
    carrier: '',
    roadCarrier: '',
  }
}

// 铁路直达：动态多条路线
const railDirects = reactive<RailTemplate[]>([makeRailDirect()])

// 公铁联运：动态多条路线（中转节点通过 transfer 字段区分）
const transitRails = reactive<RailTemplate[]>([makeTransit()])

const roads = reactive<RoadItem[]>([
  { id: store.genCapacityId(), origin: '', destination: '', idleCapacity: 0, plannedQty: 0, price: 0, leadTime: 0, carrier: '' },
])

// 初始化：从存储加载
const existing = store.capacitiesOf(id)
if (existing.length > 0) {
  const directList: RailTemplate[] = []
  const transitList: RailTemplate[] = []
  const roadList: RoadItem[] = []
  existing.forEach((c) => {
    if (c.channelType === 'road') {
      roadList.push({
        id: c.id,
        origin: c.origin,
        destination: c.destination,
        idleCapacity: c.idleCapacity,
        plannedQty: c.plannedQty ?? 0,
        price: c.price,
        leadTime: c.leadTime,
        carrier: c.carrier ?? '',
      })
    } else if (c.channelType === 'rail_direct') {
      directList.push({
        id: c.id,
        type: 'rail_direct',
        origin: c.origin,
        destination: c.destination,
        idleCapacity: c.idleCapacity,
        plannedQty: c.plannedQty ?? 0,
        price: c.price,
        leadTime: c.leadTime,
        carrier: c.carrier ?? '',
        roadCarrier: '',
      })
    } else {
      // 公铁联运：旧数据 rail_caozhuang/rail_xingtai 统一转为 rail_transit
      const oldTransfer =
        c.channelType === 'rail_caozhuang' ? '曹庄镇站' :
        c.channelType === 'rail_xingtai' ? '邢台南站' :
        c.transfer
      transitList.push({
        id: c.id,
        type: 'rail_transit',
        origin: c.origin,
        transfer: oldTransfer,
        destination: c.destination,
        idleCapacity: c.idleCapacity,
        plannedQty: c.plannedQty ?? 0,
        price: c.price,
        leadTime: c.leadTime,
        carrier: c.carrier ?? '',
        roadCarrier: c.roadCarrier ?? '',
      })
    }
  })
  if (directList.length > 0) {
    railDirects.splice(0, railDirects.length, ...directList)
  }
  if (transitList.length > 0) {
    transitRails.splice(0, transitRails.length, ...transitList)
  }
  if (roadList.length > 0) {
    roads.splice(0, roads.length, ...roadList)
  }
}

const saved = ref(false)

watch(
  [railDirects, transitRails, roads],
  () => {
    if (!order.value) return
    const t = setTimeout(() => {
      saveAll(true)
      saved.value = true
      setTimeout(() => (saved.value = false), 1500)
    }, 800)
    return () => clearTimeout(t)
  },
  { deep: true },
)

/** 自动计算运输时效：plannedQty / idleCapacity（向上取整） */
function calcLeadTime(r: { plannedQty: number; idleCapacity: number }): number {
  return r.idleCapacity > 0 ? Math.ceil(r.plannedQty / r.idleCapacity) : 0
}

function setRailDirect(idx: number, patch: Partial<RailTemplate>) {
  Object.assign(railDirects[idx], patch)
  railDirects[idx].leadTime = calcLeadTime(railDirects[idx])
}
function setTransitRail(idx: number, patch: Partial<RailTemplate>) {
  Object.assign(transitRails[idx], patch)
  transitRails[idx].leadTime = calcLeadTime(transitRails[idx])
}
function addRailDirect() {
  railDirects.push(makeRailDirect())
}
function removeRailDirect(rid: string) {
  if (railDirects.length > 1) {
    const idx = railDirects.findIndex((r) => r.id === rid)
    if (idx >= 0) railDirects.splice(idx, 1)
  }
}
function addTransit() {
  transitRails.push(makeTransit())
}
function removeTransit(rid: string) {
  if (transitRails.length > 1) {
    const idx = transitRails.findIndex((r) => r.id === rid)
    if (idx >= 0) transitRails.splice(idx, 1)
  }
}
function setRoad(rid: string, patch: Partial<RoadItem>) {
  const r = roads.find((x) => x.id === rid)
  if (r) {
    Object.assign(r, patch)
    r.leadTime = calcLeadTime(r)
  }
}
function addRoad() {
  roads.push({
    id: store.genCapacityId(),
    origin: '',
    destination: '',
    idleCapacity: 0,
    plannedQty: 0,
    price: 0,
    leadTime: 0,
    carrier: '',
  })
}
function removeRoad(rid: string) {
  if (roads.length > 1) {
    const idx = roads.findIndex((r) => r.id === rid)
    if (idx >= 0) roads.splice(idx, 1)
  }
}

/* ---------- 折叠面板（独立控制：允许同时展开） ---------- */
const railOpen = ref(true) // 铁路运输板块
const roadOpen = ref(true) // 公路运输板块
const railDirectOpen = ref(true) // 铁路直达子项
const transitOpen = ref(true) // 公铁联运子项
function toggleRail() {
  railOpen.value = !railOpen.value
  if (!railOpen.value) scrollToHeader()
}
function toggleRoad() {
  roadOpen.value = !roadOpen.value
  if (!roadOpen.value) scrollToHeader()
}
function toggleRailDirect() {
  railDirectOpen.value = !railDirectOpen.value
  if (!railDirectOpen.value) scrollToHeader()
}
function toggleTransit() {
  transitOpen.value = !transitOpen.value
  if (!transitOpen.value) scrollToHeader()
}
/** 折叠后滚动回页面顶部（表头区域），保持主视图稳定 */
function scrollToHeader() {
  nextTick(() => {
    document.getElementById('capacity-header')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  })
}

/* ---------- 核心指标计算：总运费 + 运输时间 ---------- */
// 总运费 = 各通道 (计划运输货物量 × 单位运输价格) 之和
const totalFreight = computed(() => {
  let sum = 0
  ;[...railDirects, ...transitRails].forEach((r) => {
    if (r.plannedQty > 0 && r.price > 0) sum += r.plannedQty * r.price
  })
  roads.forEach((r) => {
    if (r.plannedQty > 0 && r.price > 0) sum += r.plannedQty * r.price
  })
  return sum
})
// 运输时间 = 所有通道中最长时效（关键路径）
const maxLeadTime = computed(() => {
  const all = [...railDirects, ...transitRails, ...roads].map((r) => r.leadTime || 0)
  return all.length > 0 ? Math.max(...all) : 0
})

const railIdle = computed(() =>
  [...railDirects, ...transitRails].reduce((s, r) => s + (r.idleCapacity || 0), 0),
)
const roadIdle = computed(() => roads.reduce((s, r) => s + (r.idleCapacity || 0), 0))
const totalIdle = computed(() => railIdle.value + roadIdle.value)

/* ---------- 货物量分配状态 ---------- */
const cargoTotal = computed(() => order.value?.cargoTotal || 0)
const allocatedQty = computed(() => {
  let sum = 0
  ;[...railDirects, ...transitRails].forEach((r) => {
    if (r.plannedQty > 0) sum += r.plannedQty
  })
  roads.forEach((r) => {
    if (r.plannedQty > 0) sum += r.plannedQty
  })
  return sum
})
const unallocatedQty = computed(() => cargoTotal.value - allocatedQty.value)
const allocationRate = computed(() => {
  if (cargoTotal.value <= 0) return 0
  return Math.min(100, Math.round((allocatedQty.value / cargoTotal.value) * 100))
})
const allocationStatus = computed(() => {
  if (cargoTotal.value <= 0) return 'empty'
  if (unallocatedQty.value > 0) return 'warning'
  if (unallocatedQty.value === 0) return 'success'
  return 'over' // 超分配
})

/** 判断通道记录是否为未填写的空记录（不落库，避免污染发货通道选择与状态闭环）
 *  规则：无路线（起点/终点均空）且无计划运量的通道视为空，仅填闲置运力无业务意义 */
function isBlankChannel(r: { origin: string; transfer?: string; destination: string; idleCapacity: number; plannedQty: number }): boolean {
  return !r.origin && !r.transfer && !r.destination && !(r.plannedQty > 0)
}

/** 有效通道：路线完整（起点+终点）且计划运量大于 0 */
function isValidChannel(r: { origin: string; transfer?: string; destination: string; plannedQty: number }): boolean {
  return !!r.origin && !!r.destination && (r.plannedQty || 0) > 0
}

function saveAll(silent = false): boolean {
  void silent
  const list: Capacity[] = []
  ;[...railDirects, ...transitRails].forEach((r) => {
    if (isBlankChannel(r)) return
    list.push({
      id: r.id,
      orderId: id,
      channelType: r.type,
      origin: r.origin,
      transfer: r.transfer,
      destination: r.destination,
      idleCapacity: r.idleCapacity,
      plannedQty: r.plannedQty,
      price: r.price,
      leadTime: r.leadTime,
      carrier: r.carrier,
      roadCarrier: r.roadCarrier || undefined,
      updatedAt: new Date().toISOString(),
    })
  })
  roads.forEach((r) => {
    if (isBlankChannel(r)) return
    list.push({
      id: r.id,
      orderId: id,
      channelType: 'road' as ChannelType,
      origin: r.origin,
      destination: r.destination,
      idleCapacity: r.idleCapacity,
      plannedQty: r.plannedQty,
      price: r.price,
      leadTime: r.leadTime,
      carrier: r.carrier,
      updatedAt: new Date().toISOString(),
    })
  })
  store.saveCapacities(id, list)
  return true
}

/* ---------- 方案完成 + PDF 下载（分离） ---------- */
const exporting = ref(false)
const exported = ref(false)
const reportRef = ref<HTMLDivElement | null>(null)
const validationError = ref('')

/** 完成方案：校验 + 保存数据 + 更新状态 + 显示成功提示（不自动下载 PDF） */
function completePlan() {
  const all = [...railDirects, ...transitRails, ...roads]
  const validCount = all.filter((r) => isValidChannel(r)).length
  if (validCount === 0) {
    validationError.value = '请至少完整填写一条运输通道（起点、终点、计划运输量），才能完成方案'
    return
  }
  validationError.value = ''
  saveAll(true)
  store.setStatus(id, 'pending_confirm')
  exported.value = true
}

/** 下载 PDF（用户主动点击） */
async function downloadPdf() {
  if (!reportRef.value) return
  exporting.value = true
  try {
    await exportTransportPlanPdf(reportRef.value, id)
  } catch (err) {
    console.error(err)
    alert('PDF 导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

/** 返回首页 */
function goHome() {
  router.push('/')
}
/** 跳转订单详情（进入业务流转） */
function goDetail() {
  router.push(`/orders/${id}`)
}

const congLabel = port.value
  ? ({ normal: '正常', mild: '轻度拥堵', severe: '严重拥堵' } as const)[port.value.congestion]
  : '—'

const railCapacities = computed<Capacity[]>(() =>
  [...railDirects, ...transitRails].map((r) => ({
    id: r.id,
    orderId: id,
    channelType: r.type as ChannelType,
    origin: r.origin,
    transfer: r.transfer,
    destination: r.destination,
    idleCapacity: r.idleCapacity,
    plannedQty: r.plannedQty,
    price: r.price,
    leadTime: r.leadTime,
    carrier: r.carrier,
    roadCarrier: r.roadCarrier || undefined,
    updatedAt: new Date().toISOString(),
  })),
)
</script>

<template>
  <div v-if="!order" class="card p-12 text-center">
    <Icon name="alert" :size="32" class="mx-auto text-apple-orange" />
    <p class="mt-3 text-apple-text font-medium">订单不存在</p>
    <RouterLink to="/" class="btn-primary mt-4 inline-flex">返回首页</RouterLink>
  </div>

  <div v-else class="space-y-4 animate-fade-in">
    <!-- 顶部固定表头：订单号 + 核心指标 + 导出按钮 -->
    <div id="capacity-header" class="sticky top-0 z-40 -mx-4 px-4 pt-4 pb-3 space-y-3 bg-apple-card/90 backdrop-blur-xl border-b border-apple-border/40">
    <!-- 顶部：订单号（缩小，左上角）+ 核心指标 + 导出按钮 -->
    <div class="flex items-start justify-between gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <span class="text-xs text-apple-subtext">订单</span>
        <span class="text-sm font-mono font-semibold text-apple-text">{{ order.id }}</span>
        <span class="text-[11px] text-apple-subtext">{{ order.cargoName }} · {{ fmtNum(order.cargoTotal) }} 吨</span>
        <span
          v-if="saved"
          class="text-[11px] text-apple-green flex items-center gap-1 animate-fade-in ml-2"
        >
          <Icon name="check-circle" :size="13" /> 已保存
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button @click="downloadPdf" :disabled="exporting" class="btn-secondary">
          <Icon name="download" :size="15" />
          {{ exporting ? '导出中…' : '下载PDF' }}
        </button>
        <button @click="completePlan" class="btn-primary">
          <Icon name="check-circle" :size="15" />
          完成方案
        </button>
      </div>
    </div>

    <!-- 校验提示：无有效通道时阻止提交 -->
    <div v-if="validationError" class="rounded-apple-lg px-4 py-2.5 flex items-center gap-2.5 text-xs font-medium bg-apple-red/10 text-apple-red border border-apple-red/20">
      <Icon name="alert" :size="14" />
      {{ validationError }}
    </div>
  </div>

    <!-- 核心信息展示：总运费 + 运输时间 + 货物分配 -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div class="rounded-apple-lg bg-gradient-to-br from-apple-blue/10 to-transparent border border-apple-blue/20 px-5 py-4">
        <div class="flex items-center gap-2 text-xs text-apple-subtext">
          <Icon name="route" :size="14" class="text-apple-blue" />
          <span>总运费</span>
        </div>
        <div class="text-2xl font-bold text-apple-blue mt-1.5 tracking-tight">
          {{ fmtMoney(totalFreight) }}
        </div>
        <div class="text-[11px] text-apple-subtext mt-0.5">
          总闲置运力 {{ fmtNum(totalIdle) }} 吨/天
        </div>
      </div>
      <div class="rounded-apple-lg bg-gradient-to-br from-apple-purple/10 to-transparent border border-apple-purple/20 px-5 py-4">
        <div class="flex items-center gap-2 text-xs text-apple-subtext">
          <Icon name="layers" :size="14" class="text-apple-purple" />
          <span>运输时间</span>
        </div>
        <div class="text-2xl font-bold text-apple-purple mt-1.5 tracking-tight">
          {{ maxLeadTime }}
          <span class="text-base font-medium ml-0.5">天</span>
          <span class="text-[11px] font-normal text-apple-subtext ml-2">关键路径</span>
        </div>
        <div class="text-[11px] text-apple-subtext mt-0.5">
          铁路 {{ railIdle > 0 ? fmtNum(railIdle) + ' 吨/天' : '—' }} · 公路 {{ roadIdle > 0 ? fmtNum(roadIdle) + ' 吨/天' : '—' }}
        </div>
      </div>
      <!-- 货物量分配状态 -->
      <div
        class="rounded-apple-lg border px-5 py-4 transition-colors duration-300"
        :class="{
          'bg-gradient-to-br from-apple-orange/10 to-transparent border-apple-orange/20': allocationStatus === 'warning',
          'bg-gradient-to-br from-apple-green/10 to-transparent border-apple-green/20': allocationStatus === 'success',
          'bg-gradient-to-br from-apple-red/10 to-transparent border-apple-red/20': allocationStatus === 'over',
          'bg-apple-fill border-apple-border/40': allocationStatus === 'empty',
        }"
      >
        <div class="flex items-center gap-2 text-xs text-apple-subtext">
          <Icon
            name="package"
            :size="14"
            :class="{
              'text-apple-orange': allocationStatus === 'warning',
              'text-apple-green': allocationStatus === 'success',
              'text-apple-red': allocationStatus === 'over',
              'text-apple-subtext': allocationStatus === 'empty',
            }"
          />
          <span>货物分配</span>
        </div>
        <div class="flex items-baseline gap-1.5 mt-1.5">
          <span
            class="text-2xl font-bold tracking-tight"
            :class="{
              'text-apple-orange': allocationStatus === 'warning',
              'text-apple-green': allocationStatus === 'success',
              'text-apple-red': allocationStatus === 'over',
              'text-apple-subtext': allocationStatus === 'empty',
            }"
          >{{ allocationRate }}%</span>
          <span class="text-[11px] text-apple-subtext">完成率</span>
        </div>
        <!-- 进度条 -->
        <div class="mt-2 h-1.5 rounded-full bg-apple-fill-strong/60 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="{
              'bg-apple-orange': allocationStatus === 'warning',
              'bg-apple-green': allocationStatus === 'success',
              'bg-apple-red': allocationStatus === 'over',
              'bg-apple-fill-strong': allocationStatus === 'empty',
            }"
            :style="{ width: allocationRate + '%' }"
          ></div>
        </div>
        <div class="text-[11px] mt-1.5" :class="{
          'text-apple-orange': allocationStatus === 'warning',
          'text-apple-green': allocationStatus === 'success',
          'text-apple-red': allocationStatus === 'over',
          'text-apple-subtext': allocationStatus === 'empty',
        }">
          <template v-if="allocationStatus === 'empty'">请先录入货物总量</template>
          <template v-else-if="allocationStatus === 'warning'">
            已分配 {{ fmtNum(allocatedQty) }} / {{ fmtNum(cargoTotal) }} 吨 · 待分配 {{ fmtNum(unallocatedQty) }} 吨
          </template>
          <template v-else-if="allocationStatus === 'success'">
            已全部分配 · {{ fmtNum(allocatedQty) }} 吨
          </template>
          <template v-else>超分配 {{ fmtNum(Math.abs(unallocatedQty)) }} 吨</template>
        </div>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="space-y-4">
      <!-- 铁路运输板块（含铁路直达 + 公铁联运） -->
      <section class="card overflow-hidden">
        <button
          @click="toggleRail"
          :aria-expanded="railOpen"
          aria-controls="rail-content"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-apple-hover/10 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-blue/10 text-apple-blue">
              <Icon name="train" :size="18" />
            </div>
            <div class="text-left">
              <h2 class="text-base font-semibold text-apple-text tracking-tight">铁路运输</h2>
              <p class="text-xs text-apple-subtext mt-0.5">铁路直达 · 公铁联运</p>
            </div>
          </div>
          <Icon
            name="chevron-right"
            :size="18"
            class="text-apple-subtext transition-transform duration-300"
            :class="railOpen ? 'rotate-90' : ''"
          />
        </button>

        <div v-show="railOpen" id="rail-content" class="px-5 pb-5 space-y-4">
          <!-- 铁路直达子板块（独立折叠） -->
          <div class="rounded-apple border border-apple-border/40 overflow-hidden">
            <button
              @click="toggleRailDirect"
              :aria-expanded="railDirectOpen"
              aria-controls="rail-direct-content"
              class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-apple-hover/10 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-apple-blue"></span>
                <span class="text-sm font-semibold text-apple-text">铁路直达</span>
                <span class="text-[11px] text-apple-subtext">支持多条路线 · {{ railDirects.length }} 条</span>
              </div>
              <div class="flex items-center gap-2">
                <span @click.stop class="inline-flex">
                  <button @click="addRailDirect" class="btn-ghost text-xs">
                    <Icon name="plus" :size="14" /> 添加路线
                  </button>
                </span>
                <Icon
                  name="chevron-right"
                  :size="15"
                  class="text-apple-subtext transition-transform duration-300"
                  :class="railDirectOpen ? 'rotate-90' : ''"
                />
              </div>
            </button>
            <div v-show="railDirectOpen" id="rail-direct-content" class="px-4 pb-4 pt-2 space-y-3">
              <div
                v-for="(r, idx) in railDirects"
                :key="r.id"
                class="rounded-apple border border-apple-border/60 p-3.5 bg-apple-fill/30"
                :style="{ borderLeft: `3px solid ${CHANNEL_META.rail_direct.color}` }"
              >
                <div class="flex items-center gap-2 mb-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-md bg-apple-blue text-white text-xs font-semibold">
                    {{ idx + 1 }}
                  </span>
                  <span class="text-xs font-medium text-apple-subtext">路线 {{ idx + 1 }}</span>
                  <button
                    v-if="railDirects.length > 1"
                    @click="removeRailDirect(r.id)"
                    class="ml-auto flex items-center justify-center w-6 h-6 rounded-full text-apple-subtext hover:bg-apple-red/10 hover:text-apple-red transition-colors"
                  >
                    <Icon name="trash" :size="13" />
                  </button>
                </div>
                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Field label="起点站">
                    <SearchSelect
                      :options="RAIL_STATION_OPTIONS"
                      :model-value="r.origin"
                      @update:model-value="setRailDirect(idx, { origin: $event })"
                      placeholder="如：黄骅站"
                      label="起点站"
                      other-placeholder="如：黄骅站"
                    />
                  </Field>
                  <Field label="终点站">
                    <SearchSelect
                      :options="RAIL_STATION_OPTIONS"
                      :model-value="r.destination"
                      @update:model-value="setRailDirect(idx, { destination: $event })"
                      placeholder="如：邯郸站"
                      label="终点站"
                      other-placeholder="如：武安站"
                    />
                  </Field>
                  <Field label="运力（吨/天）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.idleCapacity || ''"
                      @input="setRailDirect(idx, { idleCapacity: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：5000"
                    />
                  </Field>
                  <Field label="计划运输货物量（吨）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.plannedQty || ''"
                      @input="setRailDirect(idx, { plannedQty: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：10000"
                    />
                  </Field>
                  <Field label="单位运费（元/吨）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.price || ''"
                      @input="setRailDirect(idx, { price: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：65"
                    />
                  </Field>
                  <Field label="运输时效（天）" hint="自动计算：计划运输量 ÷ 运力">
                    <input
                      type="number"
                      class="field-input bg-apple-fill/60"
                      :value="r.leadTime || ''"
                      readonly
                      placeholder="自动计算"
                    />
                  </Field>
                  <Field label="铁路承运商">
                    <SearchSelect
                      :options="RAIL_CARRIERS"
                      :model-value="r.carrier"
                      @update:model-value="setRailDirect(idx, { carrier: $event })"
                      placeholder="请选择"
                      label="铁路承运商"
                      other-placeholder="如：中铁快运"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>

          <!-- 公铁联运子板块（独立折叠） -->
          <div class="rounded-apple border border-apple-border/40 overflow-hidden">
            <button
              @click="toggleTransit"
              :aria-expanded="transitOpen"
              aria-controls="transit-content"
              class="w-full flex items-center justify-between px-4 py-2.5 hover:bg-apple-hover/10 transition-colors"
            >
              <div class="flex items-center gap-2">
                <span class="w-1 h-4 rounded-full bg-apple-purple"></span>
                <span class="text-sm font-semibold text-apple-text">公铁联运</span>
                <span class="text-[11px] text-apple-subtext">支持多条路线 · {{ transitRails.length }} 条</span>
              </div>
              <div class="flex items-center gap-2">
                <span @click.stop class="inline-flex">
                  <button @click="addTransit" class="btn-ghost text-xs">
                    <Icon name="plus" :size="14" /> 添加路线
                  </button>
                </span>
                <Icon
                  name="chevron-right"
                  :size="15"
                  class="text-apple-subtext transition-transform duration-300"
                  :class="transitOpen ? 'rotate-90' : ''"
                />
              </div>
            </button>
            <div v-show="transitOpen" id="transit-content" class="px-4 pb-4 pt-2 space-y-3">
              <div
                v-for="(r, idx) in transitRails"
                :key="r.id"
                class="rounded-apple border border-apple-border/60 p-3.5 bg-apple-fill/30"
                :style="{ borderLeft: `3px solid ${CHANNEL_META.rail_transit.color}` }"
              >
                <div class="flex items-center gap-2 mb-3">
                  <span
                    class="flex items-center justify-center w-6 h-6 rounded-md text-white text-xs font-semibold"
                    :style="{ backgroundColor: CHANNEL_META.rail_transit.color }"
                  >
                    {{ idx + 1 }}
                  </span>
                  <span class="text-xs font-medium text-apple-subtext">公铁联运 {{ idx + 1 }}</span>
                  <button
                    v-if="transitRails.length > 1"
                    @click="removeTransit(r.id)"
                    class="ml-auto flex items-center justify-center w-6 h-6 rounded-full text-apple-subtext hover:bg-apple-red/10 hover:text-apple-red transition-colors"
                  >
                    <Icon name="trash" :size="13" />
                  </button>
                </div>
                <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Field label="起点">
                    <SearchSelect
                      :options="ROAD_LOCATION_OPTIONS"
                      :model-value="r.origin"
                      @update:model-value="setTransitRail(idx, { origin: $event })"
                      placeholder="如：黄骅港"
                      label="起点"
                      other-placeholder="如：黄骅港散货码头"
                    />
                  </Field>
                  <Field label="中转节点">
                    <SearchSelect
                      :options="TRANSFER_OPTIONS"
                      :model-value="r.transfer || ''"
                      @update:model-value="setTransitRail(idx, { transfer: $event })"
                      placeholder="请选择"
                      label="中转节点"
                      other-placeholder="如：邢台东站"
                    />
                  </Field>
                  <Field label="终点">
                    <SearchSelect
                      :options="ROAD_LOCATION_OPTIONS"
                      :model-value="r.destination"
                      @update:model-value="setTransitRail(idx, { destination: $event })"
                      placeholder="如：邯郸钢厂"
                      label="终点"
                      other-placeholder="如：武安保税物流园"
                    />
                  </Field>
                  <Field label="运力（吨/天）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.idleCapacity || ''"
                      @input="setTransitRail(idx, { idleCapacity: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：5000"
                    />
                  </Field>
                  <Field label="计划运输货物量（吨）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.plannedQty || ''"
                      @input="setTransitRail(idx, { plannedQty: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：10000"
                    />
                  </Field>
                  <Field label="单位运输价格（元/吨）">
                    <input
                      type="number"
                      class="field-input"
                      :value="r.price || ''"
                      @input="setTransitRail(idx, { price: Number(($event.target as HTMLInputElement).value) })"
                      placeholder="如：65"
                    />
                  </Field>
                  <Field label="运输时效（天）" hint="自动计算">
                    <input
                      type="number"
                      class="field-input bg-apple-fill/60"
                      :value="r.leadTime || ''"
                      readonly
                      placeholder="自动计算"
                    />
                  </Field>
                  <Field label="铁路承运商">
                    <SearchSelect
                      :options="RAIL_CARRIERS"
                      :model-value="r.carrier"
                      @update:model-value="setTransitRail(idx, { carrier: $event })"
                      placeholder="请选择"
                      label="铁路承运商"
                      other-placeholder="如：中铁快运"
                    />
                  </Field>
                  <Field label="公路承运商">
                    <SearchSelect
                      :options="ROAD_CARRIERS"
                      :model-value="r.roadCarrier"
                      @update:model-value="setTransitRail(idx, { roadCarrier: $event })"
                      placeholder="请选择"
                      label="公路承运商"
                      other-placeholder="如：万合集团"
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 公路运输板块 -->
      <section class="card overflow-hidden">
        <button
          @click="toggleRoad"
          :aria-expanded="roadOpen"
          aria-controls="road-content"
          class="w-full flex items-center justify-between px-5 py-4 hover:bg-apple-hover/10 transition-colors"
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-9 h-9 rounded-apple bg-apple-green/10 text-apple-green">
              <Icon name="truck" :size="18" />
            </div>
            <div class="text-left">
              <h2 class="text-base font-semibold text-apple-text tracking-tight">公路运输</h2>
              <p class="text-xs text-apple-subtext mt-0.5">公路直达</p>
            </div>
          </div>
          <Icon
            name="chevron-right"
            :size="18"
            class="text-apple-subtext transition-transform duration-300"
            :class="roadOpen ? 'rotate-90' : ''"
          />
        </button>

        <div v-show="roadOpen" id="road-content" class="px-5 pb-5">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="w-1 h-4 rounded-full bg-apple-green"></span>
              <span class="text-sm font-semibold text-apple-text">公路直达</span>
            </div>
            <button @click="addRoad" class="btn-ghost text-xs">
              <Icon name="plus" :size="14" /> 添加路线
            </button>
          </div>
          <div class="space-y-3">
            <div
              v-for="(r, idx) in roads"
              :key="r.id"
              class="rounded-apple border border-apple-border/60 p-3.5 bg-apple-fill/30"
              style="border-left: 3px solid #34c759"
            >
              <div class="flex items-center gap-2 mb-3">
                <span class="flex items-center justify-center w-6 h-6 rounded-md bg-apple-green text-white text-xs font-semibold">
                  {{ idx + 1 }}
                </span>
                <span class="text-xs font-medium text-apple-subtext">公路路线 {{ idx + 1 }}</span>
                <button
                  v-if="roads.length > 1"
                  @click="removeRoad(r.id)"
                  class="ml-auto flex items-center justify-center w-6 h-6 rounded-full text-apple-subtext hover:bg-apple-red/10 hover:text-apple-red transition-colors"
                >
                  <Icon name="trash" :size="13" />
                </button>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Field label="起点">
                  <SearchSelect
                    :options="ROAD_LOCATION_OPTIONS"
                    :model-value="r.origin"
                    @update:model-value="setRoad(r.id, { origin: $event })"
                    placeholder="如：黄骅港"
                    label="起点"
                    other-placeholder="如：黄骅港散货码头"
                  />
                </Field>
                <Field label="终点">
                  <SearchSelect
                    :options="ROAD_LOCATION_OPTIONS"
                    :model-value="r.destination"
                    @update:model-value="setRoad(r.id, { destination: $event })"
                    placeholder="如：邯郸武安钢厂"
                    label="终点"
                    other-placeholder="如：武安保税物流园"
                  />
                </Field>
                <Field label="运力（吨/天）">
                  <input
                    type="number"
                    class="field-input"
                    :value="r.idleCapacity || ''"
                    @input="setRoad(r.id, { idleCapacity: Number(($event.target as HTMLInputElement).value) })"
                    placeholder="如：2000"
                  />
                </Field>
                <Field label="计划运输货物量（吨）">
                  <input
                    type="number"
                    class="field-input"
                    :value="r.plannedQty || ''"
                    @input="setRoad(r.id, { plannedQty: Number(($event.target as HTMLInputElement).value) })"
                    placeholder="如：8000"
                  />
                </Field>
                <Field label="单位运输价格（元/吨）">
                  <input
                    type="number"
                    class="field-input"
                    :value="r.price || ''"
                    @input="setRoad(r.id, { price: Number(($event.target as HTMLInputElement).value) })"
                    placeholder="如：90"
                  />
                </Field>
                <Field label="运输时效（天）" hint="自动计算">
                  <input
                    type="number"
                    class="field-input bg-apple-fill/60"
                    :value="r.leadTime || ''"
                    readonly
                    placeholder="自动计算"
                  />
                </Field>
                <Field label="承运商">
                    <SearchSelect
                      :options="ROAD_CARRIERS"
                      :model-value="r.carrier"
                      @update:model-value="setRoad(r.id, { carrier: $event })"
                      placeholder="请选择"
                      label="承运商"
                      other-placeholder="如：万合集团"
                    />
                  </Field>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 底部操作栏 -->
    <div class="sticky bottom-4 z-30">
      <div class="card px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-xl bg-apple-card/85">
        <RouterLink :to="`/orders/${order.id}/port`" class="btn-ghost">
          <Icon name="arrow-left" :size="15" /> 上一步
        </RouterLink>
        <div class="flex items-center gap-2">
          <button @click="downloadPdf" :disabled="exporting" class="btn-secondary">
            <Icon name="download" :size="15" /> {{ exporting ? '导出中…' : '下载PDF' }}
          </button>
          <button @click="completePlan" class="btn-primary">
            <Icon name="check-circle" :size="15" /> 完成方案
          </button>
          <RouterLink :to="`/orders/${order.id}`" class="btn-ghost">
            <Icon name="home" :size="15" /> 订单详情
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- 导出成功完成界面（浮层） -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="exported"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
        @click.self="exported = false"
      >
        <div class="card max-w-md w-full p-7 text-center animate-scale-in">
          <div class="w-14 h-14 mx-auto rounded-full bg-apple-green/15 flex items-center justify-center">
            <Icon name="check-circle" :size="32" class="text-apple-green" />
          </div>
          <h3 class="text-lg font-semibold text-apple-text mt-4">运输组织方案已完成</h3>
          <p class="text-sm text-apple-subtext mt-2 leading-relaxed">
            订单 <span class="font-mono font-semibold text-apple-text">{{ order.id }}</span> 的运输组织方案已保存，订单状态已更新为<span class="text-apple-orange font-medium">"待确认"</span>。
          </p>
          <p class="text-xs text-apple-subtext mt-2">
            可随时下载 PDF 文档，或在订单详情中进行财务确认、发运管理等业务操作。
          </p>
          <div class="flex items-center gap-2 mt-5">
            <button @click="exported = false" class="btn-secondary flex-1">
              <Icon name="edit" :size="15" /> 继续修改
            </button>
            <button @click="downloadPdf" :disabled="exporting" class="btn-secondary flex-1">
              <Icon name="download" :size="15" /> {{ exporting ? '导出中…' : '下载PDF' }}
            </button>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <button @click="goDetail" class="btn-primary flex-1">
              <Icon name="home" :size="15" /> 进入订单详情
            </button>
          </div>
          <button @click="goHome" class="text-xs text-apple-subtext hover:text-apple-blue mt-3 transition-colors">
            返回首页
          </button>
        </div>
      </div>
    </Transition>

    <!-- PDF 报告内容（隐藏，仅导出时使用） -->
    <div ref="reportRef" class="hidden">
      <!-- 报告头 -->
      <div class="pdf-section card p-6 sm:p-8 text-center bg-gradient-to-br from-white to-gray-50">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-apple-blue to-blue-700 flex items-center justify-center text-white">
            <Icon name="route" :size="16" />
          </div>
          <span class="text-xs font-semibold tracking-[0.18em] text-apple-blue uppercase">Hongze Yitong</span>
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-apple-text">运输组织方案报告</h2>
        <p class="text-xs text-apple-subtext mt-1.5">
          订单编号 <span class="font-mono font-semibold">{{ order.id }}</span> · 生成时间 {{ fmtDate(new Date().toISOString()) }}
        </p>
      </div>

      <!-- 一、订单信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">1</span>
          <Icon name="clipboard-list" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">订单信息</h3>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
          <InfoRow label="客户" :value="order.trader" />
          <InfoRow v-if="order.traderContact" label="联系人" :value="order.traderContact" />
          <InfoRow v-if="order.traderContactInfo" label="联系方式" :value="order.traderContactInfo" />
          <InfoRow label="货物名称" :value="order.cargoName" />
          <InfoRow label="货物总量" :value="`${fmtNum(order.cargoTotal)} 吨`" strong />
          <InfoRow label="货物单价" :value="`${fmtMoney(order.cargoPrice)} /吨`" />
          <InfoRow label="货物品质" :value="order.cargoQuality" />
          <InfoRow label="来源矿山" :value="order.mine || '—'" />
          <InfoRow label="运输船舶" :value="order.vessel || '—'" />
          <InfoRow label="预计到达港口" :value="order.destPort || '—'" />
          <InfoRow label="终端钢厂" :value="customersDisplay(order.customers) || '—'" />
          <InfoRow label="销售数量合计" :value="`${fmtNum(customersTotalQty(order.customers))} 吨`" strong />
        </div>
      </section>

      <!-- 二、港口信息 -->
      <section v-if="port" class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">2</span>
          <Icon name="anchor" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">港口信息</h3>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
          <InfoRow label="港口名称" :value="port.portName" />
          <InfoRow label="拥堵情况" :value="congLabel" />
          <InfoRow label="装卸效率" :value="port.efficiency || '—'" />
          <InfoRow label="等待时间" :value="`${fmtNum(port.waitHours)} 小时`" />
          <InfoRow label="码头" :value="port.wharf || '—'" />
          <InfoRow label="泊位" :value="port.berth || '—'" />
          <InfoRow label="堆场" :value="port.yard || '—'" />
        </div>
      </section>

      <!-- 三、铁路运力信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">{{ port ? '3' : '2' }}</span>
          <Icon name="train" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">铁路运力信息</h3>
        </div>
        <div class="overflow-x-auto -mx-1 px-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                <th class="py-2 pr-3 font-medium">通道</th>
                <th class="py-2 pr-3 font-medium">起点</th>
                <th class="py-2 pr-3 font-medium">中转</th>
                <th class="py-2 pr-3 font-medium">终点</th>
                <th class="py-2 pr-3 font-medium">运力</th>
                <th class="py-2 pr-3 font-medium">计划运输量</th>
                <th class="py-2 pr-3 font-medium">单位运费</th>
                <th class="py-2 pr-3 font-medium">时效</th>
                <th class="py-2 pr-3 font-medium">承运商</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in railCapacities" :key="c.id" class="border-b border-apple-border/40 last:border-0">
                <td class="py-2.5 pr-3">
                  <span
                    class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none"
                    :style="{ backgroundColor: CHANNEL_META[c.channelType].color + '1a', color: CHANNEL_META[c.channelType].color }"
                  >
                    {{ CHANNEL_META[c.channelType].short }}
                  </span>
                </td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.origin || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ c.transfer ?? '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.destination || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.idleCapacity ? `${fmtNum(c.idleCapacity)} 吨/天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.plannedQty ? `${fmtNum(c.plannedQty)} 吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.price ? `${fmtNum(c.price)} 元/吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.leadTime ? `${c.leadTime} 天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ c.carrier || '—' }}{{ c.roadCarrier ? ` / ${c.roadCarrier}` : '' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 四、公路运力信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">{{ port ? '4' : '3' }}</span>
          <Icon name="truck" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">公路运力信息</h3>
        </div>
        <div class="overflow-x-auto -mx-1 px-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                <th class="py-2 pr-3 font-medium">通道</th>
                <th class="py-2 pr-3 font-medium">起点</th>
                <th class="py-2 pr-3 font-medium">终点</th>
                <th class="py-2 pr-3 font-medium">运力</th>
                <th class="py-2 pr-3 font-medium">计划运输量</th>
                <th class="py-2 pr-3 font-medium">单位运费</th>
                <th class="py-2 pr-3 font-medium">时效</th>
                <th class="py-2 pr-3 font-medium">承运商</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in roads" :key="r.id" class="border-b border-apple-border/40 last:border-0">
                <td class="py-2.5 pr-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style="background-color: rgba(52,199,89,0.1); color: #34c759">公路直达</span>
                </td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.origin || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.destination || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.idleCapacity ? `${fmtNum(r.idleCapacity)} 吨/天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.plannedQty ? `${fmtNum(r.plannedQty)} 吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.price ? `${fmtNum(r.price)} 元/吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ r.leadTime ? `${r.leadTime} 天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ r.carrier || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 五、核心指标 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">{{ port ? '5' : '4' }}</span>
          <Icon name="route" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">运输方案核心指标</h3>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="rounded-apple-lg bg-gradient-to-br from-apple-blue/10 to-transparent border border-apple-blue/20 px-5 py-4">
            <div class="flex items-center gap-2 text-xs text-apple-subtext">
              <Icon name="route" :size="14" class="text-apple-blue" />
              <span>总运费</span>
            </div>
            <div class="text-2xl font-bold text-apple-blue mt-1.5 tracking-tight">{{ fmtMoney(totalFreight) }}</div>
            <div class="text-[11px] text-apple-subtext mt-0.5">总闲置运力 {{ fmtNum(totalIdle) }} 吨/天</div>
          </div>
          <div class="rounded-apple-lg bg-gradient-to-br from-apple-purple/10 to-transparent border border-apple-purple/20 px-5 py-4">
            <div class="flex items-center gap-2 text-xs text-apple-subtext">
              <Icon name="layers" :size="14" class="text-apple-purple" />
              <span>运输时间</span>
            </div>
            <div class="text-2xl font-bold text-apple-purple mt-1.5 tracking-tight">
              {{ maxLeadTime }}<span class="text-base font-medium ml-0.5">天</span>
            </div>
            <div class="text-[11px] text-apple-subtext mt-0.5">关键路径（最长时效）</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pdf-exporting {
  display: block !important;
  padding: 12px;
  background: #ffffff;
}
.pdf-exporting.pdf-section {
  margin-bottom: 16px;
  line-height: 1.65;
}
.pdf-exporting .text-2xl {
  font-size: 28px !important;
  font-weight: 800 !important;
}
.pdf-exporting .overflow-x-auto {
  overflow: visible !important;
}
.pdf-exporting table {
  width: 100% !important;
  border-collapse: collapse !important;
}
.pdf-exporting th {
  font-size: 11px !important;
  padding: 8px 12px 8px 0 !important;
}
.pdf-exporting td {
  padding: 10px 12px 10px 0 !important;
}
.pdf-exporting .rounded-full.text-\[11px\] {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1 !important;
  vertical-align: middle !important;
  padding-top: 3px !important;
  padding-bottom: 3px !important;
  box-sizing: border-box !important;
}
.pdf-exporting a,
.pdf-exporting button {
  display: none !important;
}
</style>
