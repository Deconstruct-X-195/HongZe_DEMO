import type { Capacity, ChannelDetail, TransitChannelType, TransitLoading, PostLegRoad } from '@/types'
import { KEYS, read, write, genId } from './base'

export const listCapacities = (orderId: string): Capacity[] =>
  read<Capacity>(KEYS.capacities).filter((c) => c.orderId === orderId)

export const upsertCapacities = (orderId: string, items: Capacity[]): void => {
  const all = read<Capacity>(KEYS.capacities).filter((c) => c.orderId !== orderId)
  write(KEYS.capacities, [...all, ...items])
}

export const newCapacityId = () => genId('cap')

export const emptyLoading = (): TransitLoading => ({
  equipmentType: '',
  maxCapacityPerHour: 0,
  workWindow: '',
  operatorConfig: '',
  remark: '',
})

export const emptyPostLeg = (): PostLegRoad => ({
  vehicleType: '',
  idleCapacity: 0,
  etaHours: 0,
  cost: 0,
  carrier: '',
  remark: '',
})

export const getChannelDetail = (
  orderId: string,
  channelType: TransitChannelType,
): ChannelDetail | undefined =>
  read<ChannelDetail>(KEYS.channelDetails).find(
    (d) => d.orderId === orderId && d.channelType === channelType,
  )

export const listChannelDetails = (orderId: string): ChannelDetail[] =>
  read<ChannelDetail>(KEYS.channelDetails).filter((d) => d.orderId === orderId)

export const upsertChannelDetail = (detail: ChannelDetail): void => {
  const list = read<ChannelDetail>(KEYS.channelDetails)
  const idx = list.findIndex(
    (d) => d.orderId === detail.orderId && d.channelType === detail.channelType,
  )
  if (idx >= 0) list[idx] = detail
  else list.push(detail)
  write(KEYS.channelDetails, list)
}

export const upsertChannelDetails = (orderId: string, items: ChannelDetail[]): void => {
  const all = read<ChannelDetail>(KEYS.channelDetails).filter((d) => d.orderId !== orderId)
  write(KEYS.channelDetails, [...all, ...items])
}
