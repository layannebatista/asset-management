import { useEffect, useState, useCallback } from 'react'
import { Plus, ChevronDown, ChevronRight, Play, CheckCheck, X, Package } from 'lucide-react'
import { inventoryApi, unitApi, assetApi, userApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { InventoryResponse, UnitResponse, AssetResponse, UserResponse } from '../../types'
import {
  INVENTORY_STATUS_LABELS, INVENTORY_STATUS_COLORS,
  ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_TYPE_LABELS,
  INPUT_CLS, TipButton, ErrorBanner,
  resolveUnitName, resolveUserName, formatDate,
} from '../../shared'

// ─── SessionAssets ────────────────────────────────────────────────────────────

interface SessionAssetsProps {
  unitId: number
  users: UserResponse[]
}

function SessionAssets({ unitId, users }: SessionAssetsProps) {
  const [assets, setAssets] = useState<AssetResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    assetApi.list({ unitId, size: 200 })
      .then((p) => setAssets(Array.isArray(p?.content) ? p.content : []))
      .catch(() => setAssets([]))
      .finally(() => setLoading(false))
  }, [unitId])

  if (loading) return <div className="px-6 py-4 text-[12px] text-slate-400">Carregando ativos...</div>
  if (assets.length === 0) return <div className="px-6 py-4 text-[12px] text-slate-400">Nenhum ativo cadastrado nesta unidade.</div>

  return (
    <div className="border-t border-slate-100">
      <div className="px-4 py-2 bg-slate-50 flex items-center gap-2">
        <Package size={12} className="text-slate-400" />
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {assets.length} ativo{assets.length !== 1 ? 's' : ''}
        </span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {['Tag', 'Modelo', 'Tipo', 'Status', 'Responsável'].map((h) => (
              <th key={h} className="px-4 py-2 text-left text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((a) => (
            <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
              <td className="px-4 py-[9px] font-mono text-[12px] text-blue-700 font-semibold">{a.assetTag}</td>
              <td className="px-4 py-[9px] text-[12.5px] text-slate-700">{a.model}</td>
              <td className="px-4 py-[9px] text-[12px] text-slate-500">{ASSET_TYPE_LABELS[a.type] ?? a.type}</td>
              <td className="px-4 py-[9px]">
                <span className={`text-[11px] font-semibold px-[8px] py-[3px] rounded-full ${ASSET_STATUS_COLORS[a.status as keyof typeof ASSET_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'}`}>
                  {ASSET_STATUS_LABELS[a.status as keyof typeof ASSET_STATUS_LABELS] ?? a.status}
                </span>
              </td>
              <td className="px-4 py-[9px] text-[12px] text-slate-500">
                {resolveUserName(a.assignedUserId, users)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── InventoryPage ────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user, isGestor } = useAuth()
  const [sessions, setSessions] = useState<InventoryResponse[]>([])
  const [units, setUnits] = useState<UnitResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [unitId, setUnitId] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const load = useCallback(() => {
    setLoading(true)
    inventoryApi.list()
      .then((list) => setSessions(Array.isArray(list) ? list : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!user?.organizationId) return

    unitApi.listByOrg(user.organizationId)
      .then((list) => {
        const active = Array.isArray(list) ? list.filter((u) => u.status === 'ACTIVE') : []
        setUnits(isGestor && user.unitId ? active.filter((u) => u.id === user.unitId) : active)
      })
      .catch(() => setUnits([]))

    userApi.list({ size: 200 })
      .then((p) => setUsers(Array.isArray(p?.content) ? p.content : []))
      .catch(() => setUsers([]))
  }, [user?.organizationId])

  const handleCreate = async () => {
    if (!unitId) return
    setSaving(true)
    setActionError('')
    try {
      await inventoryApi.create(Number(unitId))
      setShowCreate(false)
      setUnitId('')
      load()
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Erro ao criar sessão')
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (fn: () => Promise<any>, label: string) => {
    if (saving) return
    setSaving(true)
    setActionError('')
    try {
      await fn()
      load()
    } catch (e: any) {
      setActionError(e?.response?.data?.error?.message ?? e?.response?.data?.message ?? `Erro ao ${label}`)
    } finally {
      setSaving(false)
    }
  }

  const availableUnits = units.filter(
    (u) => !sessions.some((s) => s.unitId === u.id && (s.status === 'OPEN' || s.status === 'IN_PROGRESS'))
  )
  const blockedUnitsCount = units.length - availableUnits.length

  const stats = {
    total: sessions.length,
    open: sessions.filter((s) => s.status === 'OPEN').length,
    inProgress: sessions.filter((s) => s.status === 'IN_PROGRESS').length,
    closed: sessions.filter((s) => s.status === 'CLOSED').length,
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Inventário</h1>
          <p className="text-[13px] text-slate-500 mt-1">Conferência de ativos por unidade</p>
        </div>
        <button
          onClick={() => { setUnitId(''); setActionError(''); setShowCreate(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition">
          <Plus size={14} /> Nova Sessão
        </button>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

      <div className="grid grid-cols-4 gap-[14px] mb-5">
        {[
          { label: 'Total', val: stats.total, color: '' },
          { label: 'Abertos', val: stats.open, color: 'text-blue-600' },
          { label: 'Em Andamento', val: stats.inProgress, color: 'text-amber-600' },
          { label: 'Fechadas', val: stats.closed, color: 'text-emerald-600' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
            <div className={`text-[24px] font-bold ${c.color}`}>{c.val}</div>
            <div className="text-[12px] text-slate-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 shadow-sm overflow-hidden">
        {sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Nenhuma sessão de inventário encontrada</div>
        ) : (
          sessions.map((s) => (
            <div key={s.id} className="border-b border-slate-100 last:border-0">
              <div
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="text-slate-400 flex-shrink-0">
                  {expanded === s.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </div>

                <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                  <div>
                    <div className="text-[13.5px] font-semibold text-slate-800">
                      {resolveUnitName(s.unitId, units)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-[1px]">
                      Criado em {formatDate(s.createdAt)}
                    </div>
                  </div>

                  <div>
                    <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${
                      INVENTORY_STATUS_COLORS[s.status as keyof typeof INVENTORY_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'
                    }`}>
                      {INVENTORY_STATUS_LABELS[s.status as keyof typeof INVENTORY_STATUS_LABELS] ?? s.status}
                    </span>
                  </div>

                  <div className="text-[12px] text-slate-500">
                    {s.closedAt ? `Fechado em ${formatDate(s.closedAt)}` : '—'}
                  </div>

                  <div />
                </div>

                <div className="flex gap-[5px]" onClick={(e) => e.stopPropagation()}>
                  {s.status === 'OPEN' && (
                    <TipButton tip="Iniciar contagem" onClick={() => handleAction(() => inventoryApi.start(s.id), 'iniciar')}>
                      <Play size={13} />
                    </TipButton>
                  )}
                  {s.status === 'IN_PROGRESS' && (
                    <TipButton tip="Fechar sessão" onClick={() => handleAction(() => inventoryApi.close(s.id), 'fechar')}>
                      <CheckCheck size={13} />
                    </TipButton>
                  )}
                  {['OPEN', 'IN_PROGRESS'].includes(s.status) && (
                    <TipButton tip="Cancelar sessão" danger onClick={() => handleAction(() => inventoryApi.cancel(s.id), 'cancelar')}>
                      <X size={13} />
                    </TipButton>
                  )}
                </div>
              </div>

              {expanded === s.id && <SessionAssets unitId={s.unitId} users={users} />}
            </div>
          ))
        )}
      </div>

      {/* Modal nova sessão */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
          onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white rounded-[14px] w-full max-w-[420px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Nova Sessão de Inventário</h2>
              <button
                onClick={() => setShowCreate(false)}
                className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-[14px]">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                  Unidade *
                </label>

                {units.length === 0 ? (
                  <p className="text-[12px] text-slate-400">Carregando unidades...</p>
                ) : availableUnits.length === 0 ? (
                  <p className="text-[12.5px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[7px] px-3 py-2">
                    Todas as unidades já possuem sessão de inventário aberta.
                  </p>
                ) : (
                  <div>
                    <select
                      value={unitId}
                      onChange={(e) => setUnitId(e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="">Selecione uma unidade...</option>
                      {availableUnits.map((u) => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                    {blockedUnitsCount > 0 && (
                      <p className="text-[11.5px] text-slate-400 mt-[6px]">
                        {blockedUnitsCount} unidade{blockedUnitsCount > 1 ? 's' : ''} ocultada{blockedUnitsCount > 1 ? 's' : ''} — já possui sessão aberta.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => { setShowCreate(false); setActionError('') }}
                  className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={saving || !unitId}
                  className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar Sessão'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}