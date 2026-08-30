<template>
  <div class="space-y-3">
    <!-- 导航提示 -->
    <div class="flex items-center gap-2 text-[11px] text-apple-subtext px-1">
      <Icon name="info" :size="12" />
      <span>货物批次（V3 批次模型）· 承运前固化创建批次，数量五级口径贯穿订单→运输→入库→出库→结算</span>
    </div>

    <!-- 批次总览 -->
    <div class="card p-5">
      <div class="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
          <Icon name="layers" :size="16" class="text-apple-subtext" />
          批次总览
        </h3>
        <button
          v-if="!showForm"
          class="text-[11px] px-2.5 py-1 rounded-full bg-apple-blue text-white font-medium hover:bg-apple-blue/90 transition-colors flex items-center gap-1"
          @click="showForm = true"
        >
          <Icon name="plus" :size="11" /> 新增批次
        </button>
      </div>
      <div class="grid grid-cols-4 gap-3">
        <div class="rounded-apple-lg border border-apple-border bg-apple-fill/30 p-3 text-center">
          <div class="text-[11px] text-apple-subtext">批次数</div>
          <div class="text-lg font-bold text-apple-text mt-1">{{ batches.length }}</div>
        </div>
        <div class="rounded-apple-lg border border-apple-blue/20 bg-apple-blue/[0.04] p-3 text-center">
          <div class="text-[11px] text-apple-subtext">累计计划量</div>
          <div class="text-lg font-bold text-apple-blue mt-1">{{ fmtNum(totalPlanned) }}<span class="text-xs font-normal ml-1">吨</span></div>
        </div>
        <div class="rounded-apple-lg border border-apple-green/20 bg-apple-green/[0.04] p-3 text-center">
          <div class="text-[11px] text-apple-subtext">累计入库量</div>
          <div class="text-lg font-bold text-apple-green mt-1">{{ fmtNum(totalInbound) }}<span class="text-xs font-normal ml-1">吨</span></div>
        </div>
        <div class="rounded-apple-lg border border-apple-orange/20 bg-apple-orange/[0.04] p-3 text-center">
          <div class="text-[11px] text-apple-subtext">当前库存量</div>
          <div class="text-lg font-bold text-apple-orange mt-1">{{ fmtNum(totalStock) }}<span class="text-xs font-normal ml-1">吨</span></div>
        </div>
      </div>
      <!-- 校验提示 -->
      <div v-if="totalPlanned > orderCargoTotal" class="mt-3 text-[11px] text-apple-red flex items-center gap-1">
        <Icon name="alert" :size="12" />
        批次计划量合计（{{ fmtNum(totalPlanned) }}吨）已超过订单总量（{{ fmtNum(orderCargoTotal) }}吨），请调整
      </div>
    </div>

    <!-- 新增批次表单 -->
    <div v-if="showForm" class="card p-5 border-2 border-apple-blue/20">
      <h3 class="text-sm font-semibold text-apple-text mb-4 flex items-center gap-2">
        <Icon name="plus" :size="14" class="text-apple-blue" />
        新增货物批次
        <span class="text-[11px] px-1.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-medium">承运前固化</span>
      </h3>
      <form @submit.prevent="handleAdd" class="space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">货物名称 <span class="text-apple-red">*</span></label>
            <input v-model="form.cargoName" type="text" required class="field-input" placeholder="如：铁矿石" />
          </div>
          <div>
            <label class="field-label">品类</label>
            <input v-model="form.cargoType" type="text" class="field-input" placeholder="如：铁矿" />
          </div>
          <div>
            <label class="field-label">品质</label>
            <input v-model="form.cargoQuality" type="text" class="field-input" placeholder="如：62%品位" />
          </div>
          <div>
            <label class="field-label">来源矿山</label>
            <input v-model="form.mine" type="text" class="field-input" placeholder="如：某矿山" />
          </div>
          <div>
            <label class="field-label">计划量（吨）<span class="text-apple-red">*</span></label>
            <input v-model.number="form.plannedQty" type="number" min="0" step="0.01" required class="field-input" placeholder="如：5000" />
            <p class="text-[9px] text-apple-subtext mt-0.5">商务基准量，后续装车/入库/出库均以此校验</p>
          </div>
          <div>
            <label class="field-label">备注</label>
            <input v-model="form.remark" type="text" class="field-input" placeholder="选填" />
          </div>
        </div>
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-apple-border">
          <button type="button" class="btn-secondary text-xs" @click="showForm = false">取消</button>
          <button type="submit" class="btn-primary text-xs">创建批次</button>
        </div>
      </form>
    </div>

    <!-- 批次列表 -->
    <div v-if="batches.length === 0" class="card p-5">
      <EmptyState icon="layers" title="暂无货物批次" desc="在承运前固化阶段创建批次后，装车、入库、出库、结算数量将自动挂载到批次上。" />
    </div>
    <div v-for="b in batches" :key="b.id" class="card p-5">
      <div class="flex items-start justify-between flex-wrap gap-2 mb-3">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm font-semibold text-apple-text">{{ b.batchNo }}</span>
          <Badge :label="CARGO_BATCH_STATUS_META[b.status].label" :color="CARGO_BATCH_STATUS_META[b.status].color" :bg="CARGO_BATCH_STATUS_META[b.status].bg" />
          <span class="text-[11px] text-apple-subtext">{{ b.cargoName }}<template v-if="b.cargoQuality"> · {{ b.cargoQuality }}</template></span>
        </div>
        <button
          v-if="b.status === 'created'"
          class="text-[11px] text-apple-red/70 hover:text-apple-red transition-colors flex items-center gap-1"
          @click="handleRemove(b.id)"
        >
          <Icon name="trash" :size="11" /> 删除
        </button>
      </div>
      <QuantityWaterfall
        :planned="b.plannedQty"
        :loaded="b.loadedQty"
        :inbound="b.inboundQty"
        :outbound="b.outboundQty"
        :settled="b.settledQty"
      />
      <div class="mt-3 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-apple bg-apple-fill/40 px-2 py-1.5">
          <div class="text-[11px] text-apple-subtext">当前库存</div>
          <div class="text-xs font-bold text-apple-text mt-0.5">{{ fmtNum(stockOf(b)) }} 吨</div>
        </div>
        <div class="rounded-apple bg-apple-fill/40 px-2 py-1.5">
          <div class="text-[11px] text-apple-subtext">剩余未入库</div>
          <div class="text-xs font-bold text-apple-text mt-0.5">{{ fmtNum(remainingOf(b)) }} 吨</div>
        </div>
        <div class="rounded-apple bg-apple-fill/40 px-2 py-1.5">
          <div class="text-[11px] text-apple-subtext">创建时间</div>
          <div class="text-xs font-bold text-apple-text mt-0.5">{{ fmtDate(b.createdAt) }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import Icon from '@/components/Icon.vue'
import Badge from '@/components/Badge.vue'
import EmptyState from '@/components/EmptyState.vue'
import QuantityWaterfall from '@/components/QuantityWaterfall.vue'
import { useBusinessStore } from '@/stores'
import { fmtDate, fmtNum } from '@/lib/format'
import { CARGO_BATCH_STATUS_META } from '@/types'
import type { CargoBatch } from '@/types'

const props = defineProps<{
  orderId: string
  orderCargoTotal: number
}>()

const business = useBusinessStore()
const showForm = ref(false)
const form = ref({ cargoName: '', cargoType: '', cargoQuality: '', mine: '', plannedQty: 0, remark: '' })

const batches = computed(() => business.cargoBatches.filter((b) => b.orderId === props.orderId))

const totalPlanned = computed(() => batches.value.reduce((s, b) => s + b.plannedQty, 0))
const totalInbound = computed(() => batches.value.reduce((s, b) => s + b.inboundQty, 0))
const totalStock = computed(() => batches.value.reduce((s, b) => s + stockOf(b), 0))

function stockOf(b: CargoBatch): number {
  return b.inboundQty - b.outboundQty
}
function remainingOf(b: CargoBatch): number {
  return b.plannedQty - b.inboundQty
}

function handleAdd() {
  if (!form.value.cargoName || form.value.plannedQty <= 0) return
  business.addCargoBatch({ ...form.value, orderId: props.orderId })
  form.value = { cargoName: '', cargoType: '', cargoQuality: '', mine: '', plannedQty: 0, remark: '' }
  showForm.value = false
}

function handleRemove(id: string) {
  business.removeCargoBatch(id)
}

onMounted(() => business.loadCargoBatches())
</script>
