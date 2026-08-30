/** 接货状态 */
export type ReceiptStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

/** 接货交接单 */
export interface Receipt {
  id: string // 接货编号（主键）
  receiptNo: string // 接货单号
  orderId: string // 关联订单ID
  customerId?: string // 客户ID
  customerName?: string // 客户名称
  // 接货信息
  cargoName: string // 货物名称
  cargoType?: string // 品类
  cargoQuality?: string // 品质
  plannedQty: number // 计划接货数量（吨）
  actualQty?: number // 实际接货数量（吨）
  difference?: number // 差异数量
  // 接货地点
  location: string // 接货地点（港口/货源地）
  warehouse?: string // 仓库/堆场
  // 时间
  plannedDate?: string // 计划接货日期
  actualDate?: string // 实际接货日期
  // 交接双方
  consignor: string // 交货方（货主/上游）
  consignorContact?: string // 交货方联系人
  receiver: string // 接货人
  receiverContact?: string // 接货人联系方式
  // 车辆/运输信息
  vehicleNo?: string // 车牌号/车次
  driverName?: string // 司机姓名
  driverPhone?: string // 司机电话
  // 状态
  status: ReceiptStatus // 接货状态
  remark?: string // 备注
  attachments?: string[] // 凭证附件
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export const RECEIPT_STATUS_META: Record<ReceiptStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '待接货', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  in_progress: { label: '接货中', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  cancelled: { label: '已取消', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}
