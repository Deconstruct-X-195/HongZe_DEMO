import type { Payment, PaymentRecordStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genPaymentId = () => genId('pay')

export const listPayments = (): Payment[] =>
  read<Payment>(KEYS.payments).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getPayment = (id: string): Payment | undefined =>
  read<Payment>(KEYS.payments).find((p) => p.id === id)

export const upsertPayment = (payment: Payment): void => {
  const list = read<Payment>(KEYS.payments)
  const idx = list.findIndex((p) => p.id === payment.id)
  if (idx >= 0) list[idx] = payment
  else list.push(payment)
  write(KEYS.payments, list)
}

export const deletePayment = (id: string): void => {
  write(KEYS.payments, read<Payment>(KEYS.payments).filter((p) => p.id !== id))
}

export const updatePaymentStatus = (id: string, status: PaymentRecordStatus): void => {
  const p = getPayment(id)
  if (p) {
    p.status = status
    p.updatedAt = new Date().toISOString()
    upsertPayment(p)
  }
}
