import type { Order, OrderStatus } from '../types'
import { customersDisplay, STATUS_FLOW, migrateStatus } from '../types'

/** 金额/数量格式化 */
export const fmtNum = (n: number | undefined | null, unit = ''): string => {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  const s = n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
  return unit ? `${s} ${unit}` : s
}

export const fmtMoney = (n: number | undefined | null): string => {
  if (n === undefined || n === null || Number.isNaN(n)) return '—'
  return `¥${n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })}`
}

/** 日期时间格式化 */
export const fmtDate = (s: string): string => {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const fmtDateShort = (s: string): string => {
  if (!s) return '—'
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** datetime-local 输入框值 */
export const toLocalInput = (s: string): string => {
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** 订单摘要 */
export const orderSummary = (o: Order): string =>
  `${o.cargoName || '货物'} · ${fmtNum(o.cargoTotal, '吨')} · ${o.destPort || '—'} · ${customersDisplay(o.customers) || '—'}`

/** 计算下一步状态（基于状态流转规则） */
export const nextStatus = (current: OrderStatus): OrderStatus => {
  const c = migrateStatus(current)
  if (!c) return c
  const next = STATUS_FLOW[c]
  return next && next.length > 0 ? next[0] : c
}
