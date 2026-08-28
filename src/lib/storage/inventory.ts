import type { InventoryBatch, InventoryMovement } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genInventoryBatchId = () => genId('invb')
export const genInventoryMovementId = () => genId('invm')

// 库存批次
export const listInventoryBatches = (): InventoryBatch[] =>
  read<InventoryBatch>(KEYS.inventoryBatches).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getInventoryBatch = (id: string): InventoryBatch | undefined =>
  read<InventoryBatch>(KEYS.inventoryBatches).find((b) => b.id === id)

export const upsertInventoryBatch = (batch: InventoryBatch): void => {
  const list = read<InventoryBatch>(KEYS.inventoryBatches)
  const idx = list.findIndex((b) => b.id === batch.id)
  if (idx >= 0) list[idx] = batch
  else list.push(batch)
  write(KEYS.inventoryBatches, list)
}

export const deleteInventoryBatch = (id: string): void => {
  write(KEYS.inventoryBatches, read<InventoryBatch>(KEYS.inventoryBatches).filter((b) => b.id !== id))
}

// 库存变动记录
export const listInventoryMovements = (batchId?: string): InventoryMovement[] => {
  const all = read<InventoryMovement>(KEYS.inventoryMovements).sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  )
  return batchId ? all.filter((m) => m.batchId === batchId) : all
}

export const addInventoryMovement = (movement: InventoryMovement): void => {
  const list = read<InventoryMovement>(KEYS.inventoryMovements)
  list.push(movement)
  write(KEYS.inventoryMovements, list)
}
