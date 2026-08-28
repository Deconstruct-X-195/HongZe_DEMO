import type { Settlement, SettlementStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genSettlementId = () => genId('stl')

export const listSettlements = (): Settlement[] =>
  read<Settlement>(KEYS.settlements).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getSettlement = (id: string): Settlement | undefined =>
  read<Settlement>(KEYS.settlements).find((s) => s.id === id)

export const upsertSettlement = (settlement: Settlement): void => {
  const list = read<Settlement>(KEYS.settlements)
  const idx = list.findIndex((s) => s.id === settlement.id)
  if (idx >= 0) list[idx] = settlement
  else list.push(settlement)
  write(KEYS.settlements, list)
}

export const deleteSettlement = (id: string): void => {
  write(KEYS.settlements, read<Settlement>(KEYS.settlements).filter((s) => s.id !== id))
}

export const updateSettlementStatus = (id: string, status: SettlementStatus): void => {
  const s = getSettlement(id)
  if (s) {
    s.status = status
    s.updatedAt = new Date().toISOString()
    upsertSettlement(s)
  }
}
