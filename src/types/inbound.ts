/** 入库状态 */
export type InboundStatus = 'pending' | 'arrived' | 'inspecting' | 'weighing' | 'unloading' | 'completed' | 'cancelled'

/** 入库单 */
export interface Inbound {
  id: string // 入库编号（主键）
  inboundNo: string // 入库单号
  orderId: string // 关联订单ID
  dispatchId?: string // 关联派单ID
  transportId?: string // 关联运输记录ID
  // 货物信息
  cargoName: string // 货物名称
  cargoType?: string // 品类
  cargoQuality?: string // 品质
  plannedQty: number // 计划入库数量（吨）
  // 车辆/运输信息
  vehicleNo?: string // 车牌号/车次
  driverName?: string // 司机姓名
  driverPhone?: string // 司机电话
  carrier?: string // 承运方
  // 仓储信息
  warehouse: string // 仓库/堆场名称
  location?: string // 库位/堆位
  // 计量信息
  grossWeight?: number // 毛重（吨）
  tareWeight?: number // 皮重（吨）
  netWeight?: number // 净重（吨）= 毛重-皮重
  actualQty?: number // 实际入库数量（吨）
  difference?: number // 差异数量
  // 时间
  arrivedTime?: string // 到仓时间
  inspectTime?: string // 验收时间
  weighTime?: string // 过磅时间
  unloadTime?: string // 卸车时间
  completedTime?: string // 入库完成时间
  // 状态
  status: InboundStatus // 入库状态
  receiver?: string // 接货人/仓储员
  inspector?: string // 验收人
  weigher?: string // 过磅员
  remark?: string // 备注
  attachments?: string[] // 凭证附件
  createdAt: string
  updatedAt: string
}

export const INBOUND_STATUS_META: Record<InboundStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待入库', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  arrived: { label: '已到仓', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  inspecting: { label: '验收中', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  weighing: { label: '过磅中', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  unloading: { label: '卸车中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  completed: { label: '已入库', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  cancelled: { label: '已取消', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}
