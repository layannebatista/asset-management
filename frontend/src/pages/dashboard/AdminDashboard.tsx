import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Wrench, ArrowLeftRight, Shield,
  AlertTriangle, CheckCircle, XCircle, TrendingUp,
} from 'lucide-react'
import { dashboardApi, transferApi, unitApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { ExecutiveDashboard, TransferResponse, UnitResponse } from '../../types'
import {
  ASSET_TYPE_LABELS,
  formatCurrency, formatCode, resolveUnitName,
} from '../../shared'

interface MetricCardProps {
  label: string
  value: string | number
  sub?: string
  accent: string
  icon: React.ReactNode
  alert?: boolean
  onClick?: () => void
}

function MetricCard({ label, value, sub, accent, icon, alert, onClick }: MetricCardProps) {
  const accentMap: Record<string, { bg: string; text: string; bar: string }> = {
    blue:   { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-500' },
    red:    { bg: 'bg-red-100',     text: 'text-red-700',     bar: 'bg-red-500' },
    amber:  { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500' },
    green:  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
    purple: { bg: 'bg-violet-100',  text: 'text-violet-700',  bar: 'bg-violet-500' },
    slate:  { bg: 'bg-slate-100',   text: 'text-slate-600',   bar: 'bg-slate-400' },
  }
  const c = accentMap[accent] ?? accentMap.slate
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-[12px] border shadow-sm overflow-hidden flex gap-4 items-center p-5 transition-all ${
        alert ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className={`w-[46px] h-[46px] rounded-[10px] flex-shrink-0 flex items-center justify-center ${c.bg} ${c.text}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
        <div className="text-[13px] text-slate-600 mt-[5px] font-medium">{label}</div>
        {sub && <div className="text-[11.5px] text-slate-400 mt-[2px]">{sub}</div>}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${c.bar}`} />
    </div>
  )
}


interface OperationalGap {
  key: string
  label: string
  count: number
  accent: string
  action?: { label: string; handler: () => void }
}

function OperationalGapsCard({ gaps }: { gaps: OperationalGap[] }) {
  const hasGaps = gaps.some(g => g.count > 0)

  if (!hasGaps) {
    return (
      <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm h-full flex items-center justify-center">
        <div className="text-center">
          <CheckCircle size={28} className="text-emerald-500 mx-auto mb-2" />
          <p className="text-[13px] font-semibold text-slate-700">Operações normais</p>
          <p className="text-[12px] text-slate-400 mt-1">Nenhum gargalo identificado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
      <h3 className="text-[14px] font-bold mb-3">Gargalos operacionais</h3>
      <div className="space-y-2">
        {gaps.map((gap) => (
          gap.count > 0 && (
            <button
              key={gap.key}
              onClick={gap.action?.handler}
              type="button"
              className="w-full text-left flex items-center justify-between gap-3 rounded-[8px] px-3 py-[10px] text-[12.5px] border transition hover:bg-slate-50"
              style={{
                borderColor: gap.accent === 'red' ? '#fca5a5' : gap.accent === 'amber' ? '#fcd34d' : '#e2e8f0',
                backgroundColor: gap.accent === 'red' ? '#fef2f2' : gap.accent === 'amber' ? '#fffbeb' : '#f8fafc',
                color: gap.accent === 'red' ? '#7f1d1d' : gap.accent === 'amber' ? '#78350f' : '#334155',
              }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <AlertTriangle size={13} className="flex-shrink-0" />
                <span className="truncate">{gap.label}</span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-bold text-[13px]">{gap.count}</span>
                {gap.action && <span className="text-[10px] text-slate-500">→</span>}
              </div>
            </button>
          )
        ))}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<ExecutiveDashboard | null>(null)
  const [pendingTransfers, setPendingTransfers] = useState<TransferResponse[]>([])
  const [units, setUnits] = useState<UnitResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const loadTransfers = useCallback(() => {
    transferApi.list({ status: 'PENDING', size: 5, sort: 'requestedAt,asc' })
      .then((p) => setPendingTransfers(Array.isArray(p?.content) ? p.content : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const orgId = user?.organizationId
    if (!orgId) return
    Promise.all([
      dashboardApi.executive(),
      transferApi.list({ status: 'PENDING', size: 5, sort: 'requestedAt,asc' }),
      unitApi.listByOrg(orgId),
    ])
      .then(([dash, transfers, unitList]) => {
        setData(dash)
        setPendingTransfers(Array.isArray(transfers?.content) ? transfers.content : [])
        setUnits(Array.isArray(unitList) ? unitList : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.organizationId])

  const handleApprove = async (id: number) => {
    setActionLoadingId(id)
    try { await transferApi.approve(id); loadTransfers() }
    catch (e) { console.error(e) }
    finally { setActionLoadingId(null) }
  }

  const handleReject = async (id: number) => {
    setActionLoadingId(id)
    try { await transferApi.reject(id); loadTransfers() }
    catch (e) { console.error(e) }
    finally { setActionLoadingId(null) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  if (!data) return null

  const retired = data.assetsByStatus?.RETIRED ?? 0
  const activeTotal = (data.totalAssets ?? 0) - retired

  const available = data.assetsAvailable ?? (data.assetsByStatus?.AVAILABLE ?? 0)
  const withResponsible = activeTotal - available
  const utilizationRate = activeTotal > 0 ? Math.round((withResponsible / activeTotal) * 100) : 0

  const pendingCount = data.pendingTransfersCount ?? pendingTransfers.length

  const byType = Object.entries(data.assetsByType ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 4)

  const gaps: OperationalGap[] = [
    {
      key: 'insurance',
      label: 'Seguros a vencer',
      count: data.insuranceExpiringCount ?? 0,
      accent: (data.insuranceExpiringCount ?? 0) > 0 ? 'red' : 'slate',
      action: (data.insuranceExpiringCount ?? 0) > 0
        ? { label: 'Ver', handler: () => navigate('/assets?insurance=expiring') }
        : undefined,
    },
    {
      key: 'idle',
      label: 'Ativos ociosos (30+ dias)',
      count: data.assetsIdleCount ?? 0,
      accent: (data.assetsIdleCount ?? 0) > 0 ? 'amber' : 'slate',
      action: (data.assetsIdleCount ?? 0) > 0
        ? { label: 'Atribuir', handler: () => navigate('/assets?status=AVAILABLE') }
        : undefined,
    },
    {
      key: 'transfers',
      label: 'Transferências pendentes',
      count: pendingCount,
      accent: pendingCount > 0 ? 'amber' : 'slate',
      action: pendingCount > 0
        ? { label: 'Aprovar', handler: () => navigate('/transfers') }
        : undefined,
    },
    {
      key: 'maintenance',
      label: 'Manutenções abertas',
      count: data.totalMaintenance ?? 0,
      accent: (data.totalMaintenance ?? 0) > 10 ? 'red' : (data.totalMaintenance ?? 0) > 5 ? 'amber' : 'slate',
      action: (data.totalMaintenance ?? 0) > 0
        ? { label: 'Ver', handler: () => navigate('/maintenance?status=OPEN') }
        : undefined,
    },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-[13px] text-slate-500 mt-1">Visão executiva da organização</p>
      </div>

      {/* Linha 1 — 4 métricas principais */}
      <div className="grid grid-cols-4 gap-[14px]">
        <MetricCard
          label="Ativos em uso"
          value={activeTotal.toLocaleString('pt-BR')}
          sub={`${available} sem responsável · ${retired} aposentados`}
          accent="blue" icon={<Package size={20} />}
          // Ativos em uso = todos exceto aposentados → sem filtro de status
          onClick={() => navigate('/assets')}
        />
        <MetricCard
          label="Taxa de utilização"
          value={`${utilizationRate}%`}
          sub={`${withResponsible} com responsável de ${activeTotal} ativos ativos`}
          accent={utilizationRate < 60 ? 'amber' : 'green'} icon={<TrendingUp size={20} />}
        />
        <MetricCard
          label="Manutenções abertas"
          value={data.totalMaintenance ?? 0}
          sub={`Custo real no mês: ${formatCurrency(data.maintenanceCostMonth ?? 0)}`}
          accent={(data.totalMaintenance ?? 0) > 10 ? 'red' : 'amber'}
          alert={(data.totalMaintenance ?? 0) > 10}
          icon={<Wrench size={20} />}
          onClick={() => navigate('/maintenance?status=OPEN')}
        />
        <MetricCard
          label="Transferências pendentes"
          value={pendingCount}
          sub="aguardando aprovação"
          accent={pendingCount > 0 ? 'amber' : 'slate'}
          icon={<ArrowLeftRight size={20} />}
          onClick={() => navigate('/transfers')}
        />
      </div>

      {/* Linha 2 — métricas secundárias */}
      <div className="grid grid-cols-3 gap-[14px]">
        <MetricCard
          label="Seguros a vencer (30 dias)"
          value={data.insuranceExpiringCount ?? 0}
          sub="apólices próximas do vencimento — veja na aba Seguros do ativo"
          accent={(data.insuranceExpiringCount ?? 0) > 0 ? 'red' : 'slate'}
          alert={(data.insuranceExpiringCount ?? 0) > 0}
          icon={<Shield size={20} />}
          onClick={(data.insuranceExpiringCount ?? 0) > 0 ? () => navigate('/assets?insurance=expiring') : undefined}
        />
        <MetricCard
          label="Aposentados este mês"
          value={data.assetsRetiredThisMonth ?? 0}
          sub="ativos retirados de uso no mês"
          accent="slate" icon={<Package size={20} />}
        />
        <MetricCard
          label="Ativos ociosos"
          value={data.assetsIdleCount ?? 0}
          sub="disponíveis há mais de 30 dias sem atribuição"
          accent={(data.assetsIdleCount ?? 0) > 0 ? 'amber' : 'slate'}
          icon={<Package size={20} />}
          onClick={() => navigate('/assets?status=AVAILABLE')}
        />
      </div>

      {/* Linha 3 — transferências + alertas */}
      <div className="grid grid-cols-2 gap-[14px]">
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold">Transferências aguardando aprovação</h3>
            <button type="button" onClick={() => navigate('/transfers')} className="text-[12px] text-blue-700 hover:underline font-medium">Ver todas →</button>
          </div>
          {pendingTransfers.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-slate-400 text-[13px]">
              <CheckCircle size={16} className="mr-2 text-emerald-500" />Nenhuma pendente
            </div>
          ) : (
            <ul className="space-y-px">
              {pendingTransfers.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-[9px] border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11.5px] text-blue-700 font-bold">{formatCode('TRF', t.id)}</div>
                    <div className="text-[12.5px] text-slate-700 mt-[1px]">
                      {resolveUnitName(t.fromUnitId, units)} → {resolveUnitName(t.toUnitId, units)}
                    </div>
                  </div>
                  <div className="flex gap-[5px]">
                    <button type="button" onClick={() => handleApprove(t.id)} disabled={actionLoadingId === t.id}
                      className="flex items-center gap-1 px-[10px] py-[5px] rounded-[6px] bg-emerald-600 text-white text-[11.5px] font-semibold hover:bg-emerald-700 transition disabled:opacity-50">
                      {actionLoadingId === t.id
                        ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <><CheckCircle size={11} /> Aprovar</>}
                    </button>
                    <button type="button" onClick={() => handleReject(t.id)} disabled={actionLoadingId === t.id}
                      className="w-[28px] h-[28px] rounded-[6px] border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition disabled:opacity-50">
                      <XCircle size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <OperationalGapsCard gaps={gaps} />
      </div>

      {/* Linha 4 — composição por tipo */}
  {byType.length > 0 && (
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <h3 className="text-[14px] font-bold mb-4">Composição do patrimônio por tipo</h3>
          <div className="grid grid-cols-4 gap-3">
            {byType.map(([type, count]) => {
              const pct = data.totalAssets > 0 ? Math.round((count / data.totalAssets) * 100) : 0
              return (
                <div key={type}
                  onClick={() => navigate(`/assets?type=${type}`)}
                  className="cursor-pointer bg-slate-50 rounded-[10px] border border-slate-200 px-4 py-3 hover:border-blue-300 hover:bg-blue-50 transition">
                  <div className="text-[22px] font-bold text-slate-800">{count}</div>
                  <div className="text-[13px] font-medium text-slate-600 mt-1">
                    {ASSET_TYPE_LABELS[type as keyof typeof ASSET_TYPE_LABELS] ?? type}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-[2px]">{pct}% do total</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
