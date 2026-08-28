<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Field from '@/components/Field.vue'
import FieldGroup from '@/components/FieldGroup.vue'
import InfoRow from '@/components/InfoRow.vue'
import { useOrderStore } from '@/stores/order'
import { fmtNum } from '@/lib/format'
import { customersDisplay, customersTotalQty } from '@/types'
import type { Order, PortInfo } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()
const id = route.params.id as string

const order = computed<Order | undefined>(() => store.getById(id))

const existing = store.portOf(id)
const orderForPort = store.getById(id)
const defaults: PortInfo = {
  orderId: id,
  portName: orderForPort?.destPort ?? '',
  congestion: 'normal',
  efficiency: '',
  wharf: '',
  berth: '',
  yard: '',
  waitHours: 0,
  updatedAt: new Date().toISOString(),
}
const port = reactive<PortInfo>({ ...defaults, ...existing })

const saved = ref(false)
const errors = reactive<Record<string, string>>({})

watch(
  port,
  (val) => {
    if (!order.value) return
    const t = setTimeout(() => {
      store.savePort({ ...val, updatedAt: new Date().toISOString() })
      saved.value = true
      setTimeout(() => (saved.value = false), 1500)
    }, 800)
    return () => clearTimeout(t)
  },
  { deep: true },
)

const CONGESTION_OPTIONS = [
  { value: 'normal', label: '正常', color: '#34c759' },
  { value: 'mild', label: '轻度拥堵', color: '#ff9500' },
  { value: 'severe', label: '严重拥堵', color: '#ff3b30' },
] as const

const cong = computed(() => CONGESTION_OPTIONS.find((c) => c.value === port.congestion)!)

/* ---------- 折叠面板状态 ---------- */
const portOpen = ref(true)
const portSummary = computed(() => {
  const parts = [port.portName, port.wharf].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '未填写'
})

function setField<K extends keyof PortInfo>(key: K, value: PortInfo[K]) {
  ;(port as any)[key] = value
  if (errors[key]) delete errors[key]
}

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  // 港口信息全部为选填项，不做必填校验
  return Object.keys(errors).length === 0
}

function next() {
  if (!validate()) return
  store.savePort({ ...port, updatedAt: new Date().toISOString() })
  store.setStatus(id, 'capacity')
  router.push(`/orders/${id}/capacity`)
}
</script>

<template>
  <div v-if="!order" class="card p-12 text-center">
    <Icon name="alert" :size="32" class="mx-auto text-apple-orange" />
    <p class="mt-3 text-apple-text font-medium">订单不存在</p>
    <RouterLink to="/" class="btn-primary mt-4 inline-flex">返回首页</RouterLink>
  </div>

  <div v-else class="space-y-5 animate-fade-in">
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-apple-text">港口信息</h1>
        <p class="text-xs text-apple-subtext mt-1">
          录入订单关联港口的拥堵、装卸与泊位情况
        </p>
      </div>
      <span
        v-if="saved"
        class="text-[11px] text-apple-green flex items-center gap-1 animate-fade-in"
      >
        <Icon name="check-circle" :size="13" /> 已自动保存草稿
      </span>
    </div>

    <FieldGroup
      icon="anchor"
      title="港口信息"
      desc="与订单预计到达港口联动"
      collapsible
      v-model:isOpen="portOpen"
      :summary="portSummary"
    >
      <template #action>
        <div
          class="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full"
          :style="{ backgroundColor: cong.color + '1a', color: cong.color }"
        >
          <span class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: cong.color }" />
          {{ cong.label }}
        </div>
      </template>

      <div class="grid sm:grid-cols-2 gap-4">
        <Field label="港口名称" hint="自动联动订单预计到达港口">
          <input
            class="field-input bg-gray-50/60"
            :value="port.portName"
            @input="setField('portName', ($event.target as HTMLInputElement).value)"
            placeholder="如：黄骅港"
          />
        </Field>
        <Field label="拥堵情况">
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="c in CONGESTION_OPTIONS"
              :key="c.value"
              type="button"
              @click="setField('congestion', c.value)"
              class="px-3 py-2.5 rounded-apple text-sm font-medium border transition-all"
              :class="
                port.congestion === c.value
                  ? 'border-transparent text-white shadow-sm'
                  : 'border-apple-border text-apple-subtext hover:bg-gray-50'
              "
              :style="port.congestion === c.value ? { backgroundColor: c.color } : undefined"
            >
              {{ c.label }}
            </button>
          </div>
        </Field>
        <Field label="装卸效率">
          <input
            class="field-input"
            :value="port.efficiency"
            @input="setField('efficiency', ($event.target as HTMLInputElement).value)"
            placeholder="如：2500 吨/小时"
          />
        </Field>
        <Field label="等待时间（小时）">
          <input
            type="number"
            class="field-input"
            :value="port.waitHours || ''"
            @input="setField('waitHours', Number(($event.target as HTMLInputElement).value))"
            placeholder="如：12"
          />
        </Field>
        <Field label="码头">
          <input
            class="field-input"
            :value="port.wharf"
            @input="setField('wharf', ($event.target as HTMLInputElement).value)"
            placeholder="如：黄骅港20万吨码头"
          />
        </Field>
        <Field label="泊位">
          <input
            class="field-input"
            :value="port.berth"
            @input="setField('berth', ($event.target as HTMLInputElement).value)"
            placeholder="如：20 万吨级泊位 1 个、10 万吨级泊位 2 个"
          />
        </Field>
        <Field label="堆场" class="sm:col-span-2">
          <textarea
            class="field-input min-h-[70px] resize-y"
            :value="port.yard"
            @input="setField('yard', ($event.target as HTMLTextAreaElement).value)"
            placeholder="如：堆场容量 50 万吨，当前空闲 20 万吨"
          />
        </Field>
      </div>
    </FieldGroup>

    <div class="card p-5">
      <div class="flex items-center gap-2 mb-3">
        <Icon name="info" :size="15" class="text-apple-subtext" />
        <span class="section-title">关联订单关键信息</span>
      </div>
      <div class="grid sm:grid-cols-2 gap-x-8">
        <InfoRow label="货物总量" :value="`${fmtNum(order.cargoTotal)} 吨`" />
        <InfoRow label="终端钢厂" :value="customersDisplay(order.customers) || '—'" />
        <InfoRow label="船舶" :value="order.vessel" />
        <InfoRow label="销售数量合计" :value="`${fmtNum(customersTotalQty(order.customers))} 吨`" />
      </div>
    </div>

    <div class="sticky bottom-4 z-30">
      <div
        class="card px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-xl bg-white/85"
      >
        <RouterLink :to="`/orders/${order.id}/edit`" class="btn-ghost">
          <Icon name="arrow-left" :size="15" /> 上一步
        </RouterLink>
        <button @click="next" class="btn-primary">
          保存并下一步
          <Icon name="arrow-right" :size="15" />
        </button>
      </div>
    </div>
  </div>
</template>
