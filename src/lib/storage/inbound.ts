import type { Inbound, InboundStatus } from '@/types'
import { KEYS, read, write, genId } from './base'

export const genInboundId = () => genId('inb')

export const listInbounds = (): Inbound[] =>
  read<Inbound>(KEYS.inbounds).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getInbound = (id: string): Inbound | undefined =>
  read<Inbound>(KEYS.inbounds).find((i) => i.id === id)

export const upsertInbound = (inbound: Inbound): void => {
  const list = read<Inbound>(KEYS.inbounds)
  const idx = list.findIndex((i) => i.id === inbound.id)
  if (idx >= 0) list[idx] = inbound
  else list.push(inbound)
  write(KEYS.inbounds, list)
}

export const deleteInbound = (id: string): void => {
  write(KEYS.inbounds, read<Inbound>(KEYS.inbounds).filter((i) => i.id !== id))
}

export const updateInboundStatus = (id: string, status: InboundStatus): void => {
  const i = getInbound(id)
  if (i) {
    i.status = status
    i.updatedAt = new Date().toISOString()
    upsertInbound(i)
  }
}
