import type { Outbound, OutboundStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genOutboundId = () => genId('outb')

export const listOutbounds = (): Outbound[] =>
  read<Outbound>(KEYS.outbounds).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getOutbound = (id: string): Outbound | undefined =>
  read<Outbound>(KEYS.outbounds).find((o) => o.id === id)

export const upsertOutbound = (outbound: Outbound): void => {
  const list = read<Outbound>(KEYS.outbounds)
  const idx = list.findIndex((o) => o.id === outbound.id)
  if (idx >= 0) list[idx] = outbound
  else list.push(outbound)
  write(KEYS.outbounds, list)
}

export const deleteOutbound = (id: string): void => {
  write(KEYS.outbounds, read<Outbound>(KEYS.outbounds).filter((o) => o.id !== id))
}

export const updateOutboundStatus = (id: string, status: OutboundStatus): void => {
  const o = getOutbound(id)
  if (o) {
    o.status = status
    o.updatedAt = new Date().toISOString()
    upsertOutbound(o)
  }
}
