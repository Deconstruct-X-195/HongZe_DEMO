import type { ChannelType } from './capacity'

/** 运输方案批次 */
export interface PlanBatch {
  batchNo: number // 批次
  qty: number // 运量（吨）
  channelType: ChannelType // 通道
  leadTime: number // 时效（天）
  price: number // 运价（元/吨）
  remark?: string
}

/** 运输方案 */
export interface TransportPlan {
  orderId: string
  batches: PlanBatch[]
  updatedAt: string
}
