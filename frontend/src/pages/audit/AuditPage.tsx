import { useEffect, useState, useCallback } from 'react'
import { Download, Package, ArrowLeftRight, Wrench, Users, Shield } from 'lucide-react'
import { auditApi } from '../../api'
import type { AuditEvent } from '../../types'

const EVENT_ICON: Record<string, React.ReactNode> = {
  ASSET: <Package size={14} />,
  TRANSFER: <ArrowLeftRight size={14} />,
  MAINTENANCE: <Wrench size={14} />,
  USER: <Users size={14} />,
  DEFAULT: <Shield size={14} />,
}
const EVENT_COLOR: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  USER: 'bg-red-100 text-red-700',
  DEFAULT: 'bg-slate-100 text-slate-500',
}

function getGroup(type: string): string {
  const keys = Object.keys(EVENT_ICON).filter((k) => k !== 'DEFAULT')
  return keys.find((k) => type.startsWith(k)) ?? 'DEFAULT'
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

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [total, setTotal] = useState(0)

  const load = useCallback(() => {
    setLoading(true)
    const fn = typeFilter
      ? auditApi.byType(typeFilter, { page: currentPage, size: 20 })
      : auditApi.list({ page: currentPage, size: 20, sort: 'createdAt,desc' })
    fn
      .then((p) => {
        setEvents(Array.isArray(p?.content) ? p.content : Array.isArray(p) ? p : [])
        setTotal(p?.totalElements ?? 0)
      })
      .catch((e) => { console.error(e); setEvents([]); setTotal(0) })
      .finally(() => setLoading(false))
  }, [typeFilter, currentPage])

  useEffect(load, [load])

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Auditoria</h1>
          <p className="text-[13px] text-slate-500 mt-1">Rastreamento completo de eventos da organizacao</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-50 transition">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(0) }}
          className="border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[7px] text-[13px] bg-white outline-none"
        >
          <option value="">Todos os tipos</option>
          {[
            'ASSET_CREATED', 'ASSET_ASSIGNED', 'ASSET_UNASSIGNED', 'ASSET_RETIRED',
            'TRANSFER_REQUESTED', 'TRANSFER_APPROVED', 'TRANSFER_REJECTED', 'TRANSFER_COMPLETED',
            'MAINTENANCE_OPENED', 'MAINTENANCE_STARTED', 'MAINTENANCE_COMPLETED', 'MAINTENANCE_CANCELLED',
            'USER_CREATED', 'USER_BLOCKED', 'USER_ACTIVATED',
          ].map((t) => <option key={t}>{t}</option>)}
        </select>
        <button
          onClick={load}
          className="px-4 py-[7px] rounded-[7px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          Filtrar
        </button>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Nenhum evento encontrado</div>
        ) : (
          events.map((e) => {
            const group = getGroup(e.eventType)
            return (
              <div
                key={e.id}
                className="flex items-start gap-[14px] px-[18px] py-[13px] border-b border-slate-50 last:border-0 hover:bg-slate-50 transition"
              >
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px] ${EVENT_COLOR[group]}`}>
                  {EVENT_ICON[group]}
                </div>
                <div className="flex-1">
                  <div className="font-mono text-[13px] font-bold text-slate-800">{e.eventType}</div>
                  <div className="text-[12.5px] text-slate-500 mt-[2px]">
                    Ator #{e.actorUserId} - {e.targetType} #{e.targetId}
                  </div>
                  <div className="flex gap-3 mt-[5px] text-[11px] text-slate-400 flex-wrap">
                    <span>Org #{e.organizationId}</span>
                    <span>Unidade #{e.unitId}</span>
                    {e.details && <span className="truncate max-w-[300px]">{e.details}</span>}
                  </div>
                </div>
                <div className="text-[11.5px] text-slate-400 whitespace-nowrap mt-[2px]">
                  {new Date(e.createdAt).toLocaleString('pt-BR')}
                </div>
              </div>
            )
          })
        )}

        <div className="flex items-center justify-between px-4 py-[11px] border-t border-slate-100">
          <span className="text-[13px] text-slate-500">
            Exibindo <strong>{events.length}</strong> de <strong>{total}</strong>
          </span>
          <div className="flex gap-1">
            <PBtn label="<" disabled={currentPage === 0} onClick={() => setCurrentPage((p) => p - 1)} />
            <PBtn label={String(currentPage + 1)} active onClick={() => {}} />
            <PBtn label=">" disabled={events.length < 20} onClick={() => setCurrentPage((p) => p + 1)} />
          </div>
        </div>
      </div>
    </div>
  )
}
