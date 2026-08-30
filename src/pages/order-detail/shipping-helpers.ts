/**
 * 发运/仓储共享计算工具（纯函数，供订单详情各标签面板复用）
 */
import type { Capacity, ChannelShipping, ChannelType, ShippingState } from '@/types'
import { CHANNEL_META } from '@/types'

/** 计算占比百分比（安全除法） */
export function pct(n: number, d: number): number {
  return d > 0 ? Math.min(100, Math.round((n / d) * 100)) : 0
}

/** 根据发运量自动推断发运状态 */
export function autoShippingState(shipped: number, planned: number): ShippingState {
  if (shipped <= 0) return 'not_started'
  if (shipped >= planned && planned > 0) return 'completed'
  return 'shipping'
}

/** 港口拥堵标签 */
export function congLabel(v?: string): string {
  if (!v) return '—'
  return ({ normal: '正常', mild: '轻度拥堵', severe: '严重拥堵' } as const)[v as 'normal' | 'mild' | 'severe']
}

/** 按通道查找发运信息 */
export function shippingOf(shippings: ChannelShipping[], capId: string): ChannelShipping | undefined {
  return shippings.find((s) => s.capacityId === capId)
}

/** 通道货物追踪行（每条通道的货物流转状态） */
export interface ChannelTrackingRow {
  shipping: ChannelShipping
  channelLabel: string
  channelColor: string
  route: string
  planned: number
  shipped: number
  inTransit: number
  stored: number
  pickedUp: number
  unshipped: number
  progress: number
}

/** 构建通道货物追踪数据（纯函数，过滤未编制计划的空通道） */
export function buildChannelTracking(capacities: Capacity[], shippings: ChannelShipping[]): ChannelTrackingRow[] {
  return shippings
    .filter((s) => (s.plannedQty || 0) > 0 || (s.shippedQty || 0) > 0)
    .map((s) => {
    const cap = capacities.find((c) => c.id === s.capacityId)
    const inTransit = Math.max(0, (s.shippedQty || 0) - (s.storedQty || 0) - (s.pickedUpQty || 0))
    return {
      shipping: s,
      channelLabel: cap ? CHANNEL_META[cap.channelType as ChannelType].short : '—',
      channelColor: cap ? CHANNEL_META[cap.channelType as ChannelType].color : '#8e8e93',
      route: cap ? `${cap.origin || '—'}${cap.transfer ? ` → ${cap.transfer}` : ''} → ${cap.destination || '—'}` : '—',
      planned: s.plannedQty || 0,
      shipped: s.shippedQty || 0,
      inTransit,
      stored: s.storedQty || 0,
      pickedUp: s.pickedUpQty || 0,
      unshipped: Math.max(0, (s.plannedQty || 0) - (s.shippedQty || 0)),
      progress: s.plannedQty > 0 ? pct(s.shippedQty || 0, s.plannedQty) : 0,
    }
  })
}

/** 发运统计（订单整体，未编制计划的空通道不计入通道数） */
export function buildShippingStats(shippings: ChannelShipping[]) {
  const valid = shippings.filter((s) => (s.plannedQty || 0) > 0 || (s.shippedQty || 0) > 0)
  const planned = valid.reduce((s, x) => s + (x.plannedQty || 0), 0)
  const shipped = valid.reduce((s, x) => s + (x.shippedQty || 0), 0)
  const stored = valid.reduce((s, x) => s + (x.storedQty || 0), 0)
  const pickedUp = valid.reduce((s, x) => s + (x.pickedUpQty || 0), 0)
  const remaining = planned - shipped
  const rate = planned > 0 ? Math.min(100, Math.round((shipped / planned) * 100)) : 0
  const completedChannels = valid.filter((s) => s.state === 'completed').length
  const shippingChannels = valid.filter((s) => s.state === 'shipping').length
  return { planned, shipped, stored, pickedUp, remaining, rate, completedChannels, shippingChannels, total: valid.length }
}

/** 货物动态分布：运输中 = 已发运 - 仓储堆存 - 已提货出关 */
export function buildCargoDistribution(cargoTotal: number, stats: ReturnType<typeof buildShippingStats>) {
  const unshipped = Math.max(0, stats.planned - stats.shipped)
  const inTransit = Math.max(0, stats.shipped - stats.stored - stats.pickedUp)
  return {
    total: cargoTotal,
    unshipped,
    inTransit,
    stored: stats.stored,
    pickedUp: stats.pickedUp,
    unshippedPct: cargoTotal > 0 ? pct(unshipped, cargoTotal) : 0,
    inTransitPct: cargoTotal > 0 ? pct(inTransit, cargoTotal) : 0,
    storedPct: cargoTotal > 0 ? pct(stats.stored, cargoTotal) : 0,
    pickedUpPct: cargoTotal > 0 ? pct(stats.pickedUp, cargoTotal) : 0,
    shippedPct: cargoTotal > 0 ? pct(stats.shipped, cargoTotal) : 0,
  }
}
