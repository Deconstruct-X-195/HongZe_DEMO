// 数据模型定义

/** 终端客户（每个客户独立记录，含各自销售数量） */
export interface TerminalCustomer {
  id: string
  name: string // 终端钢厂名称
  qty: number // 销售数量（吨）
}

/** 订单状态 */
export type OrderStatus =
  | 'draft' // 录入中（仅订单）
  | 'port' // 待港口
  | 'capacity' // 待运力
  | 'plan' // 待方案
  | 'pending_confirm' // 待确认（方案已生成，待财务确认收款）
  | 'confirmed' // 订单已确认（财务已确认收款）
  | 'shipping' // 发运中
  | 'shipped' // 发运完成
  | 'completed' // 已完成
  | undefined

/** 旧状态 'done' 迁移到新状态 'pending_confirm' */
export function migrateStatus(s: OrderStatus | string | undefined): OrderStatus {
  if (s === 'done' as any) return 'pending_confirm'
  return s as OrderStatus
}

/** 订单信息 */
export interface Order {
  id: string // 订单编号（主键）
  // 客户信息
  trader: string // 上游贸易商（客户）
  traderContact?: string // 联系人
  traderContactInfo?: string // 联系方式
  // 货物信息
  cargoName: string // 货物名称
  cargoTotal: number // 货物总量（吨）
  cargoPrice: number // 货物单价
  cargoQuality: string // 货物品质
  mine: string // 来源矿山
  // 运输信息
  vessel: string // 运输船舶
  loadingStart: string // 装船开始时间
  departure: string // 起运时间
  destPort: string // 预计到达港口
  draftMark: number // 上传时水尺数
  // 终端客户（支持多个，每个含独立销售数量）
  customers: TerminalCustomer[]
  // 元数据
  createdAt: string
  updatedAt: string
  status: OrderStatus
}

/** 港口信息 */
export interface PortInfo {
  orderId: string // 关联订单编号
  portName: string // 港口名称（联动订单预计到达港口）
  congestion: 'normal' | 'mild' | 'severe' // 拥堵情况
  efficiency: string // 装卸效率
  wharf: string // 码头
  berth: string // 泊位
  yard: string // 堆场
  waitHours: number // 等待时间（小时）
  updatedAt: string
}

/** 通道类型 */
export type ChannelType =
  | 'rail_direct' // 铁路直达
  | 'rail_caozhuang' // 公铁联运-曹庄镇站（旧数据兼容）
  | 'rail_xingtai' // 公铁联运-邢台南站（旧数据兼容）
  | 'rail_transit' // 公铁联运（动态，中转节点通过 transfer 字段区分）
  | 'road' // 公路直达

/** 运力信息（单条通道） */
export interface Capacity {
  id: string
  orderId: string
  channelType: ChannelType
  origin: string // 起点
  transfer?: string // 中转站
  destination: string // 终点
  idleCapacity: number // 运力（吨/天）
  plannedQty: number // 计划运输货物量（吨）
  price: number // 单位运输价格（元/吨）
  leadTime: number // 运输时效（天，自动计算：plannedQty / idleCapacity）
  carrier?: string // 铁路承运商
  roadCarrier?: string // 公路承运商（公铁联运专用）
  updatedAt: string
}

/** 运输方案批次 */
export interface PlanBatch {
  batchNo: number // 批次
  qty: number // 运量（吨）
  channelType: ChannelType // 通道
  leadTime: number // 时效（天）
  price: number // 运价（元/吨）
  remark?: string
}

/** 需要中转详情的公铁联运通道类型 */
export type TransitChannelType = 'rail_caozhuang' | 'rail_xingtai' | 'rail_transit'

/** 中转节点装卸能力信息（仅公铁联运通道） */
export interface TransitLoading {
  equipmentType: string // 装卸设备类型，如：龙门吊、抓斗起重机
  maxCapacityPerHour: number // 最大装卸量（吨/小时）
  workWindow: string // 作业时间窗口，如：08:00-18:00
  operatorConfig: string // 操作人员配置，如：3 班 × 5 人
  remark?: string // 备注
}

/** 后程公路短途运输信息（仅公铁联运通道，中转站→终端钢厂） */
export interface PostLegRoad {
  vehicleType: string // 运输车辆类型，如：13 米半挂车
  idleCapacity: number // 闲置运量（吨/天）
  etaHours: number // 预计耗时（小时）
  cost: number // 运输成本（元/吨）
  carrier: string // 承运商信息
  remark?: string // 备注
}

/** 通道详细信息（公铁联运专用，1:1 关联 Capacity） */
export interface ChannelDetail {
  orderId: string
  channelType: TransitChannelType
  loading: TransitLoading
  postLeg: PostLegRoad
  updatedAt: string
}

/* ==================== 业务流转：财务 / 发运 / 货物动态 / 操作日志 ==================== */

/** 凭证（财务凭证 / 发运凭证统一结构） */
export interface Voucher {
  id: string
  name: string // 凭证名称
  type: string // 凭证类型：发票/收据/请车计划/运单/其他
  fileName?: string // 文件名（仅记录，不实际存储文件内容）
  fileSize?: number // 文件大小（字节）
  uploadedBy: string // 上传人
  uploadedAt: string // 上传时间
  note?: string // 备注
}

/** 收款状态 */
export type PaymentStatus = 'unpaid' | 'partial' | 'paid'
/** 发票/收据状态 */
export type InvoiceStatus = 'none' | 'issued' | 'delivered'

/** 财务信息（每订单 1 条） */
export interface FinancialInfo {
  orderId: string
  paymentStatus: PaymentStatus // 收款状态
  totalAmount: number // 总金额（元）
  receivedAmount: number // 已收金额（元）
  invoiceStatus: InvoiceStatus // 发票/收据状态
  vouchers: Voucher[] // 相关财务凭证
  remark?: string
  updatedAt: string
}

/** 发运状态（单条运输通道） */
export type ShippingState = 'not_started' | 'shipping' | 'completed'

/** 运输通道发运信息（与 Capacity 1:1 关联） */
export interface ChannelShipping {
  capacityId: string // 关联运力通道 id
  orderId: string
  channelType: ChannelType
  plannedQty: number // 通道总货物量（吨）
  shippedQty: number // 已发运量（吨）
  storedQty: number // 仓储堆存量（吨，已到站/堆场未提走）
  pickedUpQty: number // 客户已提货出关量（吨）
  state: ShippingState // 发运状态
  planDate: string // 计划发运时间
  actualDate: string // 实际发运时间
  vouchers: Voucher[] // 发运凭证（请车计划等）
  remark?: string
  updatedAt: string
}

/** 通道大类分组（用于按运输方式聚合展示） */
export type ChannelGroup = 'rail_direct' | 'rail_transit' | 'road'

/** 通道大类元数据 */
export const CHANNEL_GROUP_META: Record<
  ChannelGroup,
  { label: string; short: string; color: string; icon: string }
> = {
  rail_direct: { label: '铁路直达', short: '铁路直达', color: '#0071e3', icon: 'train' },
  rail_transit: { label: '公铁联运', short: '公铁联运', color: '#af52de', icon: 'route' },
  road: { label: '公路直达', short: '公路直达', color: '#34c759', icon: 'truck' },
}

/** 将通道类型映射到通道大类 */
export function toChannelGroup(t: ChannelType): ChannelGroup {
  if (t === 'rail_direct') return 'rail_direct'
  if (t === 'road') return 'road'
  return 'rail_transit' // rail_caozhuang / rail_xingtai / rail_transit
}

/** 货物动态节点状态 */
export type MilestoneState = 'pending' | 'in_progress' | 'completed' | 'exception'

/** 货物动态节点（运输环节时间轴） */
export interface CargoMilestone {
  id: string
  orderId: string
  capacityId?: string // 关联运输通道（可选）
  channelType?: ChannelType
  stage: string // 环节名称，如：装船、到港、铁路发运、到站交付
  state: MilestoneState
  plannedTime: string // 计划时间
  actualTime: string // 实际时间
  hasException: boolean // 是否异常
  exceptionNote?: string // 异常处理记录
  remark?: string
  updatedAt: string
}

/** 操作角色 */
export type OperatorRole = 'sales' | 'port' | 'capacity' | 'finance' | 'transport' | 'admin'

/** 操作日志 */
export interface OperationLog {
  id: string
  orderId: string
  operator: string // 操作人员
  role: OperatorRole // 角色
  action: string // 操作描述
  fromStatus?: OrderStatus // 变更前状态
  toStatus?: OrderStatus // 变更后状态
  remark?: string
  createdAt: string
}

/** 角色元数据 */
export const ROLE_META: Record<OperatorRole, { label: string; color: string }> = {
  sales: { label: '业务员', color: '#0071e3' },
  port: { label: '港口专员', color: '#ff9500' },
  capacity: { label: '运力专员', color: '#af52de' },
  finance: { label: '财务人员', color: '#34c759' },
  transport: { label: '运输人员', color: '#5856d6' },
  admin: { label: '管理员', color: '#8e8e93' },
}

/** 判断通道是否为公铁联运（需要中转详情） */
export function isTransitChannel(c: ChannelType): c is TransitChannelType {
  return c === 'rail_caozhuang' || c === 'rail_xingtai' || c === 'rail_transit'
}

/** 装卸设备类型选项 */
export const EQUIPMENT_OPTIONS = [
  '龙门吊',
  '抓斗起重机',
  '门座起重机',
  '装载机',
  '带式输送机',
  '其他',
]

/** 后程公路车辆类型选项 */
export const VEHICLE_OPTIONS = [
  '13 米半挂车',
  '17.5 米平板车',
  '9.6 米厢式车',
  '自卸车',
  '集装箱拖车',
  '其他',
]

/** 铁路运输承运商选项 */
export const RAIL_CARRIERS = ['中铁快运', '国铁供应链', '国铁集团']

/** 公路运输承运商选项 */
export const ROAD_CARRIERS = ['万合集团', '河北陆港']

/** 来源矿山选项（下拉） */
export const MINE_OPTIONS = ['力拓', 'BHP 必和必拓', '淡水河谷', 'FMG', '其他']

/** 铁矿石细分品类选项（下拉） */
export const CARGO_CATEGORIES = [
  'PB粉',
  '麦克粉',
  '超特粉',
  '纽曼粉',
  '卡粉',
  '金布巴粉',
  '杨迪粉',
  '罗布河粉',
  '混合粉',
  '块矿',
  '球团',
]

/** 公铁联运中转节点选项 */
export const TRANSFER_OPTIONS = ['邢台南站', '曹庄镇站']

/** 铁路站点选项（邯郸/黄骅地区） */
export const RAIL_STATION_OPTIONS = [
  '黄骅站',
  '渤海东站',
  '邯郸站',
  '武安站',
  '沙河站',
  '邢台南站',
  '曹庄镇站',
  '邢台站',
  '衡水站',
  '石家庄站',
]

/** 公路站点选项（邯郸/黄骅地区） */
export const ROAD_LOCATION_OPTIONS = [
  '黄骅港',
  '黄骅港20万吨码头',
  '武安保税物流园',
  '邯郸钢铁集团',
  '邯钢新区',
  '新兴铸管',
  '天铁集团',
  '普阳钢铁',
  '冀南钢铁',
  '河北普阳',
  '新金钢铁',
  '邯郸华信',
]

/** 矿石贸易商选项（客户下拉） */
export const TRADER_OPTIONS = [
  '中矿国链',
  '四川云贸',
  '厦门象屿',
  '五矿发展',
  '中钢集团',
  '建发集团',
  '物产中大',
  '河北物流',
  '浙商中拓',
  '厦门国贸',
]

/** 运输方案 */
export interface TransportPlan {
  orderId: string
  batches: PlanBatch[]
  updatedAt: string
}

/** 通道显示元数据 */
export const CHANNEL_META: Record<
  ChannelType,
  { label: string; short: string; transfer?: string; color: string }
> = {
  rail_direct: { label: '铁路直达', short: '铁路直达', color: '#0071e3' },
  rail_caozhuang: { label: '公铁联运（曹庄镇站中转）', short: '公铁联运·曹庄镇', transfer: '曹庄镇站', color: '#af52de' },
  rail_xingtai: { label: '公铁联运（邢台南站中转）', short: '公铁联运·邢台南', transfer: '邢台南站', color: '#ff9500' },
  rail_transit: { label: '公铁联运', short: '公铁联运', color: '#af52de' },
  road: { label: '公路直达', short: '公路直达', color: '#34c759' },
}

export const STATUS_META: Record<
  NonNullable<OrderStatus>,
  { label: string; color: string; bg: string; phase: 'create' | 'business' | 'final' }
> = {
  draft: { label: '录入中', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)', phase: 'create' },
  port: { label: '待港口', color: '#0071e3', bg: 'rgba(0,113,227,0.12)', phase: 'create' },
  capacity: { label: '待运力', color: '#ff9500', bg: 'rgba(255,149,0,0.12)', phase: 'create' },
  plan: { label: '待方案', color: '#af52de', bg: 'rgba(175,82,222,0.12)', phase: 'create' },
  pending_confirm: { label: '待确认', color: '#ff9500', bg: 'rgba(255,149,0,0.12)', phase: 'business' },
  confirmed: { label: '订单已确认', color: '#0071e3', bg: 'rgba(0,113,227,0.12)', phase: 'business' },
  shipping: { label: '发运中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)', phase: 'business' },
  shipped: { label: '发运完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)', phase: 'business' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)', phase: 'final' },
}

/**
 * 订单状态流转规则：键 = 当前状态，值 = 可流转到的下一状态集合。
 * - 创建阶段：draft → port → capacity → plan → pending_confirm
 * - 业务阶段：pending_confirm → confirmed（财务确认收款）→ shipping（运输上传凭证）→ shipped → completed
 */
export const STATUS_FLOW: Record<NonNullable<OrderStatus>, NonNullable<OrderStatus>[]> = {
  draft: ['port'],
  port: ['capacity'],
  capacity: ['plan'],
  plan: ['pending_confirm'],
  pending_confirm: ['confirmed'],
  confirmed: ['shipping'],
  shipping: ['shipped'],
  shipped: ['completed'],
  completed: [],
}

/** 收款状态元数据 */
export const PAYMENT_META: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  unpaid: { label: '未收款', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
  partial: { label: '部分收款', color: '#ff9500', bg: 'rgba(255,149,0,0.12)' },
  paid: { label: '已全额收款', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}

/** 发票状态元数据 */
export const INVOICE_META: Record<InvoiceStatus, { label: string; color: string; bg: string }> = {
  none: { label: '未开具', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  issued: { label: '已开具', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  delivered: { label: '已交付', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}

/** 发运状态元数据 */
export const SHIPPING_META: Record<ShippingState, { label: string; color: string; bg: string }> = {
  not_started: { label: '未开始', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  shipping: { label: '发运中', color: '#5856d6', bg: 'rgba(88,86,214,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
}

/** 货物动态节点状态元数据 */
export const MILESTONE_META: Record<MilestoneState, { label: string; color: string; bg: string }> = {
  pending: { label: '待处理', color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  in_progress: { label: '进行中', color: '#0071e3', bg: 'rgba(0,113,227,0.12)' },
  completed: { label: '已完成', color: '#34c759', bg: 'rgba(52,199,89,0.12)' },
  exception: { label: '异常', color: '#ff3b30', bg: 'rgba(255,59,48,0.12)' },
}

/** 凭证类型选项 */
export const VOUCHER_TYPES = ['发票', '收据', '请车计划', '运单', '装箱单', '其他']

/* ---------- 终端客户辅助函数 ---------- */

/** 终端客户名称展示（以"、"连接） */
export function customersDisplay(customers: TerminalCustomer[] | undefined): string {
  if (!customers || customers.length === 0) return ''
  return customers
    .map((c) => c.name)
    .filter(Boolean)
    .join('、')
}

/** 终端客户销售数量合计 */
export function customersTotalQty(customers: TerminalCustomer[] | undefined): number {
  if (!customers || customers.length === 0) return 0
  return customers.reduce((s, c) => s + (c.qty || 0), 0)
}
