import type {
  Order,
  PortInfo,
  Capacity,
  TransportPlan,
  ChannelDetail,
  TransitLoading,
  PostLegRoad,
  OrderStatus,
  TransitChannelType,
  FinancialInfo,
  ChannelShipping,
  CargoMilestone,
  OperationLog,
} from '../types'
import { migrateStatus } from '../types'

const KEYS = {
  orders: 'hongze:orders',
  ports: 'hongze:ports',
  capacities: 'hongze:capacities',
  plans: 'hongze:plans',
  channelDetails: 'hongze:channelDetails',
  financials: 'hongze:financials',
  shippings: 'hongze:shippings',
  milestones: 'hongze:milestones',
  logs: 'hongze:logs',
} as const

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

/** 生成订单编号：HZ + yyyyMMdd + 4位流水 */
export function genOrderId(): string {
  const d = new Date()
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0')
  const prefix = `HZ${ymd}`
  const orders = read<Order>(KEYS.orders)
  // 取当日最大流水号 +1，避免删除订单后 length 缩减导致 ID 重复
  const maxSeq = orders.reduce((max, o) => {
    if (!o.id.startsWith(prefix)) return max
    const n = Number(o.id.slice(prefix.length))
    return Number.isFinite(n) && n > max ? n : max
  }, 0)
  const seq = String(maxSeq + 1).padStart(4, '0')
  return `${prefix}${seq}`
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

/* ---------- Orders ---------- */

/** 旧数据迁移：将 steelMill/saleQty 转为 customers 数组，并迁移状态 */
function migrateOrder(o: any): Order {
  if (!Array.isArray(o.customers)) {
    // 旧数据兼容：steelMill（可能多行）+ 单一 saleQty
    const names: string[] = (o.steelMill ?? '')
      .split('\n')
      .map((s: string) => s.trim())
      .filter(Boolean)
    const totalQty: number = o.saleQty ?? 0
    // 旧 saleQty 为总量，无法拆分到每个客户；赋给首个客户，其余置 0，保持总量不变
    o.customers = names.map((name: string, i: number) => ({
      id: `cust_legacy_${i}`,
      name,
      qty: i === 0 ? totalQty : 0,
    }))
    delete o.steelMill
    delete o.saleQty
  }
  // 状态迁移：'done' → 'pending_confirm'
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
  write(
    KEYS.orders,
    read<Order>(KEYS.orders).filter((o) => o.id !== id),
  )
  write(
    KEYS.ports,
    read<PortInfo>(KEYS.ports).filter((p) => p.orderId !== id),
  )
  write(
    KEYS.capacities,
    read<Capacity>(KEYS.capacities).filter((c) => c.orderId !== id),
  )
  write(
    KEYS.plans,
    read<TransportPlan>(KEYS.plans).filter((p) => p.orderId !== id),
  )
  write(
    KEYS.channelDetails,
    read<ChannelDetail>(KEYS.channelDetails).filter((d) => d.orderId !== id),
  )
  write(
    KEYS.financials,
    read<FinancialInfo>(KEYS.financials).filter((f) => f.orderId !== id),
  )
  write(
    KEYS.shippings,
    read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId !== id),
  )
  write(
    KEYS.milestones,
    read<CargoMilestone>(KEYS.milestones).filter((m) => m.orderId !== id),
  )
  write(
    KEYS.logs,
    read<OperationLog>(KEYS.logs).filter((l) => l.orderId !== id),
  )
}

export const updateOrderStatus = (id: string, status: OrderStatus): void => {
  const o = getOrder(id)
  if (o) {
    o.status = status
    o.updatedAt = new Date().toISOString()
    upsertOrder(o)
  }
}

/* ---------- Port ---------- */
export const getPort = (orderId: string): PortInfo | undefined =>
  read<PortInfo>(KEYS.ports).find((p) => p.orderId === orderId)

export const upsertPort = (port: PortInfo): void => {
  const list = read<PortInfo>(KEYS.ports)
  const idx = list.findIndex((p) => p.orderId === port.orderId)
  if (idx >= 0) list[idx] = port
  else list.push(port)
  write(KEYS.ports, list)
}

/* ---------- Capacity ---------- */
export const listCapacities = (orderId: string): Capacity[] =>
  read<Capacity>(KEYS.capacities).filter((c) => c.orderId === orderId)

export const upsertCapacities = (orderId: string, items: Capacity[]): void => {
  const all = read<Capacity>(KEYS.capacities).filter((c) => c.orderId !== orderId)
  write(KEYS.capacities, [...all, ...items])
}

export const newCapacityId = () => genId('cap')

/* ---------- Plan ---------- */
export const getPlan = (orderId: string): TransportPlan | undefined =>
  read<TransportPlan>(KEYS.plans).find((p) => p.orderId === orderId)

export const upsertPlan = (plan: TransportPlan): void => {
  const list = read<TransportPlan>(KEYS.plans)
  const idx = list.findIndex((p) => p.orderId === plan.orderId)
  if (idx >= 0) list[idx] = plan
  else list.push(plan)
  write(KEYS.plans, list)
}

/* ---------- ChannelDetail（公铁联运中转详情） ---------- */
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

/* ---------- Financial（财务信息，每订单 1 条） ---------- */

export const emptyFinancial = (orderId: string): FinancialInfo => ({
  orderId,
  paymentStatus: 'unpaid',
  totalAmount: 0,
  receivedAmount: 0,
  invoiceStatus: 'none',
  vouchers: [],
  remark: '',
  updatedAt: new Date().toISOString(),
})

export const getFinancial = (orderId: string): FinancialInfo | undefined =>
  read<FinancialInfo>(KEYS.financials).find((f) => f.orderId === orderId)

export const upsertFinancial = (info: FinancialInfo): void => {
  const list = read<FinancialInfo>(KEYS.financials)
  const idx = list.findIndex((f) => f.orderId === info.orderId)
  if (idx >= 0) list[idx] = info
  else list.push(info)
  write(KEYS.financials, list)
}

/* ---------- ChannelShipping（运输通道发运信息，与 Capacity 1:1） ---------- */

export const listShippings = (orderId: string): ChannelShipping[] =>
  read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId === orderId)

export const upsertShippings = (orderId: string, items: ChannelShipping[]): void => {
  const all = read<ChannelShipping>(KEYS.shippings).filter((s) => s.orderId !== orderId)
  write(KEYS.shippings, [...all, ...items])
}

/* ---------- CargoMilestone（货物动态节点） ---------- */

export const listMilestones = (orderId: string): CargoMilestone[] =>
  read<CargoMilestone>(KEYS.milestones)
    .filter((m) => m.orderId === orderId)
    .sort((a, b) => (a.plannedTime < b.plannedTime ? -1 : 1))

export const upsertMilestones = (orderId: string, items: CargoMilestone[]): void => {
  const all = read<CargoMilestone>(KEYS.milestones).filter((m) => m.orderId !== orderId)
  write(KEYS.milestones, [...all, ...items])
}

export const newMilestoneId = () => genId('ms')

/* ---------- OperationLog（操作日志） ---------- */

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

