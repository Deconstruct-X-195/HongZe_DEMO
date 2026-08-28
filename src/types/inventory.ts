/** 库存状态 */
export type InventoryStatus = 'in_stock' | 'partial_out' | 'all_out' | 'frozen'

/** 库存批次 */
export interface InventoryBatch {
  id: string // 批次编号（主键）
  batchNo: string // 批次号
  orderId: string // 关联订单ID
  inboundId: string // 关联入库单ID
  // 货物信息
  cargoName: string // 货物名称
  cargoType?: string // 品类
  cargoQuality?: string // 品质
  // 数量
  inboundQty: number // 入库数量（吨）
  currentQty: number // 当前库存数量（吨）
  outboundQty: number // 已出库数量（吨）
  // 仓储信息
  warehouse: string // 仓库/堆场
  location: string // 库位/堆位
  // 时间
  inboundDate: string // 入库日期
  freeDays?: number // 免费期（天）
  storageFee?: number // 堆存费（元）
  // 状态
  status: InventoryStatus // 库存状态
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

/** 库存变动记录 */
export interface InventoryMovement {
  id: string
  batchId: string // 批次ID
  type: 'inbound' | 'outbound' | 'adjust' | 'transfer' // 变动类型
  qty: number // 变动数量（正数=增加，负数=减少）
  beforeQty: number // 变动前数量
  afterQty: number // 变动后数量
  referenceType?: string // 关联单据类型
  referenceId?: string // 关联单据ID
  operator?: string // 操作人
  remark?: string
  createdAt: string
}

export const INVENTORY_STATUS_META: Record<InventoryStatus, { label: string; color: string; bg: string }> = {
  in_stock: { label: '在库', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  partial_out: { label: '部分出库', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  all_out: { label: '全部出库', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  frozen: { label: '冻结', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}
