import type { Receipt, ReceiptStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genReceiptId = () => genId('rcpt')

export const listReceipts = (): Receipt[] =>
  read<Receipt>(KEYS.receipts).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getReceipt = (id: string): Receipt | undefined =>
  read<Receipt>(KEYS.receipts).find((r) => r.id === id)

export const upsertReceipt = (receipt: Receipt): void => {
  const list = read<Receipt>(KEYS.receipts)
  const idx = list.findIndex((r) => r.id === receipt.id)
  if (idx >= 0) list[idx] = receipt
  else list.push(receipt)
  write(KEYS.receipts, list)
}

export const deleteReceipt = (id: string): void => {
  write(KEYS.receipts, read<Receipt>(KEYS.receipts).filter((r) => r.id !== id))
}

export const updateReceiptStatus = (id: string, status: ReceiptStatus): void => {
  const r = getReceipt(id)
  if (r) {
    r.status = status
    r.updatedAt = new Date().toISOString()
    upsertReceipt(r)
  }
}
