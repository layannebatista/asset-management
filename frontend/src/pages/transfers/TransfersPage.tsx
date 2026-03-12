// ─── src/pages/transfers/TransfersPage.tsx ───────────────────────────────────
import { useEffect, useState } from 'react'
import { Plus, CheckCircle, XCircle, Check } from 'lucide-react'
import { transferApi, assetApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { TransferResponse, TransferStatus } from '../../types'

const STATUS_LABELS: Record<TransferStatus, string> = {
  PENDING: 'Pendente', APPROVED: 'Aprovado', IN_TRANSIT: 'Em Trânsito',
  COMPLETED: 'Concluído', REJECTED: 'Rejeitado',
}
const STATUS_COLORS: Record<TransferStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700', APPROVED: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export default function TransfersPage() {
  const { isGestor } = useAuth()
  const [transfers, setTransfers] = useState<TransferResponse[]>([])
  const [selected, setSelected] = useState<TransferResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ assetId: '', toUnitId: '', reason: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    transferApi.list({ size: 50, sort: 'requestedAt,desc' })
      .then((p) => { setTransfers(p.content); if (p.content.length) setSelected(p.content[0]) })
      .catch(console.error).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const handleCreate = async () => {
    if (!form.assetId || !form.toUnitId || !form.reason) return
    setSaving(true)
    try {
      await transferApi.create({ assetId: Number(form.assetId), toUnitId: Number(form.toUnitId), reason: form.reason })
      setShowCreate(false); setForm({ assetId: '', toUnitId: '', reason: '' }); load()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const progress = selected
    ? (['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED'] as const).indexOf(
        selected.status === 'REJECTED' ? 'PENDING' : selected.status as any
      )
    : 0

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Transferências</h1>
          <p className="text-[13px] text-slate-500 mt-1">Movimentações de ativos entre unidades</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition">
          <Plus size={14} /> Nova Solicitação
        </button>
      </div>

      <div className="flex rounded-[10px] border border-slate-200 bg-white overflow-hidden shadow-sm" style={{ height: 'calc(100vh - 180px)' }}>
        {/* List panel */}
        <div className="w-[290px] min-w-[290px] border-r border-slate-200 flex flex-col">
          <div className="p-[14px] border-b border-slate-100">
            <div className="font-bold text-[14px]">Transferências</div>
            <div className="text-[11.5px] text-slate-500 mt-[2px]">
              {transfers.filter((t) => t.status === 'PENDING').length} aguardando aprovação
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? <div className="text-center py-10 text-slate-400 text-[13px]">Carregando...</div> :
              transfers.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`px-[14px] py-3 border-b border-slate-50 cursor-pointer transition border-l-[3px] ${
                    selected?.id === t.id ? 'bg-blue-50 border-l-blue-700' : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-[5px]">
                    <span className="font-mono text-[12.5px] text-blue-700 font-bold">TRF-{String(t.id).padStart(4, '0')}</span>
                    <span className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABELS[t.status]}
                    </span>
                  </div>
                  <div className="text-[11.5px] text-slate-400">
                    Unidade {t.fromUnitId} → Unidade {t.toUnitId}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-1">
                    {new Date(t.requestedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="flex-1 p-5 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-[13px]">Selecione uma transferência</div>
          ) : (
            <>
              {/* Header */}
              <div className="border border-slate-200 rounded-[10px] p-[18px] mb-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[17px] font-bold">TRF-{String(selected.id).padStart(4, '0')}</div>
                    <div className="text-[12.5px] text-slate-500 mt-[2px]">
                      Solicitado em {new Date(selected.requestedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <span className={`text-[11.5px] font-semibold px-3 py-[4px] rounded-full ${STATUS_COLORS[selected.status]}`}>
                    {STATUS_LABELS[selected.status]}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  <div><label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Origem</label><span className="text-[13px] font-semibold">Unidade #{selected.fromUnitId}</span></div>
                  <div><label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Destino</label><span className="text-[13px] font-semibold">Unidade #{selected.toUnitId}</span></div>
                  <div><label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Ativo</label><span className="font-mono text-[12px] text-blue-700">#{selected.assetId}</span></div>
                </div>
                {selected.reason && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <label className="block text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">Motivo</label>
                    <p className="text-[13px] text-slate-600">{selected.reason}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              {isGestor && selected.status === 'PENDING' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={async () => { await transferApi.approve(selected.id); load() }}
                    className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-emerald-600 text-white text-[13px] font-semibold hover:bg-emerald-700 transition"
                  >
                    <CheckCircle size={14} /> Aprovar Transferência
                  </button>
                  <button
                    onClick={async () => { await transferApi.reject(selected.id); load() }}
                    className="flex items-center gap-2 px-4 py-2 rounded-[8px] border-[1.5px] border-red-200 text-red-600 text-[13px] font-semibold hover:bg-red-50 transition"
                  >
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}
              {selected.status === 'IN_TRANSIT' && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={async () => { await transferApi.complete(selected.id); load() }}
                    className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
                  >
                    <Check size={14} /> Confirmar Recebimento
                  </button>
                </div>
              )}

              {/* Stepper */}
              <div className="border border-slate-200 rounded-[10px] p-[18px]">
                <h3 className="text-[13.5px] font-bold mb-5">Progresso</h3>
                <div className="relative">
                  <div className="absolute top-[19px] left-[55px] right-[55px] h-[2px] bg-slate-200" />
                  <div className="absolute top-[19px] left-[55px] h-[2px] bg-emerald-500" style={{ width: `${(progress / 3) * 100}%` }} />
                  <div className="flex justify-between relative">
                    {[
                      { label: 'Solicitado', date: selected.requestedAt },
                      { label: 'Aprovado', date: selected.approvedAt },
                      { label: 'Em Trânsito', date: null },
                      { label: 'Recebido', date: selected.completedAt },
                    ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center gap-[7px] flex-1">
                        <div className={`w-[38px] h-[38px] rounded-full border-[2.5px] flex items-center justify-center transition ${
                          i < progress ? 'bg-emerald-500 border-emerald-500' : i === progress ? 'bg-blue-700 border-blue-700' : 'bg-white border-slate-200'
                        }`}>
                          {i < progress ? <Check size={15} className="text-white" /> :
                            <span className={`text-[12px] font-bold ${i === progress ? 'text-white' : 'text-slate-400'}`}>{i + 1}</span>}
                        </div>
                        <div className="text-[11.5px] font-semibold text-center text-slate-600">{step.label}</div>
                        {step.date && <div className="text-[10.5px] text-slate-400 text-center">{new Date(step.date).toLocaleDateString('pt-BR')}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Nova Solicitação de Transferência</h2>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">✕</button>
            </div>
            <div className="px-6 py-5 space-y-[14px]">
              {[
                { label: 'ID do Ativo *', key: 'assetId', type: 'number', ph: 'Ex: 42' },
                { label: 'ID da Unidade de Destino *', key: 'toUnitId', type: 'number', ph: 'Ex: 3' },
              ].map(({ label, key, type, ph }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">{label}</label>
                  <input type={type} value={form[key as keyof typeof form]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={ph}
                    className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition" />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Motivo *</label>
                <textarea value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} rows={3} placeholder="Descreva o motivo..."
                  className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 pb-5">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50">Cancelar</button>
              <button onClick={handleCreate} disabled={saving} className="px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Solicitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
