import type { AssetResponseExtended } from '../AssetDetailsPage'

interface AssetActionBarProps {
  asset: AssetResponseExtended
  isAdmin: boolean
  isGestor: boolean
  actionSaving: boolean
  onAssign: () => void
  onUnassign: () => void
  onRetire: () => void
  onTransfer: () => void
  onMaintenance: () => void
}

const MAINTENANCE_ALLOWED = ['AVAILABLE', 'ASSIGNED'] as Array<AssetResponseExtended['status']>

export function AssetActionBar({
  asset,
  isAdmin,
  isGestor,
  actionSaving,
  onAssign,
  onUnassign,
  onRetire,
  onTransfer,
  onMaintenance,
}: AssetActionBarProps) {
  if ((!isAdmin && !isGestor) || asset.status === 'RETIRED') return null

  const isDisabled = actionSaving
  const btnBase = 'flex items-center gap-[6px] px-4 py-[8px] rounded-[8px] border text-[13px] font-semibold transition disabled:opacity-50'
  const btnNeutral = `${btnBase} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`
  const btnPrimary = `${btnBase} border-blue-600 bg-blue-600 text-white hover:bg-blue-700`
  const btnDanger = `${btnBase} border-red-200 bg-white text-red-600 hover:bg-red-50`

  return (
    <div className="flex gap-2 mb-5 flex-wrap">
      {asset.status === 'AVAILABLE' && (
        <button type="button" onClick={onAssign} disabled={isDisabled} className={btnPrimary}>
          👤 Atribuir usuário
        </button>
      )}

      {asset.status === 'ASSIGNED' && (
        <button type="button" onClick={onUnassign} disabled={isDisabled} className={btnNeutral}>
          🔓 Remover atribuição
        </button>
      )}

      {asset.status === 'AVAILABLE' && (
        <button type="button" onClick={onTransfer} disabled={isDisabled} className={btnNeutral}>
          ↔ Solicitar transferência
        </button>
      )}

      {MAINTENANCE_ALLOWED.includes(asset.status) && (
        <button type="button" onClick={onMaintenance} disabled={isDisabled} className={btnNeutral}>
          🔧 Abrir manutenção
        </button>
      )}

      {(isAdmin || isGestor) && (
        <button type="button" onClick={onRetire} disabled={isDisabled} className={`${btnDanger} ml-auto`}>
          🗑 Aposentar ativo
        </button>
      )}
    </div>
  )
}