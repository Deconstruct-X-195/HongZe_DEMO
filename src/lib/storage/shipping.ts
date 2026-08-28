import type { ChannelShipping, CargoMilestone } from '@/types'
import { KEYS, read, write, genId } from './base'

export const listShippings = (orderId: string): ChannelShipping[] =>
  read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId === orderId)

export const upsertShippings = (orderId: string, items: ChannelShipping[]): void => {
  const all = read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId !== orderId)
  write(KEYS.shippings, [...all, ...items])
}

export const listMilestones = (orderId: string): CargoMilestone[] =>
  read<CargoMilestone>(KEYS.milestones)
    .filter((m) => m.orderId === orderId)
    .sort((a, b) => (a.plannedTime < b.plannedTime ? -1 : 1))

export const upsertMilestones = (orderId: string, items: CargoMilestone[]): void => {
  const all = read<CargoMilestone>(KEYS.milestones).filter((m) => m.orderId !== orderId)
  write(KEYS.milestones, [...all, ...items])
}

export const newMilestoneId = () => genId('ms')
