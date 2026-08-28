import type { Order, OrderStatus, PortInfo, Capacity, TransportPlan, ChannelDetail, FinancialInfo, ChannelShipping, CargoMilestone, OperationLog } from '@/types'
import { migrateStatus } from '@/types'
import { KEYS, read, write } from './base'

/** 生成订单编号：HZ + yyyyMMdd + 4位流水 */
export function genOrderId(): string {
  const d = new Date()
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const prefix = `HZ${ymd}`
  const orders = read<Order>(KEYS.orders)
  const maxSeq = orders.reduce((max, o) => {
    if (!o.id.startsWith(prefix)) return max
    const n = Number(o.id.slice(prefix.length))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  const seq = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}${seq}`
}

/** 旧数据迁移：将 steelMill/saleQty 转为 customers 数组，并迁移状态 */
function migrateOrder(o: any): Order {
  if (!Array.isArray(o.customers)) {
    const names: string[] = (o.steelMill ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
    const totalQty: number = o.saleQty ?? 0
    o.customers = names.map((name: string, i: number) => ({
      id: `cust_legacy_${i}`,
      name,
      qty: i === 0 ? totalQty : 0,
    }))
    delete o.steelMill
    delete o.saleQty
  }
  o.status = migrateStatus(o.status)
  return o as Order
}

export const listOrders = (): Order[] =>
  read<any>(KEYS.orders)
    .map(migrateOrder)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))

export const getOrder = (id: string): Order | undefined =>
  read<any>(KEYS.orders).map(migrateOrder).find((o) => o.id === id)

export const upsertOrder = (order: Order): void => {
  const list = read<Order>(KEYS.orders)
  const idx = list.findIndex((o) => o.id === order.id)
  if (idx >= 0) list[idx] = order
  else list.push(order)
  write(KEYS.orders, list)
}

export const deleteOrder = (id: string): void => {
  write(KEYS.orders, read<Order>(KEYS.orders).filter((o) => o.id !== id))
  write(KEYS.ports, read<PortInfo>(KEYS.ports).filter((p) => p.orderId !== id))
  write(KEYS.capacities, read<Capacity>(KEYS.capacities).filter((c) => c.orderId !== id))
  write(KEYS.plans, read<TransportPlan>(KEYS.plans).filter((p) => p.orderId !== id))
  write(KEYS.channelDetails, read<ChannelDetail>(KEYS.channelDetails).filter((d) => d.orderId !== id))
  write(KEYS.financials, read<FinancialInfo>(KEYS.financials).filter((f) => f.orderId !== id))
  write(KEYS.shippings, read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId !== id))
  write(KEYS.milestones, read<CargoMilestone>(KEYS.milestones).filter((m) => m.orderId !== id))
  write(KEYS.logs, read<OperationLog>(KEYS.logs).filter((l) => l.orderId !== id))
}

export const updateOrderStatus = (id: string, status: OrderStatus): void => {
  const o = getOrder(id)
  if (o) {
    o.status = status
    o.updatedAt = new Date().toISOString()
    upsertOrder(o)
  }
}
