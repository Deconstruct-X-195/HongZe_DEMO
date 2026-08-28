/** 报价/撮合状态 */
export type QuoteStatus = 'draft' | 'negotiating' | 'accepted' | 'rejected' | 'expired'

/** 报价项 */
export interface QuoteItem {
  id: string
  channel: string // 通道/线路
  transportMode: string // 运输方式
  transitDays: number // 运输时效（天）
  unitPrice: number // 单价（元/吨）
  totalPrice: number // 总价
  capacity: number // 日运量能力（吨/天）
  remark?: string // 备注
}

/** 报价/撮合记录 */
export interface Quote {
  id: string // 报价编号（主键）
  quoteNo: string // 报价单号
  inquiryId: string // 关联询价ID
  orderId?: string // 关联订单ID（成交后生成）
  customerId: string // 客户ID
  customerName: string // 客户名称
  // 报价信息
  items: QuoteItem[] // 报价项（多通道对比）
  costTotal?: number // 成本合计
  profitTotal?: number // 毛利合计
  validUntil?: string // 报价有效期
  // 撮合信息
  negotiationHistory?: QuoteNegotiation[] // 协商历史
  finalPrice?: number // 最终成交价
  status: QuoteStatus // 报价状态
  salesperson?: string // 业务员
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

/** 协商记录 */
export interface QuoteNegotiation {
  id: string
  round: number // 轮次
  proposer: 'customer' | 'company' // 提出方
  price: number // 报价
  message?: string // 说明
  createdAt: string
}

export const QUOTE_STATUS_META: Record<QuoteStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  negotiating: { label: '协商中', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  accepted: { label: '已接受', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  rejected: { label: '已拒绝', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
  expired: { label: '已过期', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
}
