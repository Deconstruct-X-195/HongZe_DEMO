/** 终端客户（每个客户独立记录，含各自销售数量） */
export interface TerminalCustomer {
  id: string
  name: string // 终端钢厂名称
  qty: number // 销售数量（吨）
}

/** 订单状态 */
export type OrderStatus =
  | 'draft' // 录入中（仅订单）
  | 'port' // 待港口
  | 'capacity' // 待运力
  | 'plan' // 待方案
  | 'pending_confirm' // 待确认（方案已生成，待财务确认收款）
  | 'confirmed' // 订单已确认（财务已确认收款）
  | 'shipping' // 发运中
  | 'shipped' // 发运完成
  | 'completed' // 已完成
  | undefined

/** 旧状态 'done' 迁移到新状态 'pending_confirm' */
export function migrateStatus(s: OrderStatus | string | undefined): OrderStatus {
  if (s === 'done' as any) return 'pending_confirm'
  return s as OrderStatus
}

/** 订单信息 */
export interface Order {
  id: string // 订单编号（主键）
  // 客户信息
  trader: string // 上游贸易商（客户）
  traderContact?: string // 联系人
  traderContactInfo?: string // 联系方式
  // 货物信息
  cargoName: string // 货物名称
  cargoTotal: number // 货物总量（吨）
  cargoPrice: number // 货物单价
  cargoQuality: string // 货物品质
  mine: string // 来源矿山
  // 运输信息
  vessel: string // 运输船舶
  loadingStart: string // 装船开始时间
  departure: string // 起运时间
  destPort: string // 预计到达港口
  draftMark: number // 上传时水尺数
  // 终端客户（支持多个，每个含独立销售数量）
  customers: TerminalCustomer[]
  // 元数据
  createdAt: string
  updatedAt: string
  status: OrderStatus
}

export const STATUS_META: Record<
  NonNullable<OrderStatus>,
  { label: string; color: string; bg: string; phase: 'create' | 'business' | 'final' }
> = {
  draft: { label: '录入中', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)', phase: 'create' },
  port: { label: '待港口', color: '#0071e3', bg: 'rgba(0,113,227,0.12)', phase: 'create' },
  capacity: { label: '待运力', color: '#ff9500', bg: 'rgba(255,149,0,0.12)', phase: 'create' },
  plan: { label: '待方案', color: '#af52de', bg: 'rgba(175,82,222,0.12)', phase: 'create' },
  pending_confirm: { label: '待确认', color: '#ff9500', bg: 'rgba(255,149,0,0.12)', phase: 'business' },
  confirmed: { label: '订单已确认', color: '#0071e3', bg: 'rgba(0,113,227,0.12)', phase: 'business' },
  shipping: { label: '发运中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)', phase: 'business' },
  shipped: { label: '发运完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)', phase: 'business' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)', phase: 'final' },
}

/**
 * 订单状态流转规则：键 = 当前状态，值 = 可流转到的下一状态集合。
 * - 创建阶段：draft → port → capacity → plan → pending_confirm
 * - 业务阶段：pending_confirm → confirmed（财务确认收款）→ shipping（运输上传凭证）→ shipped → completed
 */
export const STATUS_FLOW: Record<NonNullable<OrderStatus>, NonNullable<OrderStatus>[]> = {
  draft: ['port'],
  port: ['capacity'],
  capacity: ['plan'],
  plan: ['pending_confirm'],
  pending_confirm: ['confirmed'],
  confirmed: ['shipping'],
  shipping: ['shipped'],
  shipped: ['completed'],
  completed: [],
}

/** 终端客户名称展示（以"、"连接） */
export function customersDisplay(customers: TerminalCustomer[] | undefined): string {
  if (!customers || customers.length === 0) return ''
  return customers
    .map((c) => c.name)
    .filter(Boolean)
    .join('、')
}

/** 终端客户销售数量合计 */
export function customersTotalQty(customers: TerminalCustomer[] | undefined): number {
  if (!customers || customers.length === 0) return 0
  return customers.reduce((s, c) => s + (c.qty || 0), 0)
}
