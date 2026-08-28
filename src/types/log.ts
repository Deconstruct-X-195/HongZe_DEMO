import type { OrderStatus } from './order'

/** 操作角色 */
export type OperatorRole = 'sales' | 'port' | 'capacity' | 'finance' | 'transport' | 'admin'

/** 操作日志 */
export interface OperationLog {
  id: string
  orderId: string
  operator: string // 操作人员
  role: OperatorRole // 角色
  action: string // 操作描述
  fromStatus?: OrderStatus // 变更前状态
  toStatus?: OrderStatus // 变更后状态
  remark?: string
  createdAt: string
}

/** 角色元数据 */
export const ROLE_META: Record<OperatorRole, { label: string; color: string }> = {
  sales: { label: '业务员', color: '#0071e3' },
  port: { label: '港口专员', color: '#ff9500' },
  capacity: { label: '运力专员', color: '#af52de' },
  finance: { label: '财务人员', color: '#34c759' },
  transport: { label: '运输人员', color: '#5856d6' },
  admin: { label: '管理员', color: '#8e8e93' },
}


