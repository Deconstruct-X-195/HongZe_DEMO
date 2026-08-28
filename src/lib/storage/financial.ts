import type { FinancialInfo } from '@/types'
import { KEYS, read, write } from './base'

export const emptyFinancial = (orderId: string): FinancialInfo => ({
  orderId,
  paymentStatus: 'unpaid',
  totalAmount: 0,
  receivedAmount: 0,
  invoiceStatus: 'none',
  vouchers: [],
  remark: '',
  updatedAt: new Date().toISOString(),
})

export const getFinancial = (orderId: string): FinancialInfo | undefined =>
  read<FinancialInfo>(KEYS.financials).find((f) => f.orderId === orderId)

export const upsertFinancial = (info: FinancialInfo): void => {
  const list = read<FinancialInfo>(KEYS.financials)
  const idx = list.findIndex((f) => f.orderId === info.orderId)
  if (idx >= 0) list[idx] = info
  else list.push(info)
  write(KEYS.financials, list)
}
