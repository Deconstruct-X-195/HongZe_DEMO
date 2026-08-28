// 订单相关 API 接口契约
// 后端接入时实现，当前为占位
// 参考实现见文件末尾注释

export const orderApi = {}

/*
import type { Order, OrderStatus } from '@/types'
import type { ApiResponse, ApiListResponse } from './types'
import { get, post, put, del } from './request'

export const orderApi = {
  list: (params?: { page?: number; pageSize?: number; status?: OrderStatus }) =>
    get<ApiListResponse<Order>>('/orders', params),
  get: (id: string) =>
    get<ApiResponse<Order>>(`/orders/${id}`),
  create: (data: Partial<Order>) =>
    post<ApiResponse<Order>>('/orders', data),
  update: (id: string, data: Partial<Order>) =>
    put<ApiResponse<Order>>(`/orders/${id}`, data),
  remove: (id: string) =>
    del<ApiResponse<void>>(`/orders/${id}`),
  updateStatus: (id: string, status: OrderStatus) =>
    put<ApiResponse<void>>(`/orders/${id}/status`, { status }),
}
*/
