import type { AssetResponse } from '../../../types'
import { INPUT_CLS, formatCurrencyInput } from '../../../shared'

interface CreateMaintenanceModalProps {
  open: boolean
  onClose: () => void
  assets: AssetResponse[]
  form: { assetId: string; description: string; estimatedCost: string }
  setForm: React.Dispatch<React.SetStateAction<{ assetId: string; description: string; estimatedCost: string }>>
  descError: string
  setDescError: (v: string) => void
  onConfirm: () => void
  saving: boolean
  actionError: string
}

export function CreateMaintenanceModal({
  open,
  onClose,
  assets,
  form,
  setForm,
  descError,
  setDescError,
  onConfirm,
  saving,
  actionError,
}: CreateMaintenanceModalProps) {
  if (!open) return null

  return (
    <div
      data-testid="create-maintenance-modal"
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
        <div className="flex justify-between items-center px-6 pt-5 pb-0">
          <h2 className="text-[17px] font-bold">Abrir Ordem de Manutenção</h2>
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

          {/* Ativo */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Ativo *
            </label>
            <select
              data-testid="create-maintenance-asset-select"
              value={form.assetId}
              onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))}
              className={INPUT_CLS}
            >
              <option value="">Selecione um ativo...</option>
              {assets
                .filter((a) => ['AVAILABLE', 'ASSIGNED'].includes(a.status))
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.assetTag} — {a.model}
                  </option>
                ))}
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Descrição do problema *{' '}
              <span className="normal-case font-normal">(10–1000 caracteres)</span>
            </label>
            <textarea
              data-testid="create-maintenance-description-input"
              rows={4}
              value={form.description}
              onChange={(e) => {
                setForm((f) => ({ ...f, description: e.target.value }))
                setDescError('')
              }}
              maxLength={1000}
              className={`${INPUT_CLS} resize-none ${descError ? 'border-red-400' : ''}`}
              placeholder="Descreva o problema detalhadamente..."
            />
            <div className="flex justify-between mt-1">
              {descError ? (
                <p className="text-[11.5px] text-red-500">{descError}</p>
              ) : (
                <span />
              )}
              <p className="text-[11px] text-slate-400">{form.description.length}/1000</p>
            </div>
          </div>

          {/* Custo estimado */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Custo estimado{' '}
              <span className="normal-case font-normal text-slate-400">(opcional)</span>
            </label>
            <input
              data-testid="create-maintenance-cost-input"
              inputMode="numeric"
              value={form.estimatedCost}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  estimatedCost: formatCurrencyInput(e.target.value),
                }))
              }
              className={INPUT_CLS}
              placeholder="R$ 0,00"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Informe um valor aproximado para acompanhar o orçamento de manutenção.
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              data-testid="create-maintenance-cancel-btn"
              onClick={onClose}
              className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              data-testid="create-maintenance-confirm-btn"
              onClick={onConfirm}
              disabled={saving || !form.assetId || form.description.trim().length < 10}
              className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Abrir Ordem'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
