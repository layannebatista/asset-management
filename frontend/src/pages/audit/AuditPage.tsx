import { useEffect, useState, useCallback } from 'react'
import { Download, Package, ArrowLeftRight, Wrench, Users, Shield, Filter, X } from 'lucide-react'
import { auditApi, exportApi, userApi, unitApi, organizationApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { AuditEvent, UserResponse, UnitResponse } from '../../types'
import {
  AUDIT_EVENT_LABELS, AUDIT_EVENT_FILTER_OPTIONS,
  resolveUserName, resolveUnitName,
  DateRangeFilter,
} from '../../shared'

const EVENT_ICON: Record<string, React.ReactNode> = {
  ASSET: <Package size={14} />, TRANSFER: <ArrowLeftRight size={14} />,
  MAINTENANCE: <Wrench size={14} />, USER: <Users size={14} />, DEFAULT: <Shield size={14} />,
}
const EVENT_COLOR: Record<string, string> = {
  ASSET: 'bg-blue-100 text-blue-700', TRANSFER: 'bg-purple-100 text-purple-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700', USER: 'bg-red-100 text-red-700',
  DEFAULT: 'bg-slate-100 text-slate-500',
}

const AUDIT_DETAILS: Record<string, string> = {
  'User created': 'Usuário criado',
  'User activated': 'Usuário ativado',
  'User blocked': 'Usuário bloqueado',
  'User inactivated': 'Usuário inativado',
  'Unit created': 'Unidade criada',
  'Unit activated': 'Unidade ativada',
  'Unit inactivated': 'Unidade inativada',
  'Asset created': 'Ativo criado',
  'Asset updated': 'Ativo atualizado',
  'Asset retired': 'Ativo aposentado',
  'Asset assigned': 'Ativo atribuído',
  'Asset unassigned': 'Ativo desatribuído',
  'Transfer requested': 'Transferência solicitada',
  'Transfer approved': 'Transferência aprovada',
  'Transfer rejected': 'Transferência rejeitada',
  'Transfer completed': 'Transferência concluída',
  'Transfer cancelled': 'Transferência cancelada',
  'Maintenance opened': 'Manutenção aberta',
  'Maintenance started': 'Manutenção iniciada',
  'Maintenance completed': 'Manutenção concluída',
  'Maintenance cancelled': 'Manutenção cancelada',
}

const PAGE_SIZE = 20

function getGroup(type: string): string {
  const keys = Object.keys(EVENT_ICON).filter((k) => k !== 'DEFAULT')
  return keys.find((k) => type.startsWith(k)) ?? 'DEFAULT'
}

function translateDetails(details?: string) {
  if (!details) return undefined
  return AUDIT_DETAILS[details] ?? details
}

export default function AuditPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [units, setUnits] = useState<UnitResponse[]>([])
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [filterError, setFilterError] = useState('')

  useEffect(() => {
    if (!user) return
    userApi.list({ size: 200 })
      .then((p) => setUsers(Array.isArray(p?.content) ? p.content : []))
      .catch(console.error)

    if (user.organizationId) {
      unitApi.listByOrg(user.organizationId)
        .then((l) => setUnits(Array.isArray(l) ? l : []))
        .catch(console.error)

      organizationApi.getById(user.organizationId)
        .then((o) => setOrgName(o.name))
        .catch(console.error)
    }
  }, [user])

  const load = useCallback(() => {
    if (startDate && endDate && endDate < startDate) {
      setFilterError('A data final deve ser posterior à data inicial')
      return
    }

    setFilterError('')
    setLoading(true)

    let fn: Promise<AuditEvent[] | { content: AuditEvent[] }>

    if (startDate && endDate && user?.organizationId) {
      fn = auditApi.byPeriod(user.organizationId, startDate, endDate)
    } else if (typeFilter) {
      fn = auditApi.byType(typeFilter)
    } else {
      fn = auditApi.list({ sort: 'createdAt,desc' })
    }

    fn.then((items) => {
      const result = items as { content?: AuditEvent[] }

      const all = Array.isArray(items)
        ? items
        : Array.isArray(result.content)
          ? result.content
          : []

      const filtered = typeFilter && (startDate || endDate)
        ? all.filter((e: AuditEvent) => e.eventType === typeFilter)
        : all

      setTotal(filtered.length)
      setEvents(filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE))
    })
      .catch((e) => {
        console.error(e)
        setEvents([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [typeFilter, currentPage, startDate, endDate, user?.organizationId])

  useEffect(() => { load() }, [load])

  const clearFilters = () => {
    setTypeFilter('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(0)
    setFilterError('')
  }

  const hasActiveFilters = typeFilter || startDate || endDate
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Auditoria</h1>
          <p className="text-[13px] text-slate-500 mt-1">Rastreamento completo de eventos da organização</p>
        </div>
        <button
          onClick={() => exportApi.downloadAudit(startDate || undefined, endDate || undefined)}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-50 transition">
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 p-4 mb-4 shadow-sm">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[5px]">Tipo de evento</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(0) }}
              className="border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[7px] text-[13px] bg-slate-50 outline-none min-w-[200px]">
              <option value="">Todos os tipos</option>
              {AUDIT_EVENT_FILTER_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartChange={(v) => { setStartDate(v); setCurrentPage(0); setFilterError('') }}
            onEndChange={(v) => { setEndDate(v); setCurrentPage(0); setFilterError('') }}
            onClear={clearFilters}
            error={filterError}
          />

          <div className="flex gap-2 items-center">
            <button
              onClick={load}
              className="flex items-center gap-2 px-4 py-[7px] rounded-[7px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition">
              <Filter size={13} /> Filtrar
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-[7px] rounded-[7px] border border-slate-200 text-[13px] text-slate-500 hover:bg-slate-50 transition">
                <X size={12} /> Limpar
              </button>
            )}
          </div>
        </div>
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
              <div key={e.id} className="flex items-start gap-[14px] px-[18px] py-[13px] border-b border-slate-50 last:border-0 hover:bg-slate-50 transition">
                <div className={`w-[34px] h-[34px] rounded-full flex items-center justify-center flex-shrink-0 mt-[1px] ${EVENT_COLOR[group]}`}>
                  {EVENT_ICON[group]}
                </div>

                <div className="flex-1">
                  <div className="text-[13px] font-bold text-slate-800">
                    {AUDIT_EVENT_LABELS[e.eventType] ?? e.eventType}
                  </div>

                  <div className="text-[12.5px] text-slate-500 mt-[2px]">
                    Responsável: <strong>{resolveUserName(e.actorUserId, users)}</strong>
                    {e.details && <>{' · '}{translateDetails(e.details)}</>}
                  </div>

                  <div className="flex gap-3 mt-[5px] text-[11px] text-slate-400 flex-wrap">
                    <span>Organização: {orgName || 'Carregando...'}</span>
                    <span>Unidade: {resolveUnitName(e.unitId, units)}</span>
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
            {total > 0
              ? <>Exibindo <strong>{currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, total)}</strong> de <strong>{total}</strong></>
              : 'Nenhum resultado'
            }
          </span>

          {totalPages > 1 && (
            <div className="flex gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                const half = 2
                let start = Math.max(0, currentPage - half)
                const end = Math.min(totalPages - 1, start + 4)
                if (end - start < 4) start = Math.max(0, end - 4)
                const page = start + i
                if (page > totalPages - 1) return null
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    disabled={page === currentPage}
                    className={`w-7 h-7 rounded-[6px] border-[1.5px] text-[12px] font-semibold flex items-center justify-center transition ${
                      page === currentPage
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 disabled:opacity-40'
                    }`}>
                    {page + 1}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
