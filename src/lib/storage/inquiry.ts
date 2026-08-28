import type { Inquiry, InquiryStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genInquiryId = () => genId('inq')

export const listInquiries = (): Inquiry[] =>
  read<Inquiry>(KEYS.inquiries).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getInquiry = (id: string): Inquiry | undefined =>
  read<Inquiry>(KEYS.inquiries).find((i) => i.id === id)

export const upsertInquiry = (inquiry: Inquiry): void => {
  const list = read<Inquiry>(KEYS.inquiries)
  const idx = list.findIndex((i) => i.id === inquiry.id)
  if (idx >= 0) list[idx] = inquiry
  else list.push(inquiry)
  write(KEYS.inquiries, list)
}

export const deleteInquiry = (id: string): void => {
  write(KEYS.inquiries, read<Inquiry>(KEYS.inquiries).filter((i) => i.id !== id))
}

export const updateInquiryStatus = (id: string, status: InquiryStatus): void => {
  const i = getInquiry(id)
  if (i) {
    i.status = status
    i.updatedAt = new Date().toISOString()
    upsertInquiry(i)
  }
}
