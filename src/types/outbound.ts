/** 出库状态 */
export type OutboundStatus = 'pending' | 'approved' | 'weighing' | 'loading' | 'completed' | 'cancelled' | 'rejected'

/** 出库申请/出库单 */
export interface Outbound {
  id: string // 出库编号（主键）
  outboundNo: string // 出库单号
  orderId: string // 关联订单ID
  batchId?: string // 关联库存批次ID
  // 提货信息
  picker: string // 提货主体（贸易商/客户/其他）
  pickerContact?: string // 提货人联系人
  pickerPhone?: string // 联系电话
  // 货物信息
  cargoName: string // 货物名称
  cargoType?: string // 品类
  plannedQty: number // 计划出库数量（吨）
  actualQty?: number // 实际出库数量（吨）
  difference?: number // 差异数量
  // 车辆信息
  vehicleNo?: string // 车牌号
  driverName?: string // 司机姓名
  driverPhone?: string // 司机电话
  // 仓储信息
  warehouse: string // 仓库/堆场
  location?: string // 库位/堆位
  // 付款条件
  paymentRequired?: boolean // 是否需要付款
  paymentVerified?: boolean // 付款是否已核实
  paymentAmount?: number // 应付金额
  // 时间
  requestedDate?: string // 申请日期
  approvedDate?: string // 审批日期
  weighTime?: string // 过磅时间
  loadTime?: string // 装车时间
  completedTime?: string // 出库完成时间
  // 状态
  status: OutboundStatus // 出库状态
  applicant?: string // 申请人
  approver?: string // 审批人
  weigher?: string // 过磅员
  loader?: string // 装车员
  remark?: string // 备注
  attachments?: string[] // 凭证附件
  createdAt: string
  updatedAt: string
}

export const OUTBOUND_STATUS_META: Record<OutboundStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待审批', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  approved: { label: '已审批', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  weighing: { label: '过磅中', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  loading: { label: '装车中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  completed: { label: '已出库', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  cancelled: { label: '已取消', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  rejected: { label: '已驳回', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}

/** 出库状态流转 */
export const OUTBOUND_STATUS_FLOW: Record<OutboundStatus, OutboundStatus[]> = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['weighing', 'cancelled'],
  weighing: ['loading', 'cancelled'],
  loading: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
}
