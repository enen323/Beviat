import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'
import { message } from 'antd'
import { useUserStore } from '@/stores/user'

const request: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config) => {
    const { token } = useUserStore.getState()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { data } = response
    if (data.code === 200 || data.code === 0) {
      return data.data
    } else {
      const msg = data.message || '请求失败'
      if (data.code === 401) {
        useUserStore.getState().logout()
        if (!window.location.pathname.includes('/auth/login')) {
          window.location.href = '/auth/login'
        }
        return Promise.reject(new Error(msg))
      }
      message.error(msg)
      return Promise.reject(new Error(msg))
    }
  },
  (error: AxiosError) => {
    const status = error.response?.status
    let msg = '网络错误，请稍后重试'

    if (status === 401) {
      msg = '登录已过期，请重新登录'
      useUserStore.getState().logout()
      window.location.href = '/auth/login'
    } else if (status === 403) {
      msg = '没有权限访问'
    } else if (status === 404) {
      msg = '请求资源不存在'
    } else if (status === 500) {
      msg = '服务器错误'
    }

    message.error(msg)
    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageResponse<T = any> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.get(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  if (data instanceof FormData) {
    const { headers, ...rest } = config || {}
    const { 'Content-Type': _, ...restHeaders } = headers || {} as any
    return request.post(url, data, { ...rest, headers: restHeaders })
  }
  return request.post(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  if (data instanceof FormData) {
    const { headers, ...rest } = config || {}
    const { 'Content-Type': _, ...restHeaders } = headers || {} as any
    return request.put(url, data, { ...rest, headers: restHeaders })
  }
  return request.put(url, data, config)
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return request.delete(url, config)
}

export default request
