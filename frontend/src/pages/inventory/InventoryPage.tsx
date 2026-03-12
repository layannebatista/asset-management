import { useEffect, useState } from 'react'
import { Plus, Play, CheckCheck, X } from 'lucide-react'
import { inventoryApi } from '../../api'
import type { InventoryResponse, InventoryStatus } from '../../types'

const STATUS_LABELS: Record<InventoryStatus, string> = {
  CREATED: 'Criado',
  IN_PROGRESS: 'Em Andamento',
  CLOSED: 'Fechado',
  CANCELLED: 'Cancelado',
}
const STATUS_COLORS: Record<InventoryStatus, string> = {
  CREATED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  CLOSED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}

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

export default function InventoryPage() {
  const [sessions, setSessions] = useState<InventoryResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [unitId, setUnitId] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    inventoryApi.list({ size: 50, sort: 'createdAt,desc' })
      .then((p) => setSessions(Array.isArray(p?.content) ? p.content : Array.isArray(p) ? p : []))
      .catch((e) => { console.error(e); setSessions([]) })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const handleCreate = async () => {
    if (!unitId) return
    setSaving(true)
    try {
      await inventoryApi.create(Number(unitId))
      setShowCreate(false)
      setUnitId('')
      load()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Inventario</h1>
          <p className="text-[13px] text-slate-500 mt-1">Sessoes de contagem e conferencia por unidade</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Nova Sessao
        </button>
      </div>

      <div className="grid grid-cols-4 gap-[14px] mb-5">
        {[
          { label: 'Total', val: sessions.length, color: '' },
          { label: 'Em Andamento', val: sessions.filter((s) => s.status === 'IN_PROGRESS').length, color: 'text-blue-700' },
          { label: 'Fechadas', val: sessions.filter((s) => s.status === 'CLOSED').length, color: 'text-emerald-600' },
          { label: 'Canceladas', val: sessions.filter((s) => s.status === 'CANCELLED').length, color: 'text-red-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
            <div className={`text-[24px] font-bold ${c.color}`}>{c.val}</div>
            <div className="text-[12px] text-slate-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50">
            <tr>
              {['ID', 'Unidade', 'Status', 'Criada em', 'Fechada em', 'Acoes'].map((h) => (
                <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Carregando...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma sessao encontrada</td></tr>
            ) : (
              sessions.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className="font-mono text-[12px] text-blue-700">#{s.id}</span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px]">Unidade #{s.unitId}</td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${STATUS_COLORS[s.status]}`}>
                      {STATUS_LABELS[s.status]}
                    </span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                    {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                    {s.closedAt ? new Date(s.closedAt).toLocaleDateString('pt-BR') : 'N/A'}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <div className="flex gap-[5px]">
                      {s.status === 'CREATED' && (
                        <TBtn tip="Iniciar contagem" onClick={() => inventoryApi.start(s.id).then(load)}>
                          <Play size={13} />
                        </TBtn>
                      )}
                      {s.status === 'IN_PROGRESS' && (
                        <TBtn tip="Fechar sessao" onClick={() => inventoryApi.close(s.id).then(load)}>
                          <CheckCheck size={13} />
                        </TBtn>
                      )}
                      {['CREATED', 'IN_PROGRESS'].includes(s.status) && (
                        <TBtn tip="Cancelar sessao" danger onClick={() => inventoryApi.cancel(s.id).then(load)}>
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

      {showCreate && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white rounded-[14px] w-full max-w-[420px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Nova Sessao de Inventario</h2>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400">x</button>
            </div>
            <div className="px-6 py-5 space-y-[14px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">ID da Unidade *</label>
                <input
                  type="number"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                  className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 transition"
                  placeholder="Ex: 1"
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-[8px] p-3 text-[12.5px] text-blue-700">
                Sessao criada com status CREATED. Clique em Iniciar para comecar a contagem.
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button onClick={() => setShowCreate(false)} className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50">Cancelar</button>
                <button onClick={handleCreate} disabled={saving} className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {saving ? 'Criando...' : 'Criar Sessao'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
