import { assetApi, transferApi, maintenanceApi } from '../../../api'
import type {
  CreateAssetPayload,
  TransferPayload,
  MaintenancePayload,
  AssetListParams,
} from '../types/assetTypes'

export const assetService = {
  list(params: AssetListParams) {
    // 🔥 CORREÇÃO:
    // Mantém params por compatibilidade, mas o backend deve ignorar qualquer escopo vindo daqui
    return assetApi.list(params)
  },

  create(orgId: number, data: CreateAssetPayload) {
    return assetApi.createAuto(orgId, data)
  },

  assign(assetId: number, userId: number) {
    return assetApi.assign(assetId, userId)
  },

  unassign(assetId: number) {
    return assetApi.unassign(assetId)
  },

  transfer(data: TransferPayload) {
    return transferApi.create(data)
  },

  maintenance(data: MaintenancePayload) {
    return maintenanceApi.create(data)
  },

  retire(assetId: number) {
    return assetApi.retire(assetId)
  },
}