import { CheckCircle, XCircle, Check, Ban } from 'lucide-react'
import { transferApi } from '../../../api'
import type { TransferResponse, TransferStatus, UnitResponse, AssetResponse } from '../../../types'
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  resolveUnitName,
  resolveAssetLabel,
  formatCode,
  formatDate,
} from '../../../shared'

interface TransferDetailProps {
  selected: TransferResponse
  allUnits: UnitResponse[]
  allAssets: AssetResponse[]
  isAdmin: boolean
  isGestor: boolean
  actionLoading: boolean
  onAction: (fn: () => Promise<any>, label: string) => void
}

const progressSteps: Array<{ label: string; dateKey: keyof TransferResponse }> = [
  { label: 'Solicitado', dateKey: 'requestedAt' },
  { label: 'Aprovado',   dateKey: 'approvedAt' },
  { label: 'Recebido',   dateKey: 'completedAt' },
]

function getProgressIndex(status: TransferStatus) {
  if (status === 'COMPLETED') return 2
  if (status === 'APPROVED')  return 1
  return 0
}

export function TransferDetail({
  selected, allUnits, allAssets, isAdmin, isGestor, actionLoading, onAction,
}: TransferDetailProps) {
  const progress = getProgressIndex(selected.status)

  return (
    <>
      <div className="border border-slate-200 rounded-[10px] p-[18px] mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-[17px] font-bold">{formatCode('TRF', selected.id)}</div>
            <div className="text-[12.5px] text-slate-500 mt-[2px]">
              Solicitado em {formatDate(selected.requestedAt)}
            </div>
          </div>
          <span className={`text-[11.5px] font-semibold px-3 py-[4px] rounded-full ${
            TRANSFER_STATUS_COLORS[selected.status] ?? 'bg-slate-100 text-slate-500'
          }`}>
            {TRANSFER_STATUS_LABELS[selected.status] ?? selected.status}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-3">
          <div>
            <label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Origem</label>
            <span className="text-[13px] font-semibold">{resolveUnitName(selected.fromUnitId, allUnits)}</span>
          </div>
          <div>
            <label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Destino</label>
            <span className="text-[13px] font-semibold">{resolveUnitName(selected.toUnitId, allUnits)}</span>
          </div>
          <div>
            <label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Ativo</label>
            <span className="font-mono text-[12px] text-blue-700">{resolveAssetLabel(selected.assetId, allAssets)}</span>
          </div>
        </div>

        {selected.reason && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Motivo</label>
            <p className="text-[13px] text-slate-600">{selected.reason}</p>
          </div>
        )}
      </div>

      {selected.status === 'PENDING' && (
        <div className="flex gap-2 mb-4">
          {(isAdmin || isGestor) && (
            <>
              <button type="button" data-testid="transfer-detail-approve-btn" disabled={actionLoading}
                onClick={() => onAction(() => transferApi.approve(selected.id), 'aprovar')}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                <CheckCircle size={14} /> {actionLoading ? 'Processando...' : 'Aprovar Transferência'}
              </button>
              <button type="button" data-testid="transfer-detail-reject-btn" disabled={actionLoading}
                onClick={() => onAction(() => transferApi.reject(selected.id), 'rejeitar')}
                className="flex items-center gap-2 px-4 py-2 rounded-[8px] border-[1.5px] border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition disabled:opacity-50">
                <XCircle size={14} /> Rejeitar
              </button>
            </>
          )}
          <button type="button" data-testid="transfer-detail-cancel-btn" disabled={actionLoading}
            onClick={() => onAction(() => transferApi.cancel(selected.id), 'cancelar')}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 text-slate-500 text-[13px] font-semibold hover:bg-slate-50 transition disabled:opacity-50">
            <Ban size={14} /> Cancelar
          </button>
        </div>
      )}

      {selected.status === 'APPROVED' && (
        <div className="flex gap-2 mb-4">
          <button type="button" data-testid="transfer-detail-complete-btn" disabled={actionLoading}
            onClick={() => onAction(() => transferApi.complete(selected.id), 'completar')}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50">
            <Check size={14} /> {actionLoading ? 'Processando...' : 'Confirmar Recebimento'}
          </button>
        </div>
      )}

      {/* Progress bar — usa layout flex para não ultrapassar limites */}
      <div className="border border-slate-200 rounded-[10px] p-[18px]">
        <h3 className="text-[13.5px] font-bold mb-6">Progresso</h3>

        <div className="flex items-center">
          {progressSteps.map((step, i) => {
            const dateVal = selected[step.dateKey] as string | undefined
            const done = i < progress
            const current = i === progress && selected.status !== 'REJECTED' && selected.status !== 'CANCELLED'

            return (
              <div key={i} className="flex items-center flex-1 last:flex-none">
                {/* Step circle */}
                <div className="flex flex-col items-center">
                  <div className={`w-[36px] h-[36px] rounded-full border-[2.5px] flex items-center justify-center flex-shrink-0 transition ${
                    done    ? 'bg-emerald-500 border-emerald-500'
                    : current ? 'bg-blue-700 border-blue-700'
                    :           'bg-white border-slate-200'
                  }`}>
                    {done
                      ? <Check size={14} className="text-white" />
                      : <span className={`text-[12px] font-bold ${current ? 'text-white' : 'text-slate-400'}`}>{i + 1}</span>
                    }
                  </div>
                  <div className="text-[11.5px] font-semibold text-center text-slate-600 mt-[7px] whitespace-nowrap">
                    {step.label}
                  </div>
                  {dateVal && (
                    <div className="text-[10.5px] text-slate-400 text-center mt-[2px]">
                      {formatDate(dateVal)}
                    </div>
                  )}
                </div>

                {/* Connector line between steps */}
                {i < progressSteps.length - 1 && (
                  <div className="flex-1 h-[2px] bg-slate-200 mx-3 relative top-[-16px]">
                    {i < progress && (
                      <div className="h-full bg-emerald-500 w-full" />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selected.status === 'REJECTED' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700 text-center">
            Esta transferência foi <strong>rejeitada</strong>.
          </div>
        )}
        {selected.status === 'CANCELLED' && (
          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-[8px] p-3 text-[12.5px] text-slate-500 text-center">
            Esta transferência foi <strong>cancelada</strong>.
          </div>
        )}
      </div>
    </>
  )
}
