import type { MaintenanceResponse, AssetResponse } from '../../../types'
import { INPUT_CLS, formatCode, formatCurrencyInput, resolveAssetLabel } from '../../../shared'

interface CompleteMaintenanceModalProps {
  maintenance: MaintenanceResponse | null
  onClose: () => void
  assets: AssetResponse[]
  form: { resolution: string; actualCost: string }
  setForm: React.Dispatch<React.SetStateAction<{ resolution: string; actualCost: string }>>
  resolveError: string
  setResolveError: (v: string) => void
  onConfirm: () => void
  saving: boolean
  actionError: string
}

export function CompleteMaintenanceModal({
  maintenance,
  onClose,
  assets,
  form,
  setForm,
  resolveError,
  setResolveError,
  onConfirm,
  saving,
  actionError,
}: CompleteMaintenanceModalProps) {
  if (!maintenance) return null

  return (
    <div
      data-testid="complete-maintenance-modal"
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
        <div className="flex justify-between items-center px-6 pt-5 pb-0">
          <h2 className="text-[17px] font-bold">Concluir Manutenção</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-[14px]">
          {actionError && (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700">
              {actionError}
            </div>
          )}

          <div className="bg-slate-50 rounded-[8px] p-3 text-[12.5px] text-slate-600 border border-slate-200">
            Ordem: <strong>{formatCode('MNT', maintenance.id)}</strong> —{' '}
            {resolveAssetLabel(maintenance.assetId, assets)}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Resolução *
            </label>

            <textarea
              data-testid="complete-maintenance-resolution-input"
              rows={4}
              value={form.resolution}
              onChange={(e) => {
                setForm((f) => ({ ...f, resolution: e.target.value }))
                setResolveError('')
              }}
              maxLength={2000}
              className={`${INPUT_CLS} resize-none ${resolveError ? 'border-red-400' : ''}`}
              placeholder="Descreva como o problema foi resolvido (mín. 10 caracteres)..."
            />

            <div className="flex justify-between mt-1">
              {resolveError ? (
                <p className="text-[11.5px] text-red-500">{resolveError}</p>
              ) : (
                <span />
              )}
              <p className="text-[11px] text-slate-400">
                {form.resolution.length}/2000
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Custo Real (R$)
            </label>

            <input
              data-testid="complete-maintenance-cost-input"
              inputMode="numeric"
              value={form.actualCost}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  actualCost: formatCurrencyInput(e.target.value),
                }))
              }
              className={INPUT_CLS}
              placeholder="0,00"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              data-testid="complete-maintenance-cancel-btn"
              onClick={onClose}
              className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              data-testid="complete-maintenance-confirm-btn"
              onClick={onConfirm}
              disabled={saving || !form.resolution.trim()}
              className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Concluir'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}