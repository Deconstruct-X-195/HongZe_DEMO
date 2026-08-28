<script setup lang="ts">
import Icon from '@/components/Icon.vue'
import InfoRow from '@/components/InfoRow.vue'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import {
  CHANNEL_META,
  customersDisplay,
  customersTotalQty,
} from '@/types'
import type { Order, PortInfo, Capacity, ChannelType } from '@/types'

const props = defineProps<{
  order: Order
  port?: PortInfo | undefined
  capacities: Capacity[]
  totalFreight: number
  maxLeadTime: number
  totalIdle: number
}>()

const congLabel = props.port
  ? ({ normal: '正常', mild: '轻度拥堵', severe: '严重拥堵' } as const)[props.port.congestion]
  : '—'

// 铁路通道（铁路直达 + 公铁联运）
const railCapacities = props.capacities.filter(
  (c) => c.channelType !== 'road',
)
// 公路通道
const roadCapacities = props.capacities.filter(
  (c) => c.channelType === 'road',
)
</script>

<template>
  <div>
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
    <section v-if="railCapacities.length > 0" class="pdf-section card p-5 sm:p-6">
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
                  :style="{ backgroundColor: CHANNEL_META[c.channelType as ChannelType].color + '1a', color: CHANNEL_META[c.channelType as ChannelType].color }"
                >
                  {{ CHANNEL_META[c.channelType as ChannelType].short }}
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
    <section v-if="roadCapacities.length > 0" class="pdf-section card p-5 sm:p-6">
      <div class="flex items-center gap-2.5 mb-4">
        <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">{{ port ? (railCapacities.length > 0 ? '4' : '3') : (railCapacities.length > 0 ? '3' : '2') }}</span>
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
            <tr v-for="r in roadCapacities" :key="r.id" class="border-b border-apple-border/40 last:border-0">
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
        <span class="flex items-center justify-center w-7 h-7 rounded-lg bg-apple-text/5 text-apple-text text-xs font-semibold">{{ port ? (railCapacities.length > 0 ? (roadCapacities.length > 0 ? '5' : '4') : (roadCapacities.length > 0 ? '4' : '3')) : (railCapacities.length > 0 ? (roadCapacities.length > 0 ? '4' : '3') : (roadCapacities.length > 0 ? '3' : '2')) }}</span>
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
</template>

<style>
/* PDF 导出时的样式覆盖（非 scoped，需影响所有子元素） */
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
