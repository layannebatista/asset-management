import { useEffect, useState, useCallback } from 'react'
import { Plus, Play, CheckCheck, X } from 'lucide-react'
import { maintenanceApi } from '../../api'
import type { MaintenanceResponse, MaintenanceBudget, MaintenanceStatus, Page } from '../../types'

const STATUS_LABELS: Record<MaintenanceStatus, string> = {
  OPEN: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluido',
  CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<MaintenanceStatus, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

const iCls = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

function TBtn({ tip, onClick, danger, children }: {
  tip: string; onClick?: () => void; danger?: boolean; children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-[28px] h-[28px] rounded-[6px] border flex items-center justify-center transition ${
          danger ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        {children}
      </button>
      <div className="absolute bottom-full mb-[6px] left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-[3px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
        {tip}
      </div>
    </div>
  )
}

function PBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-[6px] border-[1.5px] text-[12px] font-semibold flex items-center justify-center transition ${
        active ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 disabled:opacity-40'
      }`}
    >
      {label}
    </button>
  )
}

export default function MaintenancePage() {
  const [page, setPage] = useState<Page<MaintenanceResponse> | null>(null)
  const [budget, setBudget] = useState<MaintenanceBudget | null>(null)
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | 'ALL'>('ALL')
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showComplete, setShowComplete] = useState<MaintenanceResponse | null>(null)
  const [form, setForm] = useState({ assetId: '', description: '' })
  const [completeForm, setCompleteForm] = useState({ resolution: '', actualCost: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      maintenanceApi.list({
        page: currentPage,
        size: 20,
        sort: 'createdAt,desc',
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      }),
      maintenanceApi.getBudget({}),
    ])
      .then(([p, b]) => { setPage(p); setBudget(b) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentPage, statusFilter])

  useEffect(load, [load])

  const handleCreate = async () => {
    if (!form.assetId || form.description.length < 10) return
    setSaving(true)
    try {
      await maintenanceApi.create({ assetId: Number(form.assetId), description: form.description })
      setShowCreate(false)
      setForm({ assetId: '', description: '' })
      load()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!showComplete || !completeForm.resolution) return
    setSaving(true)
    try {
      await maintenanceApi.complete(
        showComplete.id,
        completeForm.resolution,
        completeForm.actualCost ? Number(completeForm.actualCost) : undefined
      )
      setShowComplete(null)
      load()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Manutencao</h1>
          <p className="text-[13px] text-slate-500 mt-1">Controle de ordens de servico e orcamento</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Abrir Ordem
        </button>
      </div>

      {budget && (
        <div className="grid grid-cols-3 gap-[14px] mb-5">
          {[
            { label: 'Custo Estimado', val: budget.totalEstimatedCost, sub: `${budget.totalRecords} ordens`, color: '' },
            { label: 'Custo Real', val: budget.totalActualCost, sub: `${budget.completedRecords} concluidas`, color: budget.totalActualCost > budget.totalEstimatedCost ? 'text-red-600' : 'text-emerald-600' },
            { label: 'Variacao', val: budget.variance, sub: budget.variance > 0 ? 'Acima do orcado' : 'Dentro do orcado', color: budget.variance > 0 ? 'text-red-600' : 'text-emerald-600' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
              <div className="text-[11px] text-slate-400 uppercase tracking-[.5px] mb-2">{c.label}</div>
              <div className={`text-[22px] font-bold ${c.color}`}>
                {c.val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <div className="text-[11.5px] text-slate-400 mt-1">{c.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex gap-[6px] px-4 py-[10px] border-b border-slate-100 flex-wrap">
          {(['ALL', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(0) }}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border-[1.5px] transition ${
                statusFilter === s ? 'bg-blue-100 text-blue-700 border-blue-500' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
              }`}
            >
              {s === 'ALL' ? 'Todas' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['ID', 'Ativo', 'Descricao', 'Status', 'Criada em', 'Acoes'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : page?.content.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma ordem encontrada</td></tr>
              ) : (
                page?.content.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className="font-mono text-[12px] text-blue-700">MNT-{String(m.id).padStart(4, '0')}</span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      Ativo #{m.assetId}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] max-w-[240px] truncate">
                      {m.description}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <div className="flex gap-[5px]">
                        {m.status === 'OPEN' && (
                          <TBtn tip="Iniciar" onClick={() => maintenanceApi.start(m.id).then(load)}>
                            <Play size={13} />
                          </TBtn>
                        )}
                        {m.status === 'IN_PROGRESS' && (
                          <TBtn tip="Concluir" onClick={() => setShowComplete(m)}>
                            <CheckCheck size={13} />
                          </TBtn>
                        )}
                        {['OPEN', 'IN_PROGRESS'].includes(m.status) && (
                          <TBtn tip="Cancelar" danger onClick={() => maintenanceApi.cancel(m.id).then(load)}>
                            <X size={13} />
                          </TBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {page && (
          <div className="flex items-center justify-between px-4 py-[11px] border-t border-slate-100">
            <span className="text-[13px] text-slate-500">
              Exibindo <strong>{page.content.length}</strong> de <strong>{page.totalElements}</strong>
            </span>
            <div className="flex gap-1">
              <PBtn label="<" disabled={page.first} onClick={() => setCurrentPage((p) => p - 1)} />
              {[...Array(Math.min(5, page.totalPages))].map((_, i) => (
                <PBtn key={i} label={String(i + 1)} active={i === currentPage} onClick={() => setCurrentPage(i)} />
              ))}
              <PBtn label=">" disabled={page.last} onClick={() => setCurrentPage((p) => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Abrir Ordem de Manutencao</h2>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400">x</button>
            </div>
            <div className="px-6 py-5 space-y-[14px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">ID do Ativo *</label>
                <input type="number" value={form.assetId} onChange={(e) => setForm((f) => ({ ...f, assetId: e.target.value }))} className={iCls} placeholder="Ex: 42" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Descricao do Problema * (min. 10 caracteres)</label>
                <textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className={`${iCls} resize-none`} placeholder="Descreva o problema..." />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button onClick={() => setShowCreate(false)} className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50">Cancelar</button>
                <button onClick={handleCreate} disabled={saving} className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Abrir Ordem'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showComplete && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setShowComplete(null)}>
          <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Concluir Manutencao</h2>
              <button onClick={() => setShowComplete(null)} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400">x</button>
            </div>
            <div className="px-6 py-5 space-y-[14px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Resolucao *</label>
                <textarea rows={4} value={completeForm.resolution} onChange={(e) => setCompleteForm((f) => ({ ...f, resolution: e.target.value }))} className={`${iCls} resize-none`} placeholder="Descreva como foi resolvido..." />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Custo Real (R$)</label>
                <input type="number" value={completeForm.actualCost} onChange={(e) => setCompleteForm((f) => ({ ...f, actualCost: e.target.value }))} className={iCls} placeholder="0.00" />
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button onClick={() => setShowComplete(null)} className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50">Cancelar</button>
                <button onClick={handleComplete} disabled={saving} className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Concluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
