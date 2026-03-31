import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import { tokenService } from '../utils/token'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// ── Instances ───────────────────────────────────────────
export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

const apiAuth = axios.create({
  baseURL: API_URL,
})

// ── Types ───────────────────────────────────────────────
type RefreshResponse = {
  accessToken: string
  refreshToken: string
}

type RetryConfig = AxiosRequestConfig & {
  _retry?: boolean
  _retryCount?: number
}

// ── Request interceptor ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = tokenService.getAccess()

  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// ── Refresh control ─────────────────────────────────────
let isRefreshing = false

let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token)
    else reject(error)
  })
  failedQueue = []
}

// ── Response interceptor ────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined

    if (!original) return Promise.reject(error)

    // ── Retry limit (proteção contra loop infinito)
    original._retryCount = original._retryCount ?? 0

    if (original._retryCount >= 2) {
      tokenService.clear()
      window.location.assign('/login')
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers = original.headers ?? {}
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }

      original._retry = true
      original._retryCount += 1
      isRefreshing = true

      const refreshToken = tokenService.getRefresh()

      if (!refreshToken) {
        tokenService.clear()
        window.location.assign('/login')
        return Promise.reject(error)
      }

      // Timeout defensivo (evita fila travada)
      const timeout = setTimeout(() => {
        processQueue(new Error('Refresh timeout'), null)
      }, 10000)

      try {
        const { data } = await apiAuth.post<RefreshResponse>('/auth/refresh', {
          refreshToken,
        })

        tokenService.set(data.accessToken, data.refreshToken)

        processQueue(null, data.accessToken)

        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${data.accessToken}`

        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        tokenService.clear()
        window.location.assign('/login')
        return Promise.reject(refreshError)
      } finally {
        clearTimeout(timeout)
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api