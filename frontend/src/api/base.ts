import api from './axios'
import type { AxiosRequestConfig } from 'axios'

export const apiService = {
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const res = await api.get<T>(url, config)
    return res.data
  },

  post: async <T = unknown>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const res = await api.post<T>(url, body, config)
    return res.data
  },

  patch: async <T = unknown>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const res = await api.patch<T>(url, body, config)
    return res.data
  },

  put: async <T = unknown>(
    url: string,
    body?: unknown,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const res = await api.put<T>(url, body, config)
    return res.data
  },

  delete: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const res = await api.delete<T>(url, config)
    return res.data
  },
}