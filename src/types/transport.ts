/** 运输节点类型 */
export type TransportNodeType = 'loading' | 'departure' | 'transit' | 'arrival' | 'unloading' | 'exception'

/** 运输节点记录 */
export interface TransportNode {
  id: string
  type: TransportNodeType // 节点类型
  location: string // 地点
  timestamp: string // 时间
  description?: string // 描述
  operator?: string // 操作人
  remark?: string // 备注
}

/** 运输执行记录 */
export interface TransportRecord {
  id: string // 运输记录编号（主键）
  dispatchId: string // 关联派单ID
  orderId: string // 关联订单ID
  // 运输信息
  cargoName: string // 货物名称
  cargoQty: number // 货物数量（吨）
  origin: string // 起运地
  destination: string // 目的地
  // 车辆/车次信息
  vehicleNo?: string // 车牌号/车次
  driverName?: string // 司机姓名
  driverPhone?: string // 司机电话
  carrier?: string // 承运方
  // 时间节点
  loadingTime?: string // 装车时间
  departureTime?: string // 发车时间
  arrivalTime?: string // 到达时间
  unloadingTime?: string // 卸车时间
  // 节点记录
  nodes: TransportNode[] // 运输节点记录
  // 异常
  exceptions?: TransportException[] // 异常记录
  // 损耗
  lossQty?: number // 损耗数量（吨）
  lossRate?: number // 损耗率
  // 状态
  status: 'pending' | 'loading' | 'in_transit' | 'arrived' | 'unloading' | 'completed' | 'exception'
  tracker?: string // 跟单员
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

/** 运输异常 */
export interface TransportException {
  id: string
  type: string // 异常类型（延误/事故/货损/其他）
  description: string // 异常描述
  location?: string // 发生地点
  timestamp: string // 发生时间
  status: 'reported' | 'handling' | 'resolved' // 异常状态
  resolvedAt?: string // 解决时间
  remark?: string
}

export const TRANSPORT_STATUS_META: Record<TransportRecord['status'], { label: string; color: string; bg: string }> = {
  pending: { label: '待发运', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  loading: { label: '装车中', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  in_transit: { label: '运输中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  arrived: { label: '已到达', color: '#5ac8fa', bg: 'rgba(90,200,250,0.12)' },
  unloading: { label: '卸车中', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  exception: { label: '异常', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}

export const TRANSPORT_NODE_TYPE_META: Record<TransportNodeType, { label: string; color: string }> = {
  loading: { label: '装车', color: '#ff9500' },
  departure: { label: '发车', color: '#0071e3' },
  transit: { label: '中转', color: '#af52de' },
  arrival: { label: '到达', color: '#5ac8fa' },
  unloading: { label: '卸车', color: '#34c759' },
  exception: { label: '异常', color: '#ff3b30' },
}
