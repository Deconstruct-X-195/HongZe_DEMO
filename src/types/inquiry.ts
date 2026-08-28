/** 询价状态 */
export type InquiryStatus = 'draft' | 'submitted' | 'received' | 'in_plan' | 'quoted' | 'closed' | 'cancelled'

/** 运输方式 */
export type TransportMode = 'rail' | 'road' | 'rail_road' | 'water' | 'other'

/** 询价需求 */
export interface Inquiry {
  id: string // 询价编号（主键）
  inquiryNo: string // 询价单号
  customerId: string // 客户ID
  customerName: string // 客户名称（冗余，方便展示）
  // 货物信息
  cargoName: string // 货物名称
  cargoType?: string // 品类/种类
  cargoQuality: string // 品质
  cargoQty: number // 数量（吨）
  cargoUnit?: string // 单位（默认吨）
  mine?: string // 来源矿山
  // 运输需求
  transportMode: TransportMode // 运输方式
  origin: string // 起点/发货地
  destination: string // 终点/目的地
  transitPoints?: string[] // 中转点
  expectedDate?: string // 期望运输时间
  deliveryLocation?: string // 交割地点
  tradeLocation?: string // 交易地点
  isSpot?: boolean // 现货/期货（true=现货）
  // 业务信息
  salesperson?: string // 业务员
  status: InquiryStatus // 询价状态
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const INQUIRY_STATUS_META: Record<InquiryStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  submitted: { label: '已提交', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  received: { label: '已接收', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  in_plan: { label: '方案中', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  quoted: { label: '已报价', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  closed: { label: '已成交', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  cancelled: { label: '已取消', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}

export const TRANSPORT_MODE_META: Record<TransportMode, { label: string; color: string }> = {
  rail: { label: '铁路', color: '#0071e3' },
  road: { label: '公路', color: '#ff9500' },
  rail_road: { label: '公铁联运', color: '#af52de' },
  water: { label: '水运', color: '#5ac8fa' },
  other: { label: '其他', color: '#8e8e93' },
}

/** 询价状态流转 */
export const INQUIRY_STATUS_FLOW: Record<InquiryStatus, InquiryStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['received', 'cancelled'],
  received: ['in_plan', 'cancelled'],
  in_plan: ['quoted', 'cancelled'],
  quoted: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
}
