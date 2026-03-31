import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Wrench, ArrowLeftRight } from 'lucide-react'
import { dashboardApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { PersonalDashboard } from '../../types'
import {
  ASSET_STATUS_LABELS, ASSET_STATUS_COLORS,
  MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS,
  ASSET_TYPE_LABELS,
  formatCode, formatDate,
} from '../../shared'

interface MetricCardProps {
  label: string; value: string | number; sub?: string
  accent: string; icon: React.ReactNode; onClick?: () => void
}
function MetricCard({ label, value, sub, accent, icon, onClick }: MetricCardProps) {
  const accentMap: Record<string, { bg: string; text: string; bar: string }> = {
    blue:   { bg: 'bg-blue-100',    text: 'text-blue-700',    bar: 'bg-blue-500' },
    amber:  { bg: 'bg-amber-100',   text: 'text-amber-700',   bar: 'bg-amber-500' },
    purple: { bg: 'bg-violet-100',  text: 'text-violet-700',  bar: 'bg-violet-500' },
    slate:  { bg: 'bg-slate-100',   text: 'text-slate-600',   bar: 'bg-slate-400' },
    green:  { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  }
  const c = accentMap[accent] ?? accentMap.slate
  return (
    <div onClick={onClick}
      className={`relative bg-white rounded-[12px] border border-slate-200 shadow-sm overflow-hidden flex gap-4 items-center p-5 transition-all ${onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
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

export function OperadorDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<PersonalDashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    dashboardApi.personal()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user])

  if (!user || loading) return <div className="flex items-center justify-center h-64 text-slate-400">Carregando...</div>
  if (!data) return <div className="flex items-center justify-center h-64 text-slate-400">Nenhum dado disponível</div>

  const userId = user.userId
  const myAssets = data.myAssets ?? []
  const myMaintenances = data.myOpenMaintenances ?? []
  const inMaintCount = myAssets.filter((a) => a.status === 'IN_MAINTENANCE').length

  // URL base para manutenções do operador — usa requestedByUserId que é o param correto da API
  const maintUrl = userId
    ? `/maintenance?requestedByUserId=${userId}&status=OPEN`
    : '/maintenance?status=OPEN'

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-bold tracking-tight">Meu Painel</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Olá{user.name ? `, ${user.name.split(' ')[0]}` : ''}. Aqui estão seus ativos e solicitações.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-[14px]">
        {/* Meus ativos → filtra por assignedUserId */}
        <MetricCard
          label="Meus ativos"
          value={data.totalAssetsAssigned ?? 0}
          sub={inMaintCount > 0 ? `${inMaintCount} em manutenção` : 'todos em uso normal'}
          accent="blue" icon={<Package size={20} />}
          onClick={() => userId ? navigate(`/assets?assignedUserId=${userId}`) : navigate('/assets')}
        />
        {/* Manutenções abertas → filtra por requestedByUserId + status=OPEN */}
        <MetricCard
          label="Manutenções abertas"
          value={myMaintenances.length}
          sub={myMaintenances.length > 0 ? 'clique para acompanhar' : 'nenhuma ordem em aberto'}
          accent={myMaintenances.length > 0 ? 'amber' : 'slate'}
          icon={<Wrench size={20} />}
          onClick={() => navigate(maintUrl)}
        />
        {/* Transferências → sempre navegável */}
        <MetricCard
          label="Transferências em andamento"
          value={data.myPendingTransfers ?? 0}
          sub={(data.myPendingTransfers ?? 0) > 0 ? 'aguardando aprovação' : 'nenhuma em trânsito'}
          accent={(data.myPendingTransfers ?? 0) > 0 ? 'purple' : 'slate'}
          icon={<ArrowLeftRight size={20} />}
          onClick={() => navigate('/transfers')}
        />
      </div>

      <div className="grid grid-cols-2 gap-[14px]">
        {/* Lista dos meus ativos */}
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold">Meus ativos</h3>
            {myAssets.length > 0 && (
              <button type="button"
                onClick={() => userId ? navigate(`/assets?assignedUserId=${userId}`) : navigate('/assets')}
                className="text-[12px] text-blue-700 hover:underline font-medium">Ver todos →</button>
            )}
          </div>
          {myAssets.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">
              <Package size={28} className="mx-auto mb-2 opacity-30" />
              Nenhum ativo atribuído a você
            </div>
          ) : (
            <ul className="space-y-px">
              {myAssets.map((a) => (
                <li key={a.assetTag} className="flex items-center gap-3 py-[10px] border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-blue-700 font-bold">{a.assetTag}</span>
                      <span className="text-[11px] text-slate-400">
                        {ASSET_TYPE_LABELS[a.type as keyof typeof ASSET_TYPE_LABELS] ?? a.type}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-slate-600 mt-[1px]">{a.model}</div>
                    {a.assignedSince && (
                      <div className="text-[11px] text-slate-400">desde {formatDate(a.assignedSince)}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${ASSET_STATUS_COLORS[a.status as keyof typeof ASSET_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'}`}>
                      {ASSET_STATUS_LABELS[a.status as keyof typeof ASSET_STATUS_LABELS] ?? a.status}
                    </span>
                    {a.maintenanceCode && (
                      <span className="font-mono text-[10.5px] text-amber-600">{a.maintenanceCode}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Manutenções abertas */}
        <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-[14px] font-bold">Minhas manutenções</h3>
            {myMaintenances.length > 0 && (
              <button type="button"
                onClick={() => navigate(maintUrl)}
                className="text-[12px] text-blue-700 hover:underline font-medium">Ver todas →</button>
            )}
          </div>
          {myMaintenances.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-[13px]">
              <Wrench size={28} className="mx-auto mb-2 opacity-30" />
              Nenhuma manutenção em aberto
            </div>
          ) : (
            <ul className="space-y-px">
              {myMaintenances.map((m) => (
                <li key={m.code} className="flex items-center gap-3 py-[10px] border-b border-slate-50 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px] text-blue-700 font-bold">{m.code}</span>
                      <span className="font-mono text-[11px] text-slate-400">{m.assetTag}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-[1px]">Aberta em {formatDate(m.createdAt)}</div>
                  </div>
                  <span className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full flex-shrink-0 ${MAINTENANCE_STATUS_COLORS[m.status as keyof typeof MAINTENANCE_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'}`}>
                    {MAINTENANCE_STATUS_LABELS[m.status as keyof typeof MAINTENANCE_STATUS_LABELS] ?? m.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
