import type { CostSheet } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genCostSheetId = () => genId('cost')

export const listCostSheets = (): CostSheet[] =>
  read<CostSheet>(KEYS.costSheets).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getCostSheet = (id: string): CostSheet | undefined =>
  read<CostSheet>(KEYS.costSheets).find((c) => c.id === id)

export const upsertCostSheet = (costSheet: CostSheet): void => {
  const list = read<CostSheet>(KEYS.costSheets)
  const idx = list.findIndex((c) => c.id === costSheet.id)
  if (idx >= 0) list[idx] = costSheet
  else list.push(costSheet)
  write(KEYS.costSheets, list)
}

export const deleteCostSheet = (id: string): void => {
  write(KEYS.costSheets, read<CostSheet>(KEYS.costSheets).filter((c) => c.id !== id))
}
