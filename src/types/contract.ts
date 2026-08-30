/** 合同状态 */
export type ContractStatus = 'draft' | 'pending_sign' | 'signed' | 'effective' | 'terminated' | 'expired'

/** 合同类型 */
export type ContractType = 'transport' | 'service' | 'warehouse' | 'other'

/** 合同附件 */
export interface ContractAttachment {
  id: string
  name: string // 文件名
  url: string // 文件地址
  uploadedAt: string
}

/** 合同/协议 */
export interface Contract {
  id: string // 合同编号（主键）
  contractNo: string // 合同号
  type: ContractType // 合同类型
  orderId?: string // 关联订单ID
  quoteId?: string // 关联报价ID
  customerId: string // 客户ID（甲方）
  customerName: string // 客户名称
  partyB: string // 乙方（我方/承运方）
  // 合同内容
  title: string // 合同标题
  amount: number // 合同金额
  currency?: string // 币种（默认CNY）
  signDate?: string // 签署日期
  effectiveDate?: string // 生效日期
  expireDate?: string // 到期日期
  // 货物信息
  cargoName?: string // 货物名称
  cargoQty?: number // 数量（吨）
  // 运输信息
  origin?: string // 起点
  destination?: string // 终点
  transportMode?: string // 运输方式
  // 状态
  status: ContractStatus // 合同状态
  attachments: ContractAttachment[] // 合同附件
  remark?: string // 备注
  createdBy?: string // 创建人
  createdAt: string
  updatedAt: string
}

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  pending_sign: { label: '待签署', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  signed: { label: '已签署', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  effective: { label: '已生效', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  terminated: { label: '已终止', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
  expired: { label: '已过期', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
}

export const CONTRACT_TYPE_META: Record<ContractType, { label: string; color: string }> = {
  transport: { label: '运输合同', color: '#4176e6' },
  service: { label: '服务合同', color: '#ff9500' },
  warehouse: { label: '仓储合同', color: '#34c759' },
  other: { label: '其他', color: '#8e8e93' },
}

/** 合同状态流转 */
export const CONTRACT_STATUS_FLOW: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending_sign', 'terminated'],
  pending_sign: ['signed', 'terminated'],
  signed: ['effective', 'terminated'],
  effective: ['expired', 'terminated'],
  terminated: [],
  expired: [],
}
