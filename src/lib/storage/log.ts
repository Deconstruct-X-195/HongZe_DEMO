import type { OperationLog } from '@/types'
import { KEYS, read, write, genId } from './base'

export const listLogs = (orderId: string): OperationLog[] =>
  read<OperationLog>(KEYS.logs)
    .filter((l) => l.orderId === orderId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const addLog = (log: OperationLog): void => {
  const list = read<OperationLog>(KEYS.logs)
  list.push(log)
  write(KEYS.logs, list)
}

export const newLogId = () => genId('log')
