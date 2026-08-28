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
