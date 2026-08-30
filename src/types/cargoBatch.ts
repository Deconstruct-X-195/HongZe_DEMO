/**
 * 货物批次（V3 批次模型）
 * 同一订单下，货物属性（矿山+品类+品质）一致、可独立执行与计量的货物单元。
 * 数量、状态、凭证三类信息全链挂载在批次上，贯穿：
 * 承运前固化（创建）→ 派单/请车（装车量）→ 运输（在途）→ 入库（入库量）
 * → 堆存（库存）→ 出库（出库量）→ 结算（结算量）→ 闭环。
 */

/** 货物批次状态 */
export type CargoBatchStatus =
  | 'created' // 已创建（承运前固化，尚未派单）
  | 'dispatched' // 已派单/待执行
  | 'in_transit' // 运输中
  | 'in_stock' // 已入库（在库）
  | 'partial_out' // 部分出库
  | 'all_out' // 全部出库
  | 'settled' // 已结算
  | 'closed' // 已关闭（双条件：全部出库 + 财务结清）

/** 货物批次 */
export interface CargoBatch {
  id: string // 批次编号（主键）
  batchNo: string // 批次号：ORD-{订单号}-{三位序号}
  orderId: string // 关联订单ID
  // 货物信息（同批次内属性必须一致）
  cargoName: string // 货物名称
  cargoType?: string // 品类
  cargoQuality?: string // 品质
  mine?: string // 来源矿山
  // 五级数量口径（吨）
  plannedQty: number // 计划量（承运前固化，商务基准）
  loadedQty: number // 装车量（派单/请车回填）
  inboundQty: number // 入库量（地磅累计）
  outboundQty: number // 出库量（累计）
  settledQty: number // 结算量（财务最终口径）
  // 状态
  status: CargoBatchStatus // 批次状态
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const CARGO_BATCH_STATUS_META: Record<
  CargoBatchStatus,
  { label: string; color: string; bg: string }
> = {
  created: { label: '已创建', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  dispatched: { label: '已派单', color: '#4176e6', bg: 'rgba(0,113,227,0.12)' },
  in_transit: { label: '运输中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  in_stock: { label: '在库', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  partial_out: { label: '部分出库', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  all_out: { label: '全部出库', color: '#0ab1e6', bg: 'rgba(10,177,230,0.12)' },
  settled: { label: '已结算', color: '#af52de', bg: 'rgba(175,82,222,0.12)' },
  closed: { label: '已关闭', color: '#6d7a8a', bg: 'rgba(109,122,138,0.12)' },
}

/**
 * 批次状态流转规则（正向主链）
 * created → dispatched → in_transit → in_stock → partial_out → all_out → settled → closed
 * 数量联动可自动跳变（如入库直接登记时 created → in_stock）
 */
export const CARGO_BATCH_STATUS_FLOW: Record<CargoBatchStatus, CargoBatchStatus[]> = {
  created: ['dispatched', 'in_transit', 'in_stock'],
  dispatched: ['in_transit', 'in_stock'],
  in_transit: ['in_stock'],
  in_stock: ['partial_out', 'all_out'],
  partial_out: ['all_out'],
  all_out: ['settled'],
  settled: ['closed'],
  closed: [],
}

/** 批次当前库存量 = 累计入库 - 累计出库 */
export function batchStock(b: CargoBatch): number {
  return (b.inboundQty || 0) - (b.outboundQty || 0)
}

/** 批次剩余量 = 计划量 - 累计入库 */
export function batchRemaining(b: CargoBatch): number {
  return (b.plannedQty || 0) - (b.inboundQty || 0)
}

/** 生成批次号：ORD-{orderId}-{三位序号} */
export function genCargoBatchNo(orderId: string, seq: number): string {
  return `ORD-${orderId}-${String(seq).padStart(3, '0')}`
}
