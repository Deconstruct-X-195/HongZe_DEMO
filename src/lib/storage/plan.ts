import type { TransportPlan } from '@/types'
import { KEYS, read, write } from './base'

export const getPlan = (orderId: string): TransportPlan | undefined =>
  read<TransportPlan>(KEYS.plans).find((p) => p.orderId === orderId)

export const upsertPlan = (plan: TransportPlan): void => {
  const list = read<TransportPlan>(KEYS.plans)
  const idx = list.findIndex((p) => p.orderId === plan.orderId)
  if (idx >= 0) list[idx] = plan
  else list.push(plan)
  write(KEYS.plans, list)
}
