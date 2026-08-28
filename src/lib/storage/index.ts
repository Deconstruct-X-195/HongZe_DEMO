// 数据访问层统一导出入口
// 按实体拆分到各子文件，此处统一 re-export，保持现有 import 路径不变

export { KEYS, read, write, genId } from './base'

// 原有实体
export * from './order'
export * from './port'
export * from './capacity'
export * from './plan'
export * from './financial'
export * from './shipping'
export * from './log'

// 新增实体（V2 业务梳理表扩展）
export * from './customer'
export * from './inquiry'
export * from './quote'
export * from './contract'
export * from './payment'
export * from './cost'
export * from './receipt'
export * from './dispatch'
export * from './transport'
export * from './inbound'
export * from './inventory'
export * from './outbound'
export * from './settlement'
