import { useState, useCallback } from 'react'
import { assetService } from '../services/assetService'
import type { AssetResponse, Page } from '../../../types'
import type { AssetListParams, CreateAssetPayload, TransferPayload, MaintenancePayload } from '../types/assetTypes'

export function useAssets() {
  const [page, setPage] = useState<Page<AssetResponse> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async (params: AssetListParams) => {
    setLoading(true)
    setError('')
    try {
      const res = await assetService.list(params)
      setPage(res ?? null)
    } catch (e: unknown) {
      const errorObj = e as { response?: { data?: { message?: string } } }
      setError(errorObj?.response?.data?.message ?? 'Erro ao carregar ativos')
    } finally {
      setLoading(false)
    }
  }, [])

  const create = async (orgId: number, data: CreateAssetPayload) => {
    return assetService.create(orgId, data)
  }

  const assign = async (assetId: number, userId: number) => {
    return assetService.assign(assetId, userId)
  }

  const unassign = async (assetId: number) => {
    return assetService.unassign(assetId)
  }

  const transfer = async (data: TransferPayload) => {
    return assetService.transfer(data)
  }

  const maintenance = async (data: MaintenancePayload) => {
    return assetService.maintenance(data)
  }

  const retire = async (assetId: number) => {
    return assetService.retire(assetId)
  }

  return {
    page,
    loading,
    error,
    load,
    create,
    assign,
    unassign,
    transfer,
    maintenance,
    retire,
  }
}