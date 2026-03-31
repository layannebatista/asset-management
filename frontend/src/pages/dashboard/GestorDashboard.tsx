import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Wrench, ArrowLeftRight, TrendingUp, UserCheck } from 'lucide-react'
import { dashboardApi, maintenanceApi, transferApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { UnitDashboard, MaintenanceResponse } from '../../types'
import {
  MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS,
  formatCurrency, formatCode, formatDate,
} from '../../shared'

interface MetricCardProps {
  label: string; value: string | number; sub?: string
  accent: string; icon: React.ReactNode; alert?: boolean; onClick?: () => void
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
    <div onClick={onClick}
      className={`relative bg-white rounded-[12px] border shadow-sm overflow-hidden flex gap-4 items-center p-5 transition-all ${
        alert ? 'border-red-300 ring-1 ring-red-200' : 'border-slate-200'
      } ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      <div className={`w-[46px] h-[46px] rounded-[10px] flex-shrink-0 flex items-center justify-center ${c.bg} ${c.text}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
        <div className="text-[13px] text-slate-600 mt-[5px] font-medium">{label}</div>
        {sub && <div className="text-[11.5px] text-slate-400 mt-[2px]">{sub}</div>}
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${c.bar}`} />
    </div>
  )
}

export function GestorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<UnitDashboard | null>(null)
  const [openMaintenances, setOpenMaintenances] = useState<MaintenanceResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const unitId = user.unitId
    Promise.all([
      dashboardApi.unit(),
      maintenanceApi.list({
        size: 5,
        sort: 'createdAt,desc',
        ...(unitId ? { unitId } : {}),
        status: 'IN_PROGRESS',
      }),
    ])
      .then(([dash, maint]) => {
        setData(dash)
        setOpenMaintenances(Array.isArray(maint?.content) ? maint.content : [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (!user || loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">Nenhum dado disponível</div>

  const unitId = user.unitId
  const assigned = data.assetsByStatus?.ASSIGNED ?? 0
  const retired  = data.assetsByStatus?.RETIRED ?? 0
  const activeTotal = (data.totalAssets ?? 0) - retired
  const utilizationRate = data.utilizationRate ?? (activeTotal > 0 ? Math.round((assigned / activeTotal) * 100) : 0)
  const available = data.assetsAvailable ?? (data.assetsByStatus?.AVAILABLE ?? 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight">Painel da Unidade</h1>
        <p className="text-[13px] text-slate-500 mt-1">Indicadores operacionais da sua unidade</p>
      </div>

      <div className="grid grid-cols-3 gap-[14px]">
        {/* Ativos na unidade → lista todos os ativos da unidade */}
        <MetricCard
          label="Ativos na unidade"
          value={activeTotal.toLocaleString('pt-BR')}
          sub={`${available} disponível${available !== 1 ? 'is' : ''} para atribuição`}
          accent="blue" icon={<Package size={20} />}
          onClick={() => unitId ? navigate(`/assets?unitId=${unitId}`) : navigate('/assets')}
        />
        {/* Taxa de utilização → métrica calculada, não navegável */}
        <MetricCard
          label="Taxa de utilização"
          value={`${utilizationRate}%`}
          sub={`${assigned} atribuído${assigned !== 1 ? 's' : ''} de ${activeTotal} ativos`}
          accent={utilizationRate < 60 ? 'amber' : 'green'} icon={<TrendingUp size={20} />}
        />
        {/* Em manutenção → ordens abertas (REQUESTED + IN_PROGRESS) da unidade */}
        <MetricCard
          label="Em manutenção agora"
          value={data.totalMaintenance ?? 0}
          sub={`Custo real no mês: ${formatCurrency(data.maintenanceCostMonth ?? 0)}`}
          accent={(data.totalMaintenance ?? 0) > 5 ? 'red' : 'amber'}
          alert={(data.totalMaintenance ?? 0) > 5}
          icon={<Wrench size={20} />}
          onClick={() => unitId
            ? navigate(`/maintenance?unitId=${unitId}&status=OPEN`)
            : navigate('/maintenance?status=OPEN')
          }
        />
      </div>

      <div className="grid grid-cols-3 gap-[14px]">
        {/* Usuários na unidade → lista de usuários */}
        <MetricCard
          label="Usuários na unidade"
          value={data.totalUsers ?? 0}
          sub={`${Math.round((assigned / Math.max(data.totalUsers ?? 1, 1)) * 100)}% com ativo atribuído`}
          accent="purple" icon={<UserCheck size={20} />}
          onClick={() => navigate('/users')}
        />
        {/* Transferências pendentes → sempre navegável */}
        <MetricCard
          label="Transferências pendentes"
          value={data.pendingTransfersCount ?? 0}
          sub="de/para esta unidade"
          accent={(data.pendingTransfersCount ?? 0) > 0 ? 'amber' : 'slate'}
          icon={<ArrowLeftRight size={20} />}
          onClick={() => navigate('/transfers')}
        />
        {/* Ativos sem responsável → filtra AVAILABLE da unidade */}
        <MetricCard
          label="Ativos sem responsável"
          value={available}
          sub={available > 0 ? 'clique para atribuir' : 'todos os ativos têm responsável'}
          accent={available > 3 ? 'amber' : 'slate'}
          icon={<Package size={20} />}
          onClick={() => unitId
            ? navigate(`/assets?unitId=${unitId}&status=AVAILABLE`)
            : navigate('/assets?status=AVAILABLE')
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        {/* Manutenções em andamento */}
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold">Manutenções em andamento</h3>
            <button type="button"
              onClick={() => unitId
                ? navigate(`/maintenance?unitId=${unitId}&status=OPEN`)
                : navigate('/maintenance?status=OPEN')
              }
              className="text-[12px] text-blue-700 hover:underline font-medium">Ver todas →</button>
          </div>
          {openMaintenances.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">Nenhuma manutenção em andamento</div>
          ) : (
            <ul className="space-y-px">
              {openMaintenances.map((m) => (
                <li key={m.id} className="flex items-center gap-3 py-[9px] border-b border-slate-50 last:border-0">
                  <span className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full flex-shrink-0 ${
                    MAINTENANCE_STATUS_COLORS[m.status as keyof typeof MAINTENANCE_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'
                  }`}>
                    {MAINTENANCE_STATUS_LABELS[m.status as keyof typeof MAINTENANCE_STATUS_LABELS] ?? m.status}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11.5px] text-blue-700 font-bold">{formatCode('MNT', m.id)}</div>
                    <div className="text-[12px] text-slate-600 truncate" title={m.description}>{m.description}</div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex-shrink-0">{formatDate(m.createdAt)}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Ativos disponíveis sem responsável */}
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold">Ativos sem responsável</h3>
            {(data.assetsIdleList ?? []).length > 0 && (
              <button type="button"
                onClick={() => unitId
                  ? navigate(`/assets?unitId=${unitId}&status=AVAILABLE`)
                  : navigate('/assets?status=AVAILABLE')
                }
                className="text-[12px] text-blue-700 hover:underline font-medium">Atribuir →</button>
            )}
          </div>
          {(data.assetsIdleList ?? []).length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">
              Todos os ativos têm responsável
            </div>
          ) : (
            <ul className="space-y-px">
              {(data.assetsIdleList ?? []).slice(0, 5).map((a) => (
                <li key={a.assetTag} className="flex items-center justify-between py-[9px] border-b border-slate-50 last:border-0">
                  <div>
                    <div className="font-mono text-[12px] text-blue-700 font-bold">{a.assetTag}</div>
                    <div className="text-[12px] text-slate-600">{a.model}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold px-[8px] py-[2px] rounded-full bg-slate-100 text-slate-600">
                      {a.idleDays}d sem uso
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
