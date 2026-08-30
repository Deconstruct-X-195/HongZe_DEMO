/** 付款记录状态（注意：与 financial.ts 中的 PaymentStatus 区分，此处为付款单状态） */
export type PaymentRecordStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded'

/** 付款类型 */
export type PaymentType = 'prepay' | 'progress' | 'final' | 'deposit' | 'other'

/** 付款方式 */
export type PaymentMethod = 'bank_transfer' | 'cash' | 'check' | 'other'

/** 付款凭证 */
export interface PaymentVoucher {
  id: string
  name: string // 凭证名称
  url: string // 凭证地址
  uploadedAt: string
}

/** 付款记录 */
export interface Payment {
  id: string // 付款编号（主键）
  paymentNo: string // 付款单号
  orderId?: string // 关联订单ID
  contractId?: string // 关联合同ID
  customerId: string // 客户ID（付款方）
  customerName: string // 客户名称
  // 付款信息
  type: PaymentType // 付款类型（预付/进度/尾款/押金/其他）
  method: PaymentMethod // 付款方式
  amount: number // 付款金额
  currency?: string // 币种（默认CNY）
  paidAmount?: number // 已付金额
  remainingAmount?: number // 剩余金额
  dueDate?: string // 应付款日期
  paidDate?: string // 实际付款日期
  // 银行信息
  payerAccount?: string // 付款方账户
  payerBank?: string // 付款方银行
  payeeAccount?: string // 收款方账户
  payeeBank?: string // 收款方银行
  // 状态
  status: PaymentRecordStatus // 付款记录状态
  vouchers: PaymentVoucher[] // 付款凭证
  confirmedBy?: string // 确认人
  confirmedAt?: string // 确认时间
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const PAYMENT_RECORD_STATUS_META: Record<PaymentRecordStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待付款', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  partial: { label: '部分付款', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  paid: { label: '已付款', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  overdue: { label: '已逾期', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
  refunded: { label: '已退款', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
}

export const PAYMENT_TYPE_META: Record<PaymentType, { label: string; color: string }> = {
  prepay: { label: '预付款', color: '#ff9500' },
  progress: { label: '进度款', color: '#4176e6' },
  final: { label: '尾款', color: '#34c759' },
  deposit: { label: '押金', color: '#af52de' },
  other: { label: '其他', color: '#8e8e93' },
}

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string }> = {
  bank_transfer: { label: '银行转账' },
  cash: { label: '现金' },
  check: { label: '支票' },
  other: { label: '其他' },
}
