/** 派单类型 */
export type DispatchType = 'rail' | 'road' | 'rail_road'

/** 派单状态 */
export type DispatchStatus = 'draft' | 'submitted' | 'approved' | 'dispatched' | 'in_transit' | 'arrived' | 'completed' | 'cancelled'

/** 派单/请车单 */
export interface Dispatch {
  id: string // 派单编号（主键）
  dispatchNo: string // 派单号/请车号
  orderId: string // 关联订单ID
  type: DispatchType // 派单类型（铁路/公路/公铁联运）
  // 货物信息
  cargoName: string // 货物名称
  cargoQty: number // 货物数量（吨）
  // 运输信息
  origin: string // 起运地/发站
  destination: string // 目的地/到站
  transitPoints?: string[] // 中转点
  plannedDate?: string // 计划发运日期
  // 铁路信息（95306）
  railShipper?: string // 发货人
  railConsignee?: string // 收货人
  railTrainNo?: string // 车次
  railWagonCount?: number // 车数
  // 公路信息（万和）
  roadVehicleNo?: string // 车牌号
  roadDriverName?: string // 司机姓名
  roadDriverPhone?: string // 司机电话
  roadFleet?: string // 车队/承运方
  // 状态
  status: DispatchStatus // 派单状态
  dispatcher?: string // 调度员
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const DISPATCH_STATUS_META: Record<DispatchStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  submitted: { label: '已提交', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  approved: { label: '已审批', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  dispatched: { label: '已派单', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  in_transit: { label: '运输中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  arrived: { label: '已到达', color: '#5ac8fa', bg: 'rgba(90,200,250,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  cancelled: { label: '已取消', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}

export const DISPATCH_TYPE_META: Record<DispatchType, { label: string; color: string }> = {
  rail: { label: '铁路请车', color: '#0071e3' },
  road: { label: '公路派车', color: '#ff9500' },
  rail_road: { label: '公铁联运', color: '#af52de' },
}

/** 派单状态流转 */
export const DISPATCH_STATUS_FLOW: Record<DispatchStatus, DispatchStatus[]> = {
  draft: ['submitted', 'cancelled'],
  submitted: ['approved', 'cancelled'],
  approved: ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'cancelled'],
  in_transit: ['arrived'],
  arrived: ['completed'],
  completed: [],
  cancelled: [],
}
