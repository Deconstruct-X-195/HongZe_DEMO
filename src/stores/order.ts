import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  listOrders,
  getOrder,
  upsertOrder,
  deleteOrder,
  updateOrderStatus,
  genOrderId,
  getPort,
  upsertPort,
  listCapacities,
  upsertCapacities,
  getPlan,
  upsertPlan,
  newCapacityId,
  getChannelDetail,
  listChannelDetails,
  upsertChannelDetails,
  emptyLoading,
  emptyPostLeg,
  emptyFinancial,
  getFinancial,
  upsertFinancial,
  listShippings,
  upsertShippings,
  listMilestones,
  upsertMilestones,
  newMilestoneId,
  listLogs,
  addLog,
  newLogId,
} from '@/lib/storage'
import { STATUS_FLOW, migrateStatus } from '@/types'
import type {
  Order,
  PortInfo,
  Capacity,
  TransportPlan,
  ChannelDetail,
  TransitChannelType,
  OrderStatus,
  FinancialInfo,
  ChannelShipping,
  CargoMilestone,
  OperationLog,
  OperatorRole,
  Voucher,
} from '@/types'

/**
 * 订单业务 store —— 组件唯一数据入口。
 *
 * 当前实现委托给 @/lib/storage（localStorage）。
 * 后期接入后端时，仅需在 storage.ts 内替换为 fetch 调用，
 * 或在此处按 import.meta.env.VITE_STORAGE 切换实现，组件无需改动。
 */
export const useOrderStore = defineStore('order', () => {
  /** 订单列表（首页用，响应式） */
  const orders = ref<Order[]>(listOrders())

  function refresh() {
    orders.value = listOrders()
  }

  function getById(id: string): Order | undefined {
    const o = getOrder(id)
    return o ? { ...o, status: migrateStatus(o.status) } : undefined
  }

  function saveOrder(order: Order) {
    upsertOrder(order)
    refresh()
  }

  function removeOrder(id: string) {
    deleteOrder(id)
    refresh()
  }

  function setStatus(id: string, status: OrderStatus) {
    updateOrderStatus(id, status)
    refresh()
  }

  function generateId(): string {
    return genOrderId()
  }

  /* ---------- 港口 ---------- */
  function portOf(orderId: string): PortInfo | undefined {
    return getPort(orderId)
  }
  function savePort(port: PortInfo) {
    upsertPort(port)
  }

  /* ---------- 运力 ---------- */
  function capacitiesOf(orderId: string): Capacity[] {
    return listCapacities(orderId)
  }
  function saveCapacities(orderId: string, items: Capacity[]) {
    upsertCapacities(orderId, items)
  }
  function genCapacityId() {
    return newCapacityId()
  }

  /* ---------- 方案 ---------- */
  function planOf(orderId: string): TransportPlan | undefined {
    return getPlan(orderId)
  }
  function savePlan(plan: TransportPlan) {
    upsertPlan(plan)
  }

  /* ---------- 通道详情（公铁联运中转装卸 + 后程公路） ---------- */
  function channelDetailOf(
    orderId: string,
    channelType: TransitChannelType,
  ): ChannelDetail | undefined {
    return getChannelDetail(orderId, channelType)
  }
  function channelDetailsOf(orderId: string): ChannelDetail[] {
    return listChannelDetails(orderId)
  }
  function saveChannelDetails(orderId: string, items: ChannelDetail[]) {
    upsertChannelDetails(orderId, items)
  }
  function buildEmptyDetail(orderId: string, channelType: TransitChannelType): ChannelDetail {
    return {
      orderId,
      channelType,
      loading: emptyLoading(),
      postLeg: emptyPostLeg(),
      updatedAt: new Date().toISOString(),
    }
  }

  /* ==================== 业务流转 ==================== */

  /* ---------- 财务信息 ---------- */
  function financialOf(orderId: string): FinancialInfo {
    return getFinancial(orderId) ?? emptyFinancial(orderId)
  }
  function saveFinancial(info: FinancialInfo) {
    upsertFinancial({ ...info, updatedAt: new Date().toISOString() })
  }

  /* ---------- 运输通道发运信息 ---------- */
  function shippingsOf(orderId: string): ChannelShipping[] {
    return listShippings(orderId)
  }
  function saveShippings(orderId: string, items: ChannelShipping[]) {
    upsertShippings(orderId, items)
  }
  /** 根据运力通道初始化发运信息（若不存在），并迁移旧数据缺失字段 */
  function ensureShippings(orderId: string, capacities: Capacity[]): ChannelShipping[] {
    const existing = listShippings(orderId)
    const result: ChannelShipping[] = capacities.map((c) => {
      const found = existing.find((s) => s.capacityId === c.id)
      if (found) {
        // 旧数据迁移：补全新字段
        return {
          ...found,
          storedQty: found.storedQty ?? 0,
          pickedUpQty: found.pickedUpQty ?? 0,
        }
      }
      return {
        capacityId: c.id,
        orderId,
        channelType: c.channelType,
        plannedQty: c.plannedQty ?? 0,
        shippedQty: 0,
        storedQty: 0,
        pickedUpQty: 0,
        state: 'not_started',
        planDate: '',
        actualDate: '',
        vouchers: [],
        remark: '',
        updatedAt: new Date().toISOString(),
      }
    })
    upsertShippings(orderId, result)
    return result
  }

  /* ---------- 货物动态节点 ---------- */
  function milestonesOf(orderId: string): CargoMilestone[] {
    return listMilestones(orderId)
  }
  function saveMilestones(orderId: string, items: CargoMilestone[]) {
    upsertMilestones(orderId, items)
  }
  function genMilestoneId() {
    return newMilestoneId()
  }

  /* ---------- 操作日志 ---------- */
  function logsOf(orderId: string): OperationLog[] {
    return listLogs(orderId)
  }
  function addOperationLog(
    orderId: string,
    operator: string,
    role: OperatorRole,
    action: string,
    opts: { fromStatus?: OrderStatus; toStatus?: OrderStatus; remark?: string } = {},
  ) {
    const log: OperationLog = {
      id: newLogId(),
      orderId,
      operator,
      role,
      action,
      fromStatus: opts.fromStatus,
      toStatus: opts.toStatus,
      remark: opts.remark,
      createdAt: new Date().toISOString(),
    }
    addLog(log)
  }

  /* ---------- 状态流转（带日志记录） ---------- */
  /**
   * 校验状态转换是否合法（基于 STATUS_FLOW 规则）。
   * 管理员角色可跳过校验。
   */
  function canTransition(from: OrderStatus, to: OrderStatus, isAdmin = false): boolean {
    const f = migrateStatus(from)
    if (!f) return true
    if (isAdmin) return true
    const allowed = STATUS_FLOW[f] ?? []
    return allowed.includes(to as any)
  }

  /**
   * 执行状态流转：更新订单状态并记录操作日志。
   * @returns 是否成功
   */
  function transitionStatus(
    orderId: string,
    to: OrderStatus,
    operator: string,
    role: OperatorRole,
    remark = '',
  ): boolean {
    const order = getOrder(orderId)
    if (!order) return false
    const from = migrateStatus(order.status)
    const isAdmin = role === 'admin'
    if (!canTransition(from, to, isAdmin)) {
      console.warn(`非法状态流转：${from} → ${to}`)
      return false
    }
    const actionLabel = `状态变更：${from ? STATUS_LABEL(from) : '初始'} → ${STATUS_LABEL(to)}`
    updateOrderStatus(orderId, to)
    addOperationLog(orderId, operator, role, actionLabel, { fromStatus: from, toStatus: to, remark })
    refresh()
    return true
  }

  /* ---------- 凭证管理 ---------- */
  function addVoucher(
    target: { vouchers: Voucher[] },
    voucher: Omit<Voucher, 'id' | 'uploadedAt'>,
  ) {
    target.vouchers.push({
      ...voucher,
      id: `vch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      uploadedAt: new Date().toISOString(),
    })
  }
  function removeVoucher(target: { vouchers: Voucher[] }, id: string) {
    const idx = target.vouchers.findIndex((v) => v.id === id)
    if (idx >= 0) target.vouchers.splice(idx, 1)
  }

  return {
    orders,
    refresh,
    getById,
    saveOrder,
    removeOrder,
    setStatus,
    generateId,
    portOf,
    savePort,
    capacitiesOf,
    saveCapacities,
    genCapacityId,
    planOf,
    savePlan,
    channelDetailOf,
    channelDetailsOf,
    saveChannelDetails,
    buildEmptyDetail,
    // 业务流转
    financialOf,
    saveFinancial,
    shippingsOf,
    saveShippings,
    ensureShippings,
    milestonesOf,
    saveMilestones,
    genMilestoneId,
    logsOf,
    addOperationLog,
    canTransition,
    transitionStatus,
    addVoucher,
    removeVoucher,
  }
})

/** 状态中文标签（避免循环依赖 STATUS_META） */
function STATUS_LABEL(s: OrderStatus): string {
  const map: Record<string, string> = {
    draft: '录入中',
    port: '待港口',
    capacity: '待运力',
    plan: '待方案',
    pending_confirm: '待确认',
    confirmed: '订单已确认',
    shipping: '发运中',
    shipped: '发运完成',
    completed: '已完成',
  }
  return s ? (map[s] ?? s) : '初始'
}
