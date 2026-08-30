/** 成本项类型 */
export type CostItemType =
  | 'rail_freight' // 铁路运费
  | 'road_freight' // 公路运费
  | 'loading' // 装卸费
  | 'handling' // 搬运费
  | 'transit' // 中转费
  | 'waiting' // 等待费
  | 'storage' // 仓储费
  | 'insurance' // 保险费
  | 'tax' // 税费
  | 'time_cost' // 时间/组织成本
  | 'other' // 其他

/** 成本明细项 */
export interface CostItem {
  id: string
  type: CostItemType // 成本类型
  name: string // 成本项名称
  unit: string // 单位（元/吨、元/车、元/次等）
  unitPrice: number // 单价
  quantity: number // 数量
  amount: number // 金额（单价×数量）
  remark?: string // 备注
}

/** 成本明细表 */
export interface CostSheet {
  id: string // 成本编号（主键）
  costNo: string // 成本单号
  orderId?: string // 关联订单ID
  inquiryId?: string // 关联询价ID
  quoteId?: string // 关联报价ID
  // 成本信息
  items: CostItem[] // 成本明细项
  totalCost: number // 总成本
  // 报价信息
  quotedPrice?: number // 对客报价
  profit?: number // 毛利
  profitRate?: number // 毛利率
  // 状态
  status: 'draft' | 'confirmed' | 'archived' // 状态
  calculatedBy?: string // 核算人
  confirmedBy?: string // 确认人
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const COST_ITEM_TYPE_META: Record<CostItemType, { label: string; color: string }> = {
  rail_freight: { label: '铁路运费', color: '#4176e6' },
  road_freight: { label: '公路运费', color: '#ff9500' },
  loading: { label: '装卸费', color: '#34c759' },
  handling: { label: '搬运费', color: '#af52de' },
  transit: { label: '中转费', color: '#5856d6' },
  waiting: { label: '等待费', color: '#ff2d55' },
  storage: { label: '仓储费', color: '#5ac8fa' },
  insurance: { label: '保险费', color: '#ff9500' },
  tax: { label: '税费', color: '#ff3b30' },
  time_cost: { label: '时间/组织成本', color: '#8e8e93' },
  other: { label: '其他', color: '#8e8e93' },
}
