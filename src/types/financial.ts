/** 凭证（财务凭证 / 发运凭证统一结构） */
export interface Voucher {
  id: string
  name: string // 凭证名称
  type: string // 凭证类型：发票/收据/请车计划/运单/其他
  fileName?: string // 文件名（仅记录，不实际存储文件内容）
  fileSize?: number // 文件大小（字节）
  uploadedBy: string // 上传人
  uploadedAt: string // 上传时间
  note?: string // 备注
}

/** 收款状态 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
/** 发票/收据状态 */
export type InvoiceStatus = 'none' | 'issued' | 'delivered'

/** 财务信息（每订单 1 条） */
export interface FinancialInfo {
  orderId: string
  paymentStatus: PaymentStatus // 收款状态
  totalAmount: number // 总金额（元）
  receivedAmount: number // 已收金额（元）
  invoiceStatus: InvoiceStatus // 发票/收据状态
  vouchers: Voucher[] // 相关财务凭证
  remark?: string
  updatedAt: string
}

/** 收款状态元数据 */
export const PAYMENT_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  unpaid: { label: '未收款', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
  partial: { label: '部分收款', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  paid: { label: '已全额收款', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}

/** 发票状态元数据 */
export const INVOICE_META: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  none: { label: '未开具', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  issued: { label: '已开具', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  delivered: { label: '已交付', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}
