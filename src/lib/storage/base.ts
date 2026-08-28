// 数据访问层基础工具：KEYS 常量、read/write 基础函数、通用 ID 生成

export const KEYS = {
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

export function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

export function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}
