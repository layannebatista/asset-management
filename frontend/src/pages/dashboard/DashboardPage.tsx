import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Wrench, ArrowLeftRight, Shield, CheckCircle, XCircle } from 'lucide-react'
import { dashboardApi, transferApi, insuranceApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { ExecutiveDashboard, TransferResponse, AssetInsurance } from '../../types'

// ─── Small helpers ────────────────────────────────────────────────────────────
function KpiCard({ label, value, trend, trendUp, color, icon, onClick }: {
  label: string; value: number | string; trend?: string; trendUp?: boolean
  color: string; icon: React.ReactNode; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-[10px] border border-slate-200 p-5 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-px transition-all' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className={`w-[38px] h-[38px] rounded-[8px] flex items-center justify-center ${color}`}>{icon}</div>
        {trend && (
          <span className={`text-[11px] font-bold px-2 py-[3px] rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
      <div className="text-[26px] font-bold tracking-tight leading-none">{value}</div>
      <div className="text-[12.5px] text-slate-500 mt-1">{label}</div>
      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${color.replace('bg-', 'bg-').split(' ')[0]}`} />
    </div>
  )
}

function SectionCard({ title, action, onAction, children }: {
  title: string; action?: string; onAction?: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[13.5px] font-bold">{title}</h3>
        {action && (
          <button onClick={onAction} className="text-[12px] text-blue-700 hover:underline font-medium">{action} →</button>
        )}
      </div>
      {children}
    </div>
  )
}

// Converte Map<string, number> em array ordenado [{ month, count }]
function mapToMonthArray(map: Record<string, number> | null | undefined): { month: string; count: number }[] {
  if (!map) return []
  return Object.entries(map)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const { isAdmin } = useAuth()
  const [data, setData] = useState<ExecutiveDashboard | null>(null)
  const [pendingTransfers, setPendingTransfers] = useState<TransferResponse[]>([])
  const [expiringInsurance, setExpiringInsurance] = useState<AssetInsurance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardApi.executive(),
      transferApi.list({ status: 'PENDING', size: 5 }),
      insuranceApi.getExpiring(30),
    ]).then(([dash, transfers, insurance]) => {
      setData(dash)
      setPendingTransfers(transfers.content)
      setExpiringInsurance(insurance.slice(0, 5))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full text-slate-400">Carregando...</div>
  if (!data) return null

  const statusColors: Record<string, string> = {
    AVAILABLE: '#1d4ed8', ASSIGNED: '#60a5fa', MAINTENANCE: '#f59e0b', RETIRED: '#94a3b8', TRANSFER: '#7c3aed',
  }
  const statusLabels: Record<string, string> = {
    AVAILABLE: 'Disponível', ASSIGNED: 'Atribuído', MAINTENANCE: 'Manutenção', RETIRED: 'Aposentado', TRANSFER: 'Trânsito',
  }

  const assetsByStatus = data.assetsByStatus ?? {}
  const maxBar = Math.max(...Object.values(assetsByStatus), 1)

  const maintenanceByMonth = mapToMonthArray(data.maintenanceByMonth as unknown as Record<string, number>).slice(-6)
  const maxMaint = Math.max(...maintenanceByMonth.map((x) => x.count), 1)

  const transferByStatus = data.transferByStatus ?? {}

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-[13px] text-slate-500 mt-1">Visão executiva — ativos, manutenção, depreciação e alertas</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-[14px] mb-5">
        <KpiCard label="Total de Ativos" value={(data.totalAssets ?? 0).toLocaleString('pt-BR')}
          trend="+12%" trendUp color="bg-blue-100 text-blue-700" icon={<Package size={17} />}
          onClick={() => navigate('/assets')} />
        <KpiCard label="Em Manutenção" value={data.totalMaintenance ?? 0}
          trend="-5%" trendUp={false} color="bg-amber-100 text-amber-700" icon={<Wrench size={17} />}
          onClick={() => navigate('/maintenance')} />
        <KpiCard label="Transferências Ativas" value={Object.values(transferByStatus).reduce((a, b) => a + b, 0)}
          trend="+8%" trendUp color="bg-emerald-100 text-emerald-700" icon={<ArrowLeftRight size={17} />}
          onClick={() => navigate('/transfers')} />
        <KpiCard label="Seguros Vencendo (30d)" value={expiringInsurance.length}
          trend="+2" trendUp={false} color="bg-red-100 text-red-700" icon={<Shield size={17} />} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-[14px] mb-5">
        {/* Status bar chart */}
        <div className="col-span-2 bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13.5px] font-bold">Distribuição por Status</h3>
            <span className="text-[11.5px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Hoje</span>
          </div>
          <div className="flex items-end gap-2 h-[120px]">
            {Object.entries(assetsByStatus).map(([status, count]) => (
              <div key={status} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-slate-400">{count}</span>
                <div
                  className="w-full rounded-t-[4px] min-h-[4px]"
                  style={{ height: `${((count as number) / maxBar) * 100}%`, background: statusColors[status] ?? '#94a3b8' }}
                />
                <span className="text-[10px] text-slate-400 text-center leading-tight">
                  {statusLabels[status] ?? status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Manutenção por mês */}
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <h3 className="text-[13.5px] font-bold mb-4">Manutenção / Mês</h3>
          {maintenanceByMonth.length === 0 ? (
            <p className="text-[12px] text-slate-400 text-center py-8">Sem dados</p>
          ) : (
            <div className="flex items-end gap-1 h-[120px]">
              {maintenanceByMonth.map((m) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-slate-400">{m.count}</span>
                  <div
                    className="w-full rounded-t-[4px] min-h-[4px] bg-amber-500"
                    style={{ height: `${(m.count / maxMaint) * 100}%` }}
                  />
                  <span className="text-[9px] text-slate-400">{m.month.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-2 gap-[14px] mb-5">
        {/* Pending transfers */}
        <SectionCard title="⏳ Transferências Pendentes de Aprovação" action="Ver todas" onAction={() => navigate('/transfers')}>
          {pendingTransfers.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-4">Nenhuma pendente</p>
          ) : (
            <ul className="space-y-px">
              {pendingTransfers.map((t) => (
                <li key={t.id} className="flex items-center gap-[10px] py-[9px] border-b border-slate-50 last:border-0">
                  <div className="w-[34px] h-[34px] rounded-[8px] bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ArrowLeftRight size={15} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[11px] text-blue-700">TRF-{String(t.id).padStart(4, '0')}</div>
                    <div className="text-[12.5px] text-slate-600 truncate">Unidade {t.fromUnitId} → Unidade {t.toUnitId}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => transferApi.approve(t.id)}
                      className="w-7 h-7 rounded-[6px] border border-emerald-200 bg-white flex items-center justify-center hover:bg-emerald-50 transition group relative"
                    >
                      <CheckCircle size={13} className="text-emerald-600" />
                      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] px-2 py-[3px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">Aprovar</span>
                    </button>
                    <button
                      onClick={() => transferApi.reject(t.id)}
                      className="w-7 h-7 rounded-[6px] border border-red-200 bg-white flex items-center justify-center hover:bg-red-50 transition group relative"
                    >
                      <XCircle size={13} className="text-red-500" />
                      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] px-2 py-[3px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition">Rejeitar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        {/* Expiring insurance */}
        <SectionCard title="🛡️ Seguros Vencendo em 30 dias" action="Ver relatório" onAction={() => navigate('/reports')}>
          {expiringInsurance.length === 0 ? (
            <p className="text-[13px] text-slate-400 text-center py-4">Nenhum vencendo em breve</p>
          ) : (
            <ul className="space-y-px">
              {expiringInsurance.map((ins) => {
                const daysLeft = Math.ceil((new Date(ins.expiryDate).getTime() - Date.now()) / 86400000)
                const urgent = daysLeft <= 7
                return (
                  <li key={ins.id} className="flex items-center gap-[10px] py-[9px] border-b border-slate-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-blue-700">Ativo #{ins.assetId}</div>
                      <div className="text-[12.5px] text-slate-600 truncate">{ins.insurer} · {ins.policyNumber}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-[13px] font-bold ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
                        {new Date(ins.expiryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-[2px] rounded-full ${urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {daysLeft}d
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      {/* Portfolio depreciation — admin only */}
      {isAdmin && (
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[13.5px] font-bold">💰 Depreciação do Portfólio</h3>
            <button onClick={() => navigate('/reports')} className="text-[12px] text-blue-700 hover:underline font-medium">Ver relatório completo →</button>
          </div>
          <p className="text-[12.5px] text-slate-500">
            Acesse Relatórios → Depreciação para ver o breakdown completo por ativo com valor de compra, valor atual, método e percentual depreciado.
          </p>
        </div>
      )}
    </div>
  )
}
