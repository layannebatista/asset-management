import type { AssetStatus } from '../../../types'

export const assetRules = {
  canAssign: (status: AssetStatus) => status === 'AVAILABLE',

  canUnassign: (status: AssetStatus) => status === 'ASSIGNED',

  canTransfer: (status: AssetStatus) => status === 'AVAILABLE',

  canMaintain: (status: AssetStatus) =>
    (['AVAILABLE', 'ASSIGNED'] as AssetStatus[]).includes(status),

  canRetire: (status: AssetStatus) => status !== 'RETIRED',
}