// HTTP 请求工具封装
// 后端接入时使用，当前 localStorage 模式下不调用

const BASE_URL = import.meta.env.VITE_API_BASE || '/api'

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
  const res = await fetch(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json()
}

export function get<T>(url: string, params?: Record<string, any>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : ''
  return request<T>(`${url}${query}`, { method: 'GET' })
}

export function post<T>(url: string, data?: any) {
  return request<T>(url, { method: 'POST', body: JSON.stringify(data) })
}

export function put<T>(url: string, data?: any) {
  return request<T>(url, { method: 'PUT', body: JSON.stringify(data) })
}

export function del<T>(url: string) {
  return request<T>(url, { method: 'DELETE' })
}
