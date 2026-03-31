import type { AssetType, AssetStatus } from '../../../types'

// ─── Payloads (entrada da API) ───────────────────────────────────────────────

export interface CreateAssetPayload {
  type: AssetType
  model: string
  unitId: number
}

export interface TransferPayload {
  assetId: number
  toUnitId: number
  reason: string
}

export interface MaintenancePayload {
  assetId: number
  description: string
}

// ─── Parâmetros de listagem (query) ─────────────────────────────────────────

export interface AssetListParams {
  page: number
  size: number
  sort?: string
  status?: AssetStatus
  type?: AssetType
  unitId?: number
  assignedUserId?: number
  assetTag?: string
  model?: string
  search?: string
}