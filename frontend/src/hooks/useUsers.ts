import { useState, useCallback, useRef } from 'react'
import { userApi } from '../api'
import type { UserResponse, Page } from '../types'

export function useUsers() {
  const [page, setPage] = useState<Page<UserResponse> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeCount, setActiveCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  const loadingRef = useRef(false)

  const load = useCallback(async (currentPage: number) => {
    if (loadingRef.current) return

    loadingRef.current = true
    setLoading(true)
    setError('')

    try {
      const [p, active, pending] = await Promise.all([
        userApi.list({ page: currentPage, size: 20, sort: 'id,desc' }),
        userApi.list({ size: 1, status: 'ACTIVE' }),
        userApi.list({ size: 1, status: 'PENDING_ACTIVATION' }),
      ])

      setPage(p)
      setActiveCount(active?.totalElements ?? 0)
      setPendingCount(pending?.totalElements ?? 0)
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao carregar usuários'
      )
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  return {
    page,
    loading,
    error,
    activeCount,
    pendingCount,
    load,
  }
}