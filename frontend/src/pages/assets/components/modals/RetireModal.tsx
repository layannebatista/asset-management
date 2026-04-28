import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import type { AssetResponse } from '../../../../types'

interface RetireModalProps {
  asset: AssetResponse | null
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
}

export function RetireModal({
  asset,
  onCancel,
  onConfirm,
  loading,
}: RetireModalProps) {
  const [typed, setTyped] = useState('')

  // ✅ reset ao abrir / trocar asset
  useEffect(() => {
    if (asset) setTyped('')
  }, [asset])

  if (!asset) return null

  const normalizedInput = typed.trim().toUpperCase()
  const normalizedTag = asset.assetTag.trim().toUpperCase()

  const confirmed = normalizedInput === normalizedTag

  const handleConfirm = () => {
    if (!confirmed || loading) return
    onConfirm()
  }

  const handleClose = () => {
    setTyped('')
    onCancel()
  }

  return (
    <div
      data-testid="retire-modal"
      className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-[480px] shadow-2xl">
        {/* header */}
        <div className="px-6 pt-6 pb-0 flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-[2px]">
            <AlertTriangle size={18} className="text-red-600" />
          </div>

          <div>
            <h2 className="text-[17px] font-bold text-slate-800">
              Aposentar Ativo
            </h2>
            <p className="text-[13px] text-slate-500 mt-1">
              Esta ação é{' '}
              <strong className="text-red-600">
                permanente e irreversível
              </strong>.
            </p>
          </div>
        </div>

        {/* body */}
        <div className="px-6 py-5">
          <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 mb-4 text-[13px] text-red-700 space-y-1">
            <p>
              • O ativo{' '}
              <strong>
                {asset.assetTag} — {asset.model}
              </strong>{' '}
              será marcado como aposentado.
            </p>
            <p>
              • Não será mais possível atribuir, transferir ou abrir manutenção para ele.
            </p>
            <p>
              • O histórico será mantido, mas o ativo ficará inativo no sistema.
            </p>
          </div>

          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
            Para confirmar, digite o código do ativo:{' '}
            <span className="text-red-600 font-mono">
              {asset.assetTag}
            </span>
          </label>

          <input
            data-testid="retire-confirm-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={asset.assetTag}
            className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none focus:border-red-400 bg-slate-50 transition font-mono"
          />

          {/* footer */}
          <div className="flex gap-2 justify-end pt-4 mt-2 border-t border-slate-100">
            <button
              data-testid="retire-cancel-btn"
              onClick={handleClose}
              className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar
            </button>

            <button
              data-testid="retire-confirm-btn"
              onClick={handleConfirm}
              disabled={!confirmed || loading}
              className="px-4 py-[8px] rounded-[8px] bg-red-600 text-white text-[13px] font-semibold hover:bg-red-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Aposentando...' : 'Confirmar Aposentadoria'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}