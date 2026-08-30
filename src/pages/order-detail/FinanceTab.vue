<template>
  <div class="space-y-3">
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

    <!-- 收款进度 -->
    <div class="card p-5 space-y-4">
      <h3 class="text-sm font-semibold text-apple-text">财务信息</h3>
      <div class="h-2.5 rounded-full bg-apple-fill-strong/60 overflow-hidden">
        <div class="h-full bg-apple-green transition-all duration-500"
          :style="{ width: (financial.totalAmount > 0 ? Math.min(100, Math.round(financial.receivedAmount / financial.totalAmount * 100)) : 0) + '%' }" />
      </div>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
        <InfoRow label="总金额" :value="fmtMoney(financial.totalAmount)" strong />
        <InfoRow label="已收金额" :value="fmtMoney(financial.receivedAmount)" />
        <InfoRow label="收款状态" :value="PAYMENT_META[financial.paymentStatus].label" />
        <InfoRow label="发票状态" :value="INVOICE_META[financial.invoiceStatus].label" />
        <InfoRow label="最后更新" :value="fmtDate(financial.updatedAt)" />
        <InfoRow v-if="financial.remark" label="备注" :value="financial.remark" />
      </div>
    </div>

    <!-- 财务凭证（档案视图） -->
    <div class="card p-5 space-y-3">
      <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2"><Icon name="paperclip" :size="15" class="text-apple-subtext" /> 财务凭证</h3>
      <div v-if="financial.vouchers.length > 0" class="space-y-2">
        <div v-for="v in financial.vouchers" :key="v.id" class="flex items-center gap-3 p-2.5 rounded-apple bg-apple-fill/60 border border-apple-border/40">
          <Icon name="file-text" :size="15" class="text-apple-blue shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm text-apple-text font-medium truncate">{{ v.name }}</div>
            <div class="text-[11px] text-apple-subtext">{{ v.type }} · {{ v.uploadedBy }} · {{ fmtDate(v.uploadedAt) }}</div>
          </div>
        </div>
      </div>
      <p v-else class="text-xs text-apple-subtext py-2">暂无凭证</p>
    </div>

    <!-- 待确认收款：财务岗可跳转工作台操作，其他岗位仅提示 -->
    <div v-if="canConfirmPayment" class="card p-5 border-2 border-apple-orange/30 bg-gradient-to-br from-apple-orange/[0.06] to-transparent">
      <div class="flex items-start justify-between gap-3 flex-wrap">
        <div class="flex items-start gap-3">
          <div class="flex items-center justify-center w-10 h-10 rounded-apple bg-apple-orange/15 text-apple-orange shrink-0">
            <Icon name="dollar" :size="20" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-apple-text flex items-center gap-2">
              待财务确认收款
              <span class="text-[11px] px-2 py-0.5 rounded-full bg-apple-orange/15 text-apple-orange font-medium">待办</span>
            </h3>
            <p class="text-xs text-apple-subtext mt-1 leading-relaxed">
              确认收款后订单状态将从「待确认」流转至「订单已确认」，解锁发运操作。
            </p>
          </div>
        </div>
        <RouterLink v-if="canOperate" to="/workspace/finance" class="btn-primary text-xs shrink-0 bg-apple-orange hover:bg-apple-orange/90">
          前往财务工作台
          <Icon name="arrow-right" :size="13" />
        </RouterLink>
      </div>
    </div>
    <div v-else-if="isAfterConfirm" class="card p-4 border border-apple-green/20 bg-apple-green/[0.03]">
      <p class="text-xs text-apple-green flex items-center gap-1.5">
        <Icon name="check-circle" :size="14" />
        财务已确认收款，订单已进入发运环节
        <span class="text-apple-subtext ml-2">· 确认时间 {{ fmtDate(financial.updatedAt) }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import Icon from '@/components/Icon.vue'
import InfoRow from '@/components/InfoRow.vue'
import { useAuthStore } from '@/stores/auth'
import { canAccessPath } from '@/types/auth'
import { fmtDate, fmtMoney } from '@/lib/format'
import { PAYMENT_META, INVOICE_META } from '@/types'
import type { FinancialInfo, OrderStatus } from '@/types'

const props = defineProps<{
  financial: FinancialInfo
  currentStatus: NonNullable<OrderStatus>
}>()

const auth = useAuthStore()

const canConfirmPayment = computed(() => props.currentStatus === 'pending_confirm')
const isAfterConfirm = computed(() =>
  props.currentStatus === 'confirmed' || props.currentStatus === 'shipping' || props.currentStatus === 'shipped' || props.currentStatus === 'completed',
)
/** 仅财务岗/管理员可进入财务工作台操作 */
const canOperate = computed(() => canAccessPath(auth.role, '/workspace/finance'))
</script>
