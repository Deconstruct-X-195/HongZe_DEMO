import type { ChannelType } from './capacity'
import type { Voucher } from './financial'

/** 发运状态（单条运输通道） */
export type ShippingState = 'not_started' | 'shipping' | 'completed'

/** 运输通道发运信息（与 Capacity 1:1 关联） */
export interface ChannelShipping {
  capacityId: string // 关联运力通道 id
  orderId: string
  channelType: ChannelType
  plannedQty: number // 通道总货物量（吨）
  shippedQty: number // 已发运量（吨）
  storedQty: number // 仓储堆存量（吨，已到站/堆场未提走）
  pickedUpQty: number // 客户已提货出关量（吨）
  state: ShippingState // 发运状态
  planDate: string // 计划发运时间
  actualDate: string // 实际发运时间
  vouchers: Voucher[] // 发运凭证（请车计划等）
  remark?: string
  updatedAt: string
}

/** 货物动态节点状态 */
export type MilestoneState = 'pending' | 'in_progress' | 'completed' | 'exception'

/** 货物动态节点（运输环节时间轴） */
export interface CargoMilestone {
  id: string
  orderId: string
  capacityId?: string // 关联运输通道（可选）
  channelType?: ChannelType
  stage: string // 环节名称，如：装船、到港、铁路发运、到站交付
  state: MilestoneState
  plannedTime: string // 计划时间
  actualTime: string // 实际时间
  hasException: boolean // 是否异常
  exceptionNote?: string // 异常处理记录
  remark?: string
  updatedAt: string
}

/** 发运状态元数据 */
export const SHIPPING_META: Record<ShippingState, { label: string; color: string; bg: string }> = {
  not_started: { label: '未开始', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  shipping: { label: '发运中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}

/** 货物动态节点状态元数据 */
export const MILESTONE_META: Record<MilestoneState, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  in_progress: { label: '进行中', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  exception: { label: '异常', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}


