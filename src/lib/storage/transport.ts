import type { TransportRecord } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genTransportRecordId = () => genId('trp')

export const listTransportRecords = (): TransportRecord[] =>
  read<TransportRecord>(KEYS.transportRecords).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getTransportRecord = (id: string): TransportRecord | undefined =>
  read<TransportRecord>(KEYS.transportRecords).find((t) => t.id === id)

export const upsertTransportRecord = (record: TransportRecord): void => {
  const list = read<TransportRecord>(KEYS.transportRecords)
  const idx = list.findIndex((t) => t.id === record.id)
  if (idx >= 0) list[idx] = record
  else list.push(record)
  write(KEYS.transportRecords, list)
}

export const deleteTransportRecord = (id: string): void => {
  write(KEYS.transportRecords, read<TransportRecord>(KEYS.transportRecords).filter((t) => t.id !== id))
}
