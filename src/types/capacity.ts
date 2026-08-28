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

/** 判断通道是否为公铁联运（需要中转详情） */
export function isTransitChannel(c: ChannelType): c is TransitChannelType {
  return c === 'rail_caozhuang' || c === 'rail_xingtai' || c === 'rail_transit'
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
