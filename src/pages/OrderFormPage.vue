<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import Field from '@/components/Field.vue'
import FieldGroup from '@/components/FieldGroup.vue'
import SearchSelect from '@/components/SearchSelect.vue'
import { useOrderStore } from '@/stores/order'
import { fmtDate, fmtNum, toLocalInput } from '@/lib/format'
import { customersDisplay, customersTotalQty, MINE_OPTIONS, CARGO_CATEGORIES, TRADER_OPTIONS } from '@/types'
import type { Order, TerminalCustomer } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useOrderStore()

const id = route.params.id as string | undefined
const isEdit = computed(() => !!id)

function makeCustomer(): TerminalCustomer {
  return {
    id: `cust_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    qty: 0,
  }
}

function emptyOrder(orderId: string): Order {
  const now = new Date().toISOString()
  return {
    id: orderId,
    trader: '',
    traderContact: '',
    traderContactInfo: '',
    cargoName: '铁矿石',
    cargoTotal: 0,
    cargoPrice: 0,
    cargoQuality: '',
    mine: '',
    vessel: '',
    loadingStart: '',
    departure: '',
    destPort: '',
    draftMark: 0,
    customers: [makeCustomer()],
    createdAt: now,
    updatedAt: now,
    status: 'draft',
  }
}

const existing = id ? store.getById(id) : undefined
const order = reactive<Order>(existing ? { ...existing } : emptyOrder(''))
const saved = ref(false)
const errors = reactive<Record<string, string>>({})

// 草稿自动保存（仅编辑模式）
watch(
  order,
  (val) => {
    if (!isEdit.value || !val.id) return
    const t = setTimeout(() => {
      store.saveOrder({ ...val, updatedAt: new Date().toISOString() })
      saved.value = true
      setTimeout(() => (saved.value = false), 1500)
    }, 800)
    return () => clearTimeout(t)
  },
  { deep: true },
)

function setField<K extends keyof Order>(key: K, value: Order[K]) {
  ;(order as any)[key] = value
  if (errors[key]) delete errors[key]
}

/* ---------- 终端客户动态管理 ---------- */
function addCustomer() {
  order.customers.push(makeCustomer())
}
function removeCustomer(cid: string) {
  const idx = order.customers.findIndex((c) => c.id === cid)
  if (idx >= 0) order.customers.splice(idx, 1)
}
function setCustomerName(cid: string, name: string) {
  const c = order.customers.find((x) => x.id === cid)
  if (c) c.name = name
}
function setCustomerQty(cid: string, qty: number) {
  const c = order.customers.find((x) => x.id === cid)
  if (c) c.qty = qty
}

const saleTotal = computed(() => customersTotalQty(order.customers))
const customersText = computed(() => customersDisplay(order.customers))

const summary = computed(() => ({
  total: order.cargoTotal,
  sale: saleTotal.value,
  diff: order.cargoTotal - saleTotal.value,
}))

/** 来源矿山下拉选择逻辑：使用独立状态跟踪"其他"选项 */
const mineSelectValue = ref(
  !order.mine ? '' : MINE_OPTIONS.includes(order.mine) ? order.mine : '其他',
)
const isMineOther = computed(() => mineSelectValue.value === '其他')
function setMineSelect(val: string) {
  mineSelectValue.value = val
  if (val === '其他') {
    order.mine = '' // 切换到自定义输入，清空已有值
  } else {
    order.mine = val
  }
  if (errors.mine) delete errors.mine
}
function setMineCustom(val: string) {
  order.mine = val
  if (errors.mine) delete errors.mine
}

/* ---------- 折叠面板状态 ---------- */
const customerOpen = ref(true)
const cargoOpen = ref(true)
const portOpen = ref(false)
const customersOpen = ref(false)

/* ---------- 折叠摘要 ---------- */
const customerSummary = computed(() => {
  if (!order.trader) return '未填写'
  return `${order.trader}${order.traderContact ? ' · ' + order.traderContact : ''}`
})
const cargoSummary = computed(() => {
  if (!order.cargoName) return '未填写'
  return `${order.cargoName} · ${fmtNum(order.cargoTotal)} 吨`
})
const portSummary = computed(() => {
  const parts = [order.destPort, order.vessel].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : '未填写'
})
const customersSummary = computed(() => customersText.value || '未填写')

function validate(): boolean {
  const req: (keyof Order)[] = [
    'trader', 'traderContact', 'traderContactInfo',
    'cargoName', 'cargoTotal', 'cargoPrice', 'cargoQuality',
  ]
  Object.keys(errors).forEach((k) => delete errors[k])
  req.forEach((k) => {
    const v = order[k]
    if (v === '' || v === 0 || v === null || v === undefined) errors[k] = '必填'
  })
  // 来源矿山、终端客户、到港信息均为选填项
  return Object.keys(errors).length === 0
}

/** 保存前清理空客户记录（名称为空的不保留） */
function cleanCustomers(): TerminalCustomer[] {
  return order.customers.filter((c) => c.name.trim())
}

function saveDraft() {
  const finalId = order.id || store.generateId()
  const now = new Date().toISOString()
  const draft: Order = {
    ...order,
    customers: cleanCustomers(),
    id: finalId,
    createdAt: order.createdAt || now,
    updatedAt: now,
    status: order.status ?? 'draft',
  }
  Object.assign(order, draft)
  store.saveOrder(draft)
  saved.value = true
  setTimeout(() => (saved.value = false), 1500)
}

function generate() {
  if (!validate()) {
    const first = document.querySelector('[data-error="true"]')
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  const finalId = order.id || store.generateId()
  const now = new Date().toISOString()
  const finalOrder: Order = {
    ...order,
    customers: cleanCustomers(),
    id: finalId,
    createdAt: order.createdAt || now,
    updatedAt: now,
    status: 'port',
  }
  Object.assign(order, finalOrder)
  store.saveOrder(finalOrder)
  router.push(`/orders/${finalId}/port`)
}
</script>

<template>
  <div class="space-y-5 animate-fade-in">
    <!-- 头部 -->
    <div class="flex items-center justify-between gap-3 flex-wrap">
      <div>
        <h1 class="text-xl font-semibold tracking-tight text-apple-text">
          {{ isEdit ? '编辑订单' : '新建订单' }}
        </h1>
        <p class="text-xs text-apple-subtext mt-1">
          <template v-if="isEdit">
            订单编号
            <span class="font-mono font-semibold text-apple-text">{{ order.id }}</span>
          </template>
          <template v-else>填写后将自动生成订单编号并进入下一步</template>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span
          v-if="saved"
          class="text-[11px] text-apple-green flex items-center gap-1 animate-fade-in"
        >
          <Icon name="check-circle" :size="13" /> 已自动保存
        </span>
        <button @click="saveDraft" class="btn-secondary">
          <Icon name="save" :size="15" /> 保存草稿
        </button>
      </div>
    </div>

    <FieldGroup icon="building" title="客户" desc="客户名称与联系人信息" collapsible v-model:isOpen="customerOpen" :summary="customerSummary">
      <div class="grid sm:grid-cols-2 gap-4">
        <Field label="客户" required>
            <SearchSelect
              :options="TRADER_OPTIONS"
              :model-value="order.trader"
              @update:model-value="setField('trader', $event)"
              placeholder="如：中矿国链"
              label="客户"
              other-placeholder="如：中矿国链"
            />
        </Field>
        <Field label="联系人" required>
          <input
            class="field-input"
            :data-error="!!errors.traderContact"
            :value="order.traderContact"
            @input="setField('traderContact', ($event.target as HTMLInputElement).value)"
            placeholder="如：张经理"
          />
        </Field>
        <Field label="联系方式" required class="sm:col-span-2">
          <input
            class="field-input"
            :data-error="!!errors.traderContactInfo"
            :value="order.traderContactInfo"
            @input="setField('traderContactInfo', ($event.target as HTMLInputElement).value)"
            placeholder="如：138-XXXX-XXXX"
          />
        </Field>
      </div>
    </FieldGroup>

    <FieldGroup icon="package" title="货物信息" desc="货物名称、数量与品质" collapsible v-model:isOpen="cargoOpen" :summary="cargoSummary">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="货物名称" required>
          <SearchSelect
            :options="CARGO_CATEGORIES"
            :model-value="order.cargoName"
            @update:model-value="setField('cargoName', $event)"
            placeholder="如：PB粉"
            label="货物名称"
            other-placeholder="如：PB粉"
          />
        </Field>
        <Field label="货物总量（吨）" required>
          <input
            type="number"
            class="field-input"
            :data-error="!!errors.cargoTotal"
            :value="order.cargoTotal || ''"
            @input="setField('cargoTotal', Number(($event.target as HTMLInputElement).value))"
            placeholder="如：70000"
          />
        </Field>
        <Field label="货物单价（元/吨）" required>
          <input
            type="number"
            class="field-input"
            :data-error="!!errors.cargoPrice"
            :value="order.cargoPrice || ''"
            @input="setField('cargoPrice', Number(($event.target as HTMLInputElement).value))"
            placeholder="如：800"
          />
        </Field>
        <Field label="货物品质" required>
          <input
            class="field-input"
            :data-error="!!errors.cargoQuality"
            :value="order.cargoQuality"
            @input="setField('cargoQuality', ($event.target as HTMLInputElement).value)"
            placeholder="如：品位 62%、粒度 10-40mm"
          />
        </Field>
        <Field label="来源矿山">
          <select
            class="field-input"
            :value="mineSelectValue"
            @change="setMineSelect(($event.target as HTMLSelectElement).value)"
          >
            <option value="">请选择</option>
            <option v-for="m in MINE_OPTIONS" :key="m" :value="m">{{ m }}</option>
          </select>
        </Field>
        <Field v-if="isMineOther" label="来源矿山（自定义）">
          <input
            class="field-input"
            :value="order.mine"
            @input="setMineCustom(($event.target as HTMLInputElement).value)"
            placeholder="如：力拓"
            maxlength="50"
          />
        </Field>
      </div>
    </FieldGroup>

    <FieldGroup icon="ship" title="到港信息" desc="船舶与到港信息（选填）" collapsible v-model:isOpen="portOpen" :summary="portSummary">
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="运输船舶">
          <input
            class="field-input"
            :value="order.vessel"
            @input="setField('vessel', ($event.target as HTMLInputElement).value)"
            placeholder="如：远盛海 008"
          />
        </Field>
        <Field label="装船开始时间">
          <input
            type="datetime-local"
            class="field-input"
            :value="toLocalInput(order.loadingStart)"
            @input="
              setField(
                'loadingStart',
                ($event.target as HTMLInputElement).value
                  ? new Date(($event.target as HTMLInputElement).value).toISOString()
                  : '',
              )
            "
          />
        </Field>
        <Field label="起运时间">
          <input
            type="datetime-local"
            class="field-input"
            :value="toLocalInput(order.departure)"
            @input="
              setField(
                'departure',
                ($event.target as HTMLInputElement).value
                  ? new Date(($event.target as HTMLInputElement).value).toISOString()
                  : '',
              )
            "
          />
        </Field>
        <Field label="预计到达港口">
          <input
            class="field-input"
            :value="order.destPort"
            @input="setField('destPort', ($event.target as HTMLInputElement).value)"
            placeholder="如：黄骅港"
          />
        </Field>
        <Field label="上传时水尺数（米）">
          <input
            type="number"
            step="0.01"
            class="field-input"
            :value="order.draftMark || ''"
            @input="setField('draftMark', Number(($event.target as HTMLInputElement).value))"
            placeholder="如：14.5"
          />
        </Field>
      </div>
    </FieldGroup>

    <FieldGroup icon="building" title="终端客户" desc="选填，货物最终销售对象，支持逐条添加多个客户（每个含独立销售数量）" collapsible v-model:isOpen="customersOpen" :summary="customersSummary">
      <div class="space-y-3">
        <div
          v-for="(c, idx) in order.customers"
          :key="c.id"
          class="rounded-apple border border-apple-border/60 p-3 bg-gray-50/30"
        >
          <div class="flex items-center gap-2 mb-2">
            <span
              class="flex items-center justify-center w-6 h-6 rounded-full bg-apple-blue/10 text-apple-blue text-[11px] font-semibold shrink-0"
            >
              {{ idx + 1 }}
            </span>
            <span class="text-xs font-semibold text-apple-text">客户 {{ idx + 1 }}</span>
            <button
              @click="removeCustomer(c.id)"
              class="ml-auto text-apple-subtext hover:text-apple-red transition-colors"
              title="删除该客户"
            >
              <Icon name="trash" :size="14" />
            </button>
          </div>
          <div class="grid sm:grid-cols-3 gap-3">
            <Field label="终端钢厂" class="sm:col-span-2">
              <input
                class="field-input"
                :value="c.name"
                @input="setCustomerName(c.id, ($event.target as HTMLInputElement).value)"
                placeholder="如：河钢集团"
              />
            </Field>
            <Field label="销售数量（吨）">
              <input
                type="number"
                class="field-input"
                :value="c.qty || ''"
                @input="setCustomerQty(c.id, Number(($event.target as HTMLInputElement).value))"
                placeholder="如：35000"
              />
            </Field>
          </div>
        </div>

        <button @click="addCustomer" class="btn-ghost text-xs">
          <Icon name="plus" :size="14" /> 添加客户
        </button>
      </div>
      <div v-if="summary.total > 0 && saleTotal > 0" class="mt-4 flex items-center gap-3 text-xs">
        <div class="flex items-center gap-1.5 text-apple-subtext">
          <Icon name="info" :size="13" />
          货物总量 {{ fmtNum(summary.total, '吨') }} · 销售量合计
          {{ fmtNum(summary.sale, '吨') }}
          <span
            v-if="summary.diff !== 0"
            class="ml-1 px-1.5 py-0.5 rounded"
            :class="
              Math.abs(summary.diff) < summary.total * 0.01
                ? 'bg-apple-green/10 text-apple-green'
                : 'bg-apple-orange/10 text-apple-orange'
            "
          >
            差额 {{ fmtNum(Math.abs(summary.diff), '吨') }}
          </span>
        </div>
      </div>
    </FieldGroup>

    <!-- 摘要卡片 -->
    <div
      v-if="isEdit && order.trader"
      class="card p-5 bg-gradient-to-br from-apple-blue/[0.03] to-transparent animate-scale-in"
    >
      <div class="flex items-center gap-2 mb-3">
        <Icon name="clipboard-list" :size="16" class="text-apple-blue" />
        <span class="section-title">订单摘要</span>
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
        <div>
          <div class="text-[11px] text-apple-subtext">订单编号</div>
          <div class="text-apple-text font-medium mt-0.5 font-mono truncate">{{ order.id }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">客户</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">{{ order.trader }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">货物</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">
            {{ order.cargoName }} · {{ fmtNum(order.cargoTotal, '吨') }}
          </div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">终端钢厂</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">{{ customersText || '—' }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">到港</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">{{ order.destPort }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">船舶</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">{{ order.vessel }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">起运时间</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">{{ fmtDate(order.departure) }}</div>
        </div>
        <div>
          <div class="text-[11px] text-apple-subtext">销售数量</div>
          <div class="text-apple-text font-medium mt-0.5 truncate">
            {{ fmtNum(saleTotal, '吨') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="sticky bottom-4 z-30">
      <div
        class="card px-4 py-3 flex items-center justify-between gap-3 backdrop-blur-xl bg-white/85"
      >
        <RouterLink to="/" class="btn-ghost">
          <Icon name="arrow-left" :size="15" /> 返回首页
        </RouterLink>
        <div class="flex items-center gap-2">
          <button @click="saveDraft" class="btn-secondary">
            <Icon name="save" :size="15" /> 保存草稿
          </button>
          <button @click="generate" class="btn-primary">
            {{ isEdit ? '保存并下一步' : '生成订单' }}
            <Icon name="arrow-right" :size="15" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
