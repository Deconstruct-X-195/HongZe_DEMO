import type { CargoBatch } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genCargoBatchId = () => genId('cb')

export const listCargoBatches = (): CargoBatch[] =>
  read<CargoBatch>(KEYS.cargoBatches).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getCargoBatch = (id: string): CargoBatch | undefined =>
  read<CargoBatch>(KEYS.cargoBatches).find((b) => b.id === id)

/** 按订单查询批次（按批次号正序） */
export const listCargoBatchesByOrder = (orderId: string): CargoBatch[] =>
  read<CargoBatch>(KEYS.cargoBatches)
    .filter((b) => b.orderId === orderId)
    .sort((a, b) => (a.batchNo < b.batchNo ? -1 : 1))

export const upsertCargoBatch = (batch: CargoBatch): void => {
  const list = read<CargoBatch>(KEYS.cargoBatches)
  const idx = list.findIndex((b) => b.id === batch.id)
  if (idx >= 0) list[idx] = batch
  else list.push(batch)
  write(KEYS.cargoBatches, list)
}

export const deleteCargoBatch = (id: string): void => {
  write(KEYS.cargoBatches, read<CargoBatch>(KEYS.cargoBatches).filter((b) => b.id !== id))
}

/** 生成订单下一个批次号序号 */
export const nextBatchSeq = (orderId: string): number =>
  listCargoBatchesByOrder(orderId).length + 1
