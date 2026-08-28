// API 响应类型定义

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface ApiListResponse<T = any> {
  code: number
  message: string
  data: {
    list: T[]
    total: number
    page: number
    pageSize: number
  }
}

export interface ApiError {
  code: number
  message: string
  data?: any
}
