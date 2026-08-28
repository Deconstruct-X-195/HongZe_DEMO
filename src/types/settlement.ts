/** 结算状态 */
export type SettlementStatus = 'pending' | 'calculating' | 'confirmed' | 'invoiced' | 'paid' | 'closed'

/** 结算费用项 */
export interface SettlementItem {
  id: string
  type: string // 费用类型（运费/装卸费/仓储费/保险费/税费/其他）
  name: string // 费用项名称
  unit: string // 单位
  unitPrice: number // 单价
  quantity: number // 数量
  amount: number // 金额
  taxRate?: number // 税率
  taxAmount?: number // 税额
  remark?: string
}

/** 结算单/发票 */
export interface Settlement {
  id: string // 结算编号（主键）
  settlementNo: string // 结算单号
  orderId: string // 关联订单ID
  contractId?: string // 关联合同ID
  // 结算双方
  payer: string // 付款方
  payee: string // 收款方
  // 费用明细
  items: SettlementItem[] // 费用明细项
  totalAmount: number // 总金额（不含税）
  totalTax?: number // 总税额
  totalWithTax?: number // 价税合计
  // 发票信息
  invoiceNo?: string // 发票号
  invoiceDate?: string // 开票日期
  invoiceType?: string // 发票类型（增值税专用/普通）
  invoiceAmount?: number // 开票金额
  // 付款信息
  paidAmount?: number // 已付金额
  remainingAmount?: number // 未付金额
  paidDate?: string // 付款日期
  // 数量核对
  plannedQty?: number // 计划数量
  actualQty?: number // 实际数量
  differenceQty?: number // 差异数量
  // 状态
  status: SettlementStatus // 结算状态
  calculatedBy?: string // 核算人
  confirmedBy?: string // 确认人
  invoicedBy?: string // 开票人
  remark?: string // 备注
  attachments?: string[] // 凭证附件
  createdAt: string
  updatedAt: string
}

export const SETTLEMENT_STATUS_META: Record<SettlementStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待结算', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  calculating: { label: '核算中', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  confirmed: { label: '已确认', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  invoiced: { label: '已开票', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  paid: { label: '已付款', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  closed: { label: '已关闭', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
}

/** 结算状态流转 */
export const SETTLEMENT_STATUS_FLOW: Record<SettlementStatus, SettlementStatus[]> = {
  pending: ['calculating'],
  calculating: ['confirmed', 'pending'],
  confirmed: ['invoiced'],
  invoiced: ['paid', 'closed'],
  paid: ['closed'],
  closed: [],
}
