<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'
import Badge from '@/components/Badge.vue'
import InfoRow from '@/components/InfoRow.vue'
import { useOrderStore } from '@/stores/order'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import { CHANNEL_META, STATUS_META, isTransitChannel, customersDisplay, customersTotalQty } from '@/types'
import type {
  Capacity,
  ChannelDetail,
  ChannelType,
  PlanBatch,
  PortInfo,
  TransitChannelType,
  TransportPlan,
} from '@/types'

const route = useRoute()
const store = useOrderStore()
const id = route.params.id as string

const order = store.getById(id)
const port = ref<PortInfo | undefined>(store.portOf(id))
const capacities = ref<Capacity[]>(store.capacitiesOf(id))
const plan = ref<TransportPlan | undefined>(store.planOf(id))

// 公铁联运中转详情（仅通道2/3）
const channelDetails = ref<ChannelDetail[]>(store.channelDetailsOf(id))
const TRANSIT_CHANNELS: TransitChannelType[] = ['rail_caozhuang', 'rail_xingtai']
function detailOf(type: ChannelType): ChannelDetail | undefined {
  return isTransitChannel(type) ? channelDetails.value.find((d) => d.channelType === type) : undefined
}
/** 判断公铁联运通道是否有任何中转详情数据 */
function hasDetail(d?: ChannelDetail): boolean {
  if (!d) return false
  const l = d.loading
  const p = d.postLeg
  return !!(
    l.equipmentType ||
    l.maxCapacityPerHour ||
    l.workWindow ||
    l.operatorConfig ||
    l.remark ||
    p.vehicleType ||
    p.idleCapacity ||
    p.etaHours ||
    p.cost ||
    p.carrier ||
    p.remark
  )
}

const editing = ref(false)
const batches = ref<PlanBatch[]>(plan.value?.batches ? [...plan.value.batches] : [])
const exporting = ref(false)
const savedTip = ref(false)
const reportRef = ref<HTMLDivElement | null>(null)

const railCapacities = computed(() => capacities.value.filter((c) => c.channelType !== 'road'))
const roadCapacities = computed(() => capacities.value.filter((c) => c.channelType === 'road'))

const allocatedTotal = computed(() => batches.value.reduce((s, b) => s + (b.qty || 0), 0))
const remaining = computed(() => (order ? order.cargoTotal - allocatedTotal.value : 0))
const totalFreight = computed(() =>
  batches.value.reduce((s, b) => s + b.qty * b.price, 0),
)
// 预计时效：加权平均（按运量）+ 最长时效（关键路径）
const weightedLeadTime = computed(() => {
  const total = batches.value.reduce((s, b) => s + (b.qty || 0) * (b.leadTime || 0), 0)
  return allocatedTotal.value > 0 ? total / allocatedTotal.value : 0
})
const maxLeadTime = computed(() => {
  if (batches.value.length === 0) return 0
  return Math.max(...batches.value.map((b) => b.leadTime || 0))
})

const congLabel = port.value
  ? ({ normal: '正常', mild: '轻度拥堵', severe: '严重拥堵' } as const)[port.value.congestion]
  : '—'

function addBatch() {
  const firstCap = capacities.value[0]
  batches.value.push({
    batchNo: batches.value.length + 1,
    qty: 0,
    channelType: firstCap?.channelType ?? 'rail_direct',
    leadTime: firstCap?.leadTime ?? 0,
    price: firstCap?.price ?? 0,
    remark: '',
  })
}
function updateBatch(idx: number, patch: Partial<PlanBatch>) {
  Object.assign(batches.value[idx], patch)
}
function removeBatch(idx: number) {
  batches.value.splice(idx, 1)
  batches.value.forEach((b, i) => (b.batchNo = i + 1))
}

function onChannelChange(idx: number, ct: ChannelType) {
  const cap = capacities.value.find((c) => c.channelType === ct)
  updateBatch(idx, {
    channelType: ct,
    leadTime: cap?.leadTime ?? batches.value[idx].leadTime,
    price: cap?.price ?? batches.value[idx].price,
  })
}

function handleSave() {
  const finalPlan: TransportPlan = {
    orderId: id,
    batches: batches.value.map((b) => ({ ...b })),
    updatedAt: new Date().toISOString(),
  }
  store.savePlan(finalPlan)
  plan.value = finalPlan
  store.setStatus(id, 'pending_confirm')
  editing.value = false
  savedTip.value = true
  setTimeout(() => (savedTip.value = false), 1800)
}

async function exportPDF() {
  if (!reportRef.value) return
  exporting.value = true
  editing.value = false
  reportRef.value.classList.add('pdf-exporting')
  await new Promise((r) => setTimeout(r, 220))
  try {
    const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 34
    const usableW = pageW - margin * 2
    const gap = 14
    const pageContentH = pageH - margin * 2

    pdf.setProperties({
      title: `运输组织方案_${id}`,
      subject: '运输组织方案报告',
      author: '泓泽宜通',
      creator: '泓泽宜通 · 运输组织方案系统',
    })

    const sections = Array.from(
      reportRef.value.querySelectorAll('.pdf-section'),
    ) as HTMLElement[]

    let cursorY = margin
    let pageNum = 1
    const drawPageDeco = () => {
      pdf.setFontSize(7.5)
      pdf.setTextColor(142, 142, 147)
      pdf.text('Hongze Yitong · Transport Plan', margin, 20)
      pdf.text(`${pageNum}`, pageW - margin - 12, pageH - 14)
    }
    drawPageDeco()

    for (const section of sections) {
      const canvas = await html2canvas(section, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const ratio = canvas.width / usableW
      const imgH = canvas.height / ratio
      const remaining = pageH - margin - cursorY - gap

      if (imgH <= remaining) {
        pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
        cursorY += imgH + gap
      } else if (imgH <= pageContentH) {
        pdf.addPage()
        pageNum++
        drawPageDeco()
        cursorY = margin
        pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
        cursorY += imgH + gap
      } else {
        // 超过一页：新建一页后逐段放置
        if (cursorY > margin + 20) {
          pdf.addPage()
          pageNum++
          drawPageDeco()
          cursorY = margin
        }
        let renderedH = 0
        while (renderedH < imgH) {
          const avail = renderedH === 0 ? pageH - margin - cursorY : pageContentH
          if (avail < 50) {
            pdf.addPage()
            pageNum++
            drawPageDeco()
            cursorY = margin
            continue
          }
          const partH = Math.min(avail, imgH - renderedH)
          if (partH >= imgH) {
            pdf.addImage(imgData, 'JPEG', margin, cursorY, usableW, imgH)
          } else {
            const sourceY = Math.floor(renderedH * ratio)
            const sourceH = Math.floor(partH * ratio)
            const tmp = document.createElement('canvas')
            tmp.width = canvas.width
            tmp.height = sourceH
            const ctx = tmp.getContext('2d')!
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, tmp.width, tmp.height)
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
            pdf.addImage(tmp.toDataURL('image/jpeg', 0.95), 'JPEG', margin, cursorY, usableW, partH)
          }
          renderedH += partH
          cursorY += partH
          if (renderedH < imgH) {
            pdf.addPage()
            pageNum++
            drawPageDeco()
            cursorY = margin
          }
        }
        cursorY += gap
      }
    }
    pdf.save(`运输组织方案_${id}.pdf`)
  } catch (err) {
    console.error(err)
    alert('PDF 导出失败，请重试')
  } finally {
    reportRef.value?.classList.remove('pdf-exporting')
    exporting.value = false
  }
}
</script>

<template>
  <div v-if="!order" class="card p-12 text-center">
    <Icon name="alert" :size="32" class="mx-auto text-apple-orange" />
    <p class="mt-3 text-apple-text font-medium">订单不存在</p>
    <RouterLink to="/" class="btn-primary mt-4 inline-flex">返回首页</RouterLink>
  </div>

  <div v-else class="space-y-5 animate-fade-in">
    <PageHeader title="运输组织方案报告">
      <template #subtitle>
        订单编号
        <span class="font-mono font-semibold text-apple-text">{{ order.id }}</span>
      </template>
      <template #actions>
        <span
          v-if="savedTip"
          class="text-[11px] text-apple-green flex items-center gap-1 animate-fade-in"
        >
          <Icon name="check-circle" :size="13" /> 方案已保存
        </span>
        <button v-if="!editing" @click="editing = true" class="btn-secondary">
          <Icon name="edit" :size="15" /> 编辑方案
        </button>
        <button v-else @click="handleSave" class="btn-primary">
          <Icon name="save" :size="15" /> 保存方案
        </button>
        <button @click="exportPDF" :disabled="exporting" class="btn-secondary">
          <Icon name="download" :size="15" />
          {{ exporting ? '导出中…' : '导出PDF' }}
        </button>
      </template>
    </PageHeader>

    <!-- 报告主体 -->
    <div ref="reportRef" class="space-y-4 bg-apple-card p-1">
      <!-- 报告头 -->
      <div class="pdf-section card p-6 sm:p-8 text-center bg-gradient-to-br from-white to-gray-50">
        <div class="flex items-center justify-center gap-2 mb-2">
          <div
            class="w-8 h-8 rounded-lg bg-gradient-to-br from-apple-blue to-blue-700 flex items-center justify-center text-white"
          >
            <Icon name="route" :size="16" />
          </div>
          <span class="text-xs font-semibold tracking-[0.18em] text-apple-blue uppercase">
            Hongze Yitong
          </span>
        </div>
        <h2 class="text-2xl font-semibold tracking-tight text-apple-text">
          运输组织方案报告
        </h2>
        <p class="text-xs text-apple-subtext mt-1.5">
          订单编号 <span class="font-mono font-semibold">{{ order.id }}</span> · 生成时间
          {{ fmtDate(plan?.updatedAt ?? new Date().toISOString()) }}
        </p>
        <div class="flex items-center justify-center gap-2 mt-3">
          <Badge
            :label="STATUS_META[order.status ?? 'plan'].label"
            :color="STATUS_META[order.status ?? 'plan'].color"
            :bg="STATUS_META[order.status ?? 'plan'].bg"
          />
        </div>
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
          <InfoRow label="来源矿山" :value="order.mine" />
          <InfoRow label="运输船舶" :value="order.vessel" />
          <InfoRow label="装船开始" :value="fmtDate(order.loadingStart)" />
          <InfoRow label="起运时间" :value="fmtDate(order.departure)" />
          <InfoRow label="预计到达港口" :value="order.destPort" />
          <InfoRow label="水尺数" :value="`${order.draftMark} 米`" />
          <InfoRow label="终端钢厂" :value="customersDisplay(order.customers) || '—'" />
          <InfoRow label="销售数量合计" :value="`${fmtNum(customersTotalQty(order.customers))} 吨`" strong />
        </div>
        <!-- 终端客户明细 -->
        <div
          v-if="order.customers && order.customers.length > 0"
          class="mt-4 pt-4 border-t border-apple-border/40"
        >
          <div class="text-[11px] text-apple-subtext mb-2">终端客户明细</div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="(c, i) in order.customers"
              :key="c.id"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-apple bg-apple-blue/[0.06] text-xs"
            >
              <span class="text-apple-subtext">{{ i + 1 }}.</span>
              <span class="text-apple-text font-medium">{{ c.name || '—' }}</span>
              <span class="text-apple-blue font-semibold">{{ fmtNum(c.qty) }} 吨</span>
            </span>
          </div>
        </div>
      </section>

      <!-- 二、港口信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">2</span>
          <Icon name="anchor" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">港口信息</h3>
        </div>
        <div v-if="port" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
          <InfoRow label="港口名称" :value="port.portName" />
          <InfoRow label="拥堵情况" :value="congLabel" />
          <InfoRow label="装卸效率" :value="port.efficiency" />
          <InfoRow label="等待时间" :value="`${fmtNum(port.waitHours)} 小时`" />
          <InfoRow label="码头" :value="port.wharf || '—'" />
          <InfoRow label="泊位" :value="port.berth || '—'" />
          <div class="col-span-full">
            <InfoRow label="堆场" :value="port.yard || '—'" />
          </div>
        </div>
        <div v-else class="flex items-center justify-between py-2">
          <p class="text-sm text-apple-subtext">尚未录入港口信息</p>
          <RouterLink :to="`/orders/${order.id}/port`" class="btn-ghost text-xs">
            去录入 <Icon name="arrow-right" :size="13" />
          </RouterLink>
        </div>
      </section>

      <!-- 三、铁路运力信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">3</span>
          <Icon name="train" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">铁路运力信息</h3>
        </div>
        <div v-if="railCapacities.length > 0" class="overflow-x-auto -mx-1 px-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                <th class="py-2 pr-3 font-medium">通道</th>
                <th class="py-2 pr-3 font-medium">起点</th>
                <th class="py-2 pr-3 font-medium">中转</th>
                <th class="py-2 pr-3 font-medium">终点</th>
                <th class="py-2 pr-3 font-medium">闲置运力</th>
                <th class="py-2 pr-3 font-medium">运价</th>
                <th class="py-2 pr-3 font-medium">时效</th>
                <th class="py-2 pr-3 font-medium">承运商</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in railCapacities" :key="c.id" class="border-b border-apple-border/40 last:border-0">
                <td class="py-2.5 pr-3">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none"
                    :style="{ backgroundColor: CHANNEL_META[c.channelType].color + '1a', color: CHANNEL_META[c.channelType].color }"
                  >
                    {{ CHANNEL_META[c.channelType].short }}
                  </span>
                </td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.origin || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ c.transfer ?? '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.destination || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.idleCapacity ? `${fmtNum(c.idleCapacity)} 吨/天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.price ? `${fmtNum(c.price)} 元/吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.leadTime ? `${c.leadTime} 天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ c.carrier || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-apple-subtext py-3">尚未录入铁路运力</p>

        <!-- 公铁联运中转详情（仅通道2/3，且有数据时展示） -->
        <div
          v-if="TRANSIT_CHANNELS.some((ct) => hasDetail(detailOf(ct)))"
          class="mt-5 pt-5 border-t border-apple-border/60 space-y-4"
        >
          <div class="flex items-center gap-2">
            <Icon name="layers" :size="14" class="text-apple-purple" />
            <span class="text-xs font-semibold tracking-wide text-apple-text uppercase">
              公铁联运中转详情
            </span>
            <span class="text-[11px] text-apple-subtext">（中转节点装卸能力 + 后程公路短途运输）</span>
          </div>

          <div
            v-for="ct in TRANSIT_CHANNELS"
            :key="ct"
            v-show="hasDetail(detailOf(ct))"
            class="rounded-apple border border-apple-border/60 p-4 bg-apple-fill/30"
            :style="{ borderLeft: `3px solid ${CHANNEL_META[ct].color}` }"
          >
            <div class="flex items-center gap-2 mb-3">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
                :style="{ backgroundColor: CHANNEL_META[ct].color + '1a', color: CHANNEL_META[ct].color }"
              >
                {{ CHANNEL_META[ct].short }}
              </span>
              <span v-if="detailOf(ct)?.loading?.equipmentType" class="text-[11px] text-apple-subtext">
                中转站：{{ capacities.find((c) => c.channelType === ct)?.transfer ?? CHANNEL_META[ct].transfer }}
              </span>
            </div>

            <!-- 中转节点装卸能力 -->
            <div
              v-if="detailOf(ct) && hasDetail(detailOf(ct))"
              class="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 mb-3"
            >
              <InfoRow label="装卸设备类型" :value="detailOf(ct)!.loading.equipmentType || '—'" />
              <InfoRow
                label="最大装卸量"
                :value="detailOf(ct)!.loading.maxCapacityPerHour ? `${fmtNum(detailOf(ct)!.loading.maxCapacityPerHour)} 吨/小时` : '—'"
              />
              <InfoRow label="作业时间窗口" :value="detailOf(ct)!.loading.workWindow || '—'" />
              <InfoRow label="操作人员配置" :value="detailOf(ct)!.loading.operatorConfig || '—'" />
              <div v-if="detailOf(ct)!.loading.remark" class="col-span-full">
                <InfoRow label="备注" :value="detailOf(ct)!.loading.remark" />
              </div>
            </div>

            <!-- 后程公路短途运输 -->
            <div
              v-if="detailOf(ct)"
              class="mt-3 pt-3 border-t border-apple-border/40"
            >
              <div class="flex items-center gap-1.5 mb-2.5">
                <Icon name="truck" :size="12" class="text-apple-green" />
                <span class="text-[11px] font-semibold text-apple-text">后程公路短途运输</span>
                <span class="text-[11px] text-apple-subtext">（中转站 → 终端钢厂）</span>
              </div>
              <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                <InfoRow label="运输车辆类型" :value="detailOf(ct)!.postLeg.vehicleType || '—'" />
                <InfoRow
                  label="闲置运量"
                  :value="detailOf(ct)!.postLeg.idleCapacity ? `${fmtNum(detailOf(ct)!.postLeg.idleCapacity)} 吨/天` : '—'"
                />
                <InfoRow
                  label="预计耗时"
                  :value="detailOf(ct)!.postLeg.etaHours ? `${detailOf(ct)!.postLeg.etaHours} 小时` : '—'"
                />
                <InfoRow
                  label="运输成本"
                  :value="detailOf(ct)!.postLeg.cost ? `${fmtNum(detailOf(ct)!.postLeg.cost)} 元/吨` : '—'"
                />
                <InfoRow label="承运商信息" :value="detailOf(ct)!.postLeg.carrier || '—'" />
                <div v-if="detailOf(ct)!.postLeg.remark" class="col-span-full">
                  <InfoRow label="备注" :value="detailOf(ct)!.postLeg.remark" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 四、公路运力信息 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">4</span>
          <Icon name="truck" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">公路运力信息</h3>
        </div>
        <div v-if="roadCapacities.length > 0" class="overflow-x-auto -mx-1 px-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                <th class="py-2 pr-3 font-medium">通道</th>
                <th class="py-2 pr-3 font-medium">起点</th>
                <th class="py-2 pr-3 font-medium">终点</th>
                <th class="py-2 pr-3 font-medium">闲置运力</th>
                <th class="py-2 pr-3 font-medium">运价</th>
                <th class="py-2 pr-3 font-medium">时效</th>
                <th class="py-2 pr-3 font-medium">承运商</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in roadCapacities" :key="c.id" class="border-b border-apple-border/40 last:border-0">
                <td class="py-2.5 pr-3">
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium" style="background-color: rgba(52,199,89,0.1); color: #34c759">
                    公路直达
                  </span>
                </td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.origin || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.destination || '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.idleCapacity ? `${fmtNum(c.idleCapacity)} 吨/天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.price ? `${fmtNum(c.price)} 元/吨` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-text">{{ c.leadTime ? `${c.leadTime} 天` : '—' }}</td>
                <td class="py-2.5 pr-3 text-apple-subtext">{{ c.carrier || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="text-sm text-apple-subtext py-3">尚未录入公路运力</p>
      </section>

      <!-- 五、运输方案 -->
      <section class="pdf-section card p-5 sm:p-6">
        <div class="flex items-center gap-2.5 mb-4">
          <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">5</span>
          <Icon name="route" :size="16" class="text-apple-subtext" />
          <h3 class="text-base font-semibold tracking-tight text-apple-text">运输方案</h3>
        </div>

        <div class="mb-4 flex items-center gap-3 flex-wrap">
          <div class="flex items-center gap-2 text-sm">
            <span class="text-apple-subtext">货物总量</span>
            <span class="font-semibold text-apple-text">{{ fmtNum(order.cargoTotal) }} 吨</span>
          </div>
          <span class="text-apple-border">·</span>
          <div class="flex items-center gap-2 text-sm">
            <span class="text-apple-subtext">已分配</span>
            <span class="font-semibold" :class="remaining === 0 ? 'text-apple-green' : 'text-apple-orange'">
              {{ fmtNum(allocatedTotal) }} 吨
            </span>
          </div>
          <span
            v-if="remaining !== 0"
            class="text-xs px-2 py-0.5 rounded-full"
            :class="remaining > 0 ? 'bg-apple-orange/10 text-apple-orange' : 'bg-apple-red/10 text-apple-red'"
          >
            {{ remaining > 0 ? `待分配 ${fmtNum(remaining)} 吨` : `超出 ${fmtNum(-remaining)} 吨` }}
          </span>
        </div>

        <div v-if="batches.length === 0" class="text-center py-8">
          <div class="w-12 h-12 rounded-full bg-apple-fill flex items-center justify-center text-apple-subtext mx-auto mb-3">
            <Icon name="layers" :size="22" />
          </div>
          <p class="text-sm text-apple-text font-medium">尚未设计运输方案</p>
          <p class="text-xs text-apple-subtext mt-1">
            {{ editing ? '点击下方按钮添加批次' : '点击右上角"编辑方案"开始设计拆分' }}
          </p>
          <button v-if="editing" @click="addBatch" class="btn-primary mt-4">
            <Icon name="plus" :size="15" /> 添加批次
          </button>
        </div>

        <div v-else class="overflow-x-auto -mx-1 px-1">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] text-apple-subtext uppercase tracking-wider border-b border-apple-border">
                <th class="py-2 pr-3 font-medium">批次</th>
                <th class="py-2 pr-3 font-medium">运量（吨）</th>
                <th class="py-2 pr-3 font-medium">通道</th>
                <th class="py-2 pr-3 font-medium">时效（天）</th>
                <th class="py-2 pr-3 font-medium">运价（元/吨）</th>
                <th class="py-2 pr-3 font-medium">运费小计</th>
                <th v-if="editing" class="py-2 font-medium w-10"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(b, idx) in batches" :key="idx" class="border-b border-apple-border/40 last:border-0">
                <td class="py-3 pr-3">
                  <span class="flex items-center justify-center w-6 h-6 rounded-md bg-apple-fill text-apple-text text-xs font-semibold">
                    {{ b.batchNo }}
                  </span>
                </td>
                <td class="py-3 pr-3">
                  <input
                    v-if="editing"
                    type="number"
                    class="field-input py-1.5 w-24"
                    :value="b.qty || ''"
                    @input="updateBatch(idx, { qty: Number(($event.target as HTMLInputElement).value) })"
                  />
                  <span v-else>{{ fmtNum(b.qty) }}</span>
                </td>
                <td class="py-3 pr-3">
                  <select
                    v-if="editing"
                    class="field-input py-1.5 min-w-[140px]"
                    :value="b.channelType"
                    @change="onChannelChange(idx, ($event.target as HTMLSelectElement).value as ChannelType)"
                  >
                    <template v-if="capacities.length > 0">
                      <option v-for="c in capacities" :key="c.id" :value="c.channelType">
                        {{ CHANNEL_META[c.channelType].short }}{{ c.transfer ? `·${c.transfer}` : '' }}
                      </option>
                    </template>
                    <option v-else :value="b.channelType">{{ CHANNEL_META[b.channelType].short }}</option>
                  </select>
                  <span
                    v-else
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium leading-none"
                    :style="{ backgroundColor: CHANNEL_META[b.channelType].color + '1a', color: CHANNEL_META[b.channelType].color }"
                  >
                    {{ CHANNEL_META[b.channelType].short }}
                  </span>
                </td>
                <td class="py-3 pr-3">
                  <input
                    v-if="editing"
                    type="number"
                    class="field-input py-1.5 w-16"
                    :value="b.leadTime || ''"
                    @input="updateBatch(idx, { leadTime: Number(($event.target as HTMLInputElement).value) })"
                  />
                  <span v-else>{{ b.leadTime }}</span>
                </td>
                <td class="py-3 pr-3">
                  <input
                    v-if="editing"
                    type="number"
                    class="field-input py-1.5 w-20"
                    :value="b.price || ''"
                    @input="updateBatch(idx, { price: Number(($event.target as HTMLInputElement).value) })"
                  />
                  <span v-else>{{ fmtNum(b.price) }}</span>
                </td>
                <td class="py-3 pr-3 font-semibold text-apple-text">{{ fmtMoney(b.qty * b.price) }}</td>
                <td v-if="editing" class="py-3">
                  <button
                    @click="removeBatch(idx)"
                    class="flex items-center justify-center w-7 h-7 rounded-full text-apple-subtext hover:bg-apple-red/10 hover:text-apple-red transition-colors"
                  >
                    <Icon name="trash" :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button v-if="editing && batches.length > 0" @click="addBatch" class="btn-ghost mt-3 text-xs">
          <Icon name="plus" :size="14" /> 添加批次
        </button>

        <!-- 关键指标突出展示：总价 + 预计时效 -->
        <div v-if="batches.length > 0" class="mt-4 grid sm:grid-cols-2 gap-3">
          <div class="rounded-apple-lg bg-gradient-to-br from-apple-blue/10 to-transparent border border-apple-blue/20 px-5 py-4">
            <div class="flex items-center gap-2 text-xs text-apple-subtext">
              <Icon name="route" :size="14" class="text-apple-blue" />
              <span>运输总价</span>
            </div>
            <div class="text-2xl font-bold text-apple-blue mt-1.5 tracking-tight">
              {{ fmtMoney(totalFreight) }}
            </div>
            <div class="text-[11px] text-apple-subtext mt-0.5">
              {{ batches.length }} 个批次 · 合计 {{ fmtNum(allocatedTotal) }} 吨
            </div>
          </div>
          <div class="rounded-apple-lg bg-gradient-to-br from-apple-purple/10 to-transparent border border-apple-purple/20 px-5 py-4">
            <div class="flex items-center gap-2 text-xs text-apple-subtext">
              <Icon name="layers" :size="14" class="text-apple-purple" />
              <span>预计时效</span>
            </div>
            <div class="text-2xl font-bold text-apple-purple mt-1.5 tracking-tight">
              {{ weightedLeadTime.toFixed(1) }}
              <span class="text-base font-medium ml-0.5">天</span>
              <span class="text-[11px] font-normal text-apple-subtext ml-2">加权平均</span>
            </div>
            <div class="text-[11px] text-apple-subtext mt-0.5">
              最长时效 {{ maxLeadTime }} 天 · 关键路径
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 操作栏 -->
    <div class="sticky bottom-4 z-30">
      <div class="card px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-xl bg-apple-card/85">
        <RouterLink :to="`/orders/${order.id}/capacity`" class="btn-ghost">
          <Icon name="arrow-left" :size="15" /> 上一步
        </RouterLink>
        <div class="flex items-center gap-2">
          <button v-if="editing" @click="handleSave" class="btn-primary">
            <Icon name="save" :size="15" /> 保存方案
          </button>
          <button v-else @click="editing = true" class="btn-secondary">
            <Icon name="edit" :size="15" /> 编辑方案
          </button>
          <button @click="exportPDF" :disabled="exporting" class="btn-secondary">
            <Icon name="download" :size="15" /> 导出PDF
          </button>
          <RouterLink to="/" class="btn-ghost">
            <Icon name="home" :size="15" /> 返回首页
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===== PDF 导出样式优化 ===== */
.pdf-exporting {
  padding: 12px;
  background: #ffffff;
}

.pdf-exporting .pdf-section {
  margin-bottom: 16px;
  line-height: 1.65;
}

/* 总价与时效卡片在 PDF 中更醒目 */
.pdf-exporting .text-2xl {
  font-size: 28px !important;
  font-weight: 800 !important;
}

/* 报告头优化 */
.pdf-exporting .pdf-section:first-child h2 {
  font-size: 26px !important;
  letter-spacing: -0.02em !important;
}

/* 表格优化：确保完整展示 */
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

/* 色块标签文字垂直居中（仅作用于带文字的小色块，避免影响大圆形图标） */
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
.pdf-exporting .rounded-full.text-xs {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 1.1 !important;
  vertical-align: middle !important;
  padding-top: 2px !important;
  padding-bottom: 2px !important;
  box-sizing: border-box !important;
}

/* 隐藏交互元素 */
.pdf-exporting a,
.pdf-exporting button {
  display: none !important;
}

/* 字号微调 */
.pdf-exporting .text-sm {
  font-size: 13.5px !important;
}

.pdf-exporting .text-xs {
  font-size: 12px !important;
}

.pdf-exporting .text-\[11px\] {
  font-size: 11.5px !important;
}
</style>
