import type { AssetResponse, UnitResponse } from '../../../types'
import { INPUT_CLS } from '../../../shared'

interface CreateTransferModalProps {
  open: boolean
  onClose: () => void
  assets: AssetResponse[]
  units: UnitResponse[]
  form: { assetId: string; toUnitId: string; reason: string }
  setForm: React.Dispatch<React.SetStateAction<{ assetId: string; toUnitId: string; reason: string }>>
  reasonError: string
  setReasonError: (v: string) => void
  error: string
  onConfirm: () => void
  saving: boolean
}

export function CreateTransferModal({
  open,
  onClose,
  assets,
  units,
  form,
  setForm,
  reasonError,
  setReasonError,
  error,
  onConfirm,
  saving,
}: CreateTransferModalProps) {
  if (!open) return null

  const selectedAsset = assets.find((a) => String(a.id) === form.assetId)

  const destUnits = units
    .filter((u) => u.status === 'ACTIVE')
    .filter((u) => !selectedAsset || u.id !== selectedAsset.unitId)

  return (
    <div
      data-testid="transfer-create-modal"
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
        <div className="flex justify-between items-center px-6 pt-5 pb-0">
          <h2 className="text-[17px] font-bold">
            Nova Solicitação de Transferência
          </h2>

          <button
            data-testid="transfer-create-close-btn"
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5 space-y-[14px]">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Ativo *
            </label>

            <select
              data-testid="transfer-create-asset-select"
              value={form.assetId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  assetId: e.target.value,
                  toUnitId: '', // 🔥 reset correto
                }))
              }
              className={INPUT_CLS}
              disabled={saving}
            >
              <option value="">Selecione um ativo...</option>

              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.assetTag} — {a.model}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Unidade de Destino *
            </label>

            <select
              data-testid="transfer-create-destination-select"
              value={form.toUnitId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  toUnitId: e.target.value,
                }))
              }
              className={INPUT_CLS}
              disabled={!form.assetId || saving}
            >
              <option value="">Selecione uma unidade...</option>

              {destUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            {form.assetId && destUnits.length === 0 && (
              <p className="text-[11.5px] text-red-500 mt-1">
                Nenhuma unidade disponível para transferência
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
              Motivo *
            </label>

            <textarea
              data-testid="transfer-create-reason-input"
              value={form.reason}
              onChange={(e) => {
                setForm((f) => ({
                  ...f,
                  reason: e.target.value,
                }))
                setReasonError('')
              }}
              rows={3}
              maxLength={500}
              placeholder="Descreva o motivo da transferência (mín. 10 caracteres)..."
              className={`${INPUT_CLS} resize-none ${
                reasonError ? 'border-red-400' : ''
              }`}
              disabled={saving}
            />

            <div className="flex justify-between mt-1">
              {reasonError ? (
                <p className="text-[11.5px] text-red-500">
                  {reasonError}
                </p>
              ) : (
                <span />
              )}

              <p className="text-[11px] text-slate-400">
                {form.reason.length}/500
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 pb-5">
          <button
            data-testid="transfer-create-cancel-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50"
          >
            Cancelar
          </button>

          <button
            data-testid="transfer-create-submit-btn"
            type="button"
            onClick={onConfirm}
            disabled={
              saving ||
              !form.assetId ||
              !form.toUnitId ||
              form.reason.trim().length < 10
            }
            className="px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Solicitar'}
          </button>
        </div>
      </div>
    </div>
  )
}