<template>
  <div class="space-y-3">
    <!-- 订单信息 -->
    <section class="card overflow-hidden">
      <button @click="orderOpen = !orderOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-apple-blue/10 text-apple-blue"><Icon name="clipboard-list" :size="16" /></div>
          <div class="text-left">
            <h2 class="text-sm font-semibold text-apple-text">订单信息</h2>
            <p class="text-xs text-apple-subtext mt-0.5">{{ order.trader }} · {{ order.cargoName }} · {{ fmtNum(order.cargoTotal) }} 吨</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink v-if="canManageOrder" :to="`/orders/${order.id}/edit`" class="btn-ghost text-xs" @click.stop>编辑 <Icon name="chevron-right" :size="13" /></RouterLink>
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
      <button @click="portOpen = !portOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center w-8 h-8 rounded-lg bg-apple-orange/10 text-apple-orange"><Icon name="anchor" :size="16" /></div>
          <div class="text-left">
            <h2 class="text-sm font-semibold text-apple-text">港口信息</h2>
            <p class="text-xs text-apple-subtext mt-0.5">{{ port ? `${port.portName} · ${congLabel(port.congestion)}` : '未填写' }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <RouterLink v-if="canManageOrder" :to="`/orders/${order.id}/port`" class="btn-ghost text-xs" @click.stop>{{ port ? '编辑' : '去录入' }} <Icon name="chevron-right" :size="13" /></RouterLink>
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
      <button @click="transportOpen = !transportOpen" class="w-full flex items-center justify-between px-5 py-3.5 hover:bg-apple-hover/10 transition-colors">
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
          <RouterLink v-if="canManageOrder" :to="`/orders/${order.id}/capacity`" class="btn-ghost text-xs" @click.stop>{{ capacities.length > 0 ? '编辑' : '去录入' }} <Icon name="chevron-right" :size="13" /></RouterLink>
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
              <div class="text-lg font-bold text-apple-orange mt-1 tracking-tight">{{ fmtNum(allocatedQty) }}<span class="text-xs font-medium ml-0.5">/ {{ fmtNum(order.cargoTotal) }} 吨</span></div>
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
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import InfoRow from '@/components/InfoRow.vue'
import { fmtDate, fmtNum, fmtMoney } from '@/lib/format'
import { CHANNEL_META, customersDisplay, customersTotalQty } from '@/types'
import type { Order, PortInfo, Capacity, TransportPlan, ChannelType } from '@/types'
import { congLabel } from './shipping-helpers'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  order: Order
  port?: PortInfo
  capacities: Capacity[]
  plan?: TransportPlan
  totalFreight: number
  maxLeadTime: number
  totalIdle: number
  allocatedQty: number
}>()

const auth = useAuthStore()
/** 订单编辑/录入仅限业务人员与系统管理员 */
const canManageOrder = computed(() => auth.role === 'sales' || auth.role === 'admin')

const orderOpen = ref(false)
const portOpen = ref(false)
const transportOpen = ref(false)
</script>
