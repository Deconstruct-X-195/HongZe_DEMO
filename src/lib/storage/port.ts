import type { PortInfo } from '@/types'
import { KEYS, read, write } from './base'

export const getPort = (orderId: string): PortInfo | undefined =>
  read<PortInfo>(KEYS.ports).find((p) => p.orderId === orderId)

export const upsertPort = (port: PortInfo): void => {
  const list = read<PortInfo>(KEYS.ports)
  const idx = list.findIndex((p) => p.orderId === port.orderId)
  if (idx >= 0) list[idx] = port
  else list.push(port)
  write(KEYS.ports, list)
}
