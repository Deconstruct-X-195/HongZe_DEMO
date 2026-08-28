/** 客户类型 */
export type CustomerType = 'trader' | 'consignor' | 'owner' | 'carrier' | 'other'

/** 客户状态 */
export type CustomerStatus = 'active' | 'inactive' | 'blacklist'

/** 客户信息 */
export interface Customer {
  id: string // 客户编号（主键）
  name: string // 单位名称
  type: CustomerType // 客户类型（贸易商/委托方/货主/承运方/其他）
  country?: string // 国别
  address?: string // 地址
  zipCode?: string // 邮编
  contactPerson: string // 联系人
  contactInfo: string // 联系方式（电话/邮箱）
  bankAccount?: string // 银行账户
  taxNumber?: string // 税号
  status: CustomerStatus // 客户状态
  remark?: string // 备注
  createdAt: string
  updatedAt: string
}

export const CUSTOMER_TYPE_META: Record<CustomerType, { label: string; color: string }> = {
  trader: { label: '贸易商', color: '#0071e3' },
  consignor: { label: '委托方', color: '#ff9500' },
  owner: { label: '货主', color: '#34c759' },
  carrier: { label: '承运方', color: '#5856d6' },
  other: { label: '其他', color: '#8e8e93' },
}

export const CUSTOMER_STATUS_META: Record<CustomerStatus, { label: string; color: string; bg: string }> = {
  active: { label: '正常', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  inactive: { label: '停用', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  blacklist: { label: '黑名单', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}
