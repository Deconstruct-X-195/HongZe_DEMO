/**
 * 角色权限体系（RBAC）
 * 七类角色：客户 / 业务 / 财务 / 运营 / 供应链管理 / 管理层 / 系统管理员
 * 导航与路由均按 NAV_GROUPS 中的 roles 过滤
 */
import type { IconName } from '@/components/Icon.vue'

/** 系统角色 */
export type Role = 'customer' | 'sales' | 'finance' | 'operations' | 'supply' | 'executive' | 'admin'

export interface RoleMeta {
  key: Role
  label: string
  desc: string
  color: string
  /** 登录后默认进入的页面 */
  defaultPath: string
  icon: IconName
}

export const ROLE_META: Record<Role, RoleMeta> = {
  customer: {
    key: 'customer',
    label: '客户',
    desc: '发起询价、查看报价、跟踪货物运输动态',
    color: '#00c7be',
    defaultPath: '/portal',
    icon: 'user',
  },
  sales: {
    key: 'sales',
    label: '业务人员',
    desc: '客户对接、订单录入、方案编制',
    color: '#4176e6',
    defaultPath: '/',
    icon: 'building',
  },
  finance: {
    key: 'finance',
    label: '财务人员',
    desc: '收款确认、付款管理、成本结算',
    color: '#34c759',
    defaultPath: '/workspace/finance',
    icon: 'dollar',
  },
  operations: {
    key: 'operations',
    label: '运营人员',
    desc: '运输调度、批次发货、仓储管理',
    color: '#ff9500',
    defaultPath: '/workspace/transport',
    icon: 'route',
  },
  supply: {
    key: 'supply',
    label: '供应链管理',
    desc: '全链路监控、进度跟踪、异常协调',
    color: '#af52de',
    defaultPath: '/supply-chain',
    icon: 'layers',
  },
  executive: {
    key: 'executive',
    label: '管理层',
    desc: '经营驾驶舱、全局指标、审批决策',
    color: '#8e8e93',
    defaultPath: '/dashboard',
    icon: 'chart',
  },
  admin: {
    key: 'admin',
    label: '系统管理员',
    desc: '全部权限，系统维护与数据管理',
    color: '#ff3b30',
    defaultPath: '/',
    icon: 'shield',
  },
}

export const ALL_ROLES = Object.keys(ROLE_META) as Role[]

/* ---------- 导航模块 → 角色映射 ---------- */

export interface NavModule {
  name: string
  path: string
  icon: IconName
  /** 可访问角色；'*' 表示全部已登录角色 */
  roles: Role[] | '*'
}

export interface NavGroup {
  label: string
  items: NavModule[]
}

/**
 * 全局导航配置（侧边栏与路由守卫共用）
 * 分组：总览 / 我的岗位 / 业务协作 / 运输执行 / 仓储物流 / 财务结算
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: '总览',
    items: [
      { name: '客户门户', path: '/portal', icon: 'user', roles: ['customer'] },
      { name: '订单工作台', path: '/', icon: 'home', roles: ['sales', 'supply', 'admin'] },
      { name: '物流全景', path: '/flow', icon: 'route', roles: '*' },
      { name: '经营驾驶舱', path: '/dashboard', icon: 'chart', roles: ['executive', 'supply', 'admin'] },
      { name: '供应链监控', path: '/supply-chain', icon: 'layers', roles: ['supply', 'executive', 'admin'] },
    ],
  },
  {
    label: '岗位工作台',
    items: [
      { name: '财务工作台', path: '/workspace/finance', icon: 'dollar', roles: ['finance', 'admin'] },
      { name: '运输工作台', path: '/workspace/transport', icon: 'send', roles: ['operations', 'admin'] },
      { name: '仓储工作台', path: '/workspace/warehouse', icon: 'package', roles: ['operations', 'admin'] },
    ],
  },
  {
    label: '业务协作',
    items: [
      { name: '客户管理', path: '/customers', icon: 'building', roles: ['sales', 'supply', 'admin'] },
      { name: '询价管理', path: '/inquiries', icon: 'search', roles: ['sales', 'supply', 'admin'] },
      { name: '报价撮合', path: '/quotes', icon: 'send', roles: ['sales', 'supply', 'admin'] },
      { name: '合同管理', path: '/contracts', icon: 'clipboard-list', roles: ['sales', 'supply', 'admin'] },
      { name: '接货管理', path: '/receipts', icon: 'package', roles: ['sales', 'supply', 'admin'] },
    ],
  },
  {
    label: '运输执行',
    items: [
      { name: '调度中心', path: '/dispatch', icon: 'route', roles: ['operations', 'supply', 'admin'] },
      { name: '运输跟踪', path: '/transport', icon: 'truck', roles: ['operations', 'supply', 'admin'] },
    ],
  },
  {
    label: '仓储物流',
    items: [
      { name: '仓储入库', path: '/inbound', icon: 'package', roles: ['operations', 'supply', 'admin'] },
      { name: '库存中心', path: '/inventory', icon: 'layers', roles: ['operations', 'supply', 'admin'] },
      { name: '出库中心', path: '/outbound', icon: 'send', roles: ['operations', 'supply', 'admin'] },
    ],
  },
  {
    label: '财务结算',
    items: [
      { name: '成本核算', path: '/costs', icon: 'dollar', roles: ['finance', 'supply', 'admin'] },
      { name: '付款管理', path: '/payments', icon: 'dollar', roles: ['finance', 'supply', 'admin'] },
      { name: '结算中心', path: '/settlement', icon: 'file-text', roles: ['finance', 'supply', 'admin'] },
    ],
  },
]

/** 判断角色是否可访问模块 */
export function canAccessModule(role: Role, m: NavModule): boolean {
  if (m.roles === '*') return true
  return m.roles.includes(role)
}

/** 判断角色是否可访问路径（匹配路由前缀，用于路由守卫） */
export function canAccessPath(role: Role, path: string): boolean {
  // 登录页单独处理
  if (path === '/login') return true
  // 订单档案（详情）对全部角色开放查看；编辑类路由仅业务岗/管理员
  if (path.startsWith('/orders/')) {
    const isEditRoute = path === '/orders/new' || /\/(edit|port|capacity|plan)$/.test(path)
    if (isEditRoute) return role === 'sales' || role === 'admin'
    return true
  }
  // 精确匹配 / 前缀匹配（详情页挂在列表路径下）
  for (const g of NAV_GROUPS) {
    for (const m of g.items) {
      if (path === m.path || path.startsWith(`${m.path}/`)) {
        return canAccessModule(role, m)
      }
    }
  }
  return false
}
