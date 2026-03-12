import { useEffect, useState } from 'react'
import { FileDown, Package, Wrench, Shield } from 'lucide-react'
import { exportApi, depreciationApi } from '../../api'
import type { PortfolioDepreciation } from '../../types'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [portfolio, setPortfolio] = useState<PortfolioDepreciation | null>(null)

  useEffect(() => {
    depreciationApi.getPortfolio().then(setPortfolio).catch(() => {})
  }, [])

  const reports = [
    {
      title: 'Exportar Ativos',
      desc: 'Todos os ativos com status, unidade, responsavel e tipo.',
      icon: <Package size={20} />,
      color: 'bg-blue-100 text-blue-700',
      roles: 'ADMIN / GESTOR',
      fn: () => exportApi.downloadAssets(),
    },
    {
      title: 'Exportar Manutencoes',
      desc: 'Ordens de servico com filtro de periodo.',
      icon: <Wrench size={20} />,
      color: 'bg-amber-100 text-amber-700',
      roles: 'ADMIN / GESTOR',
      fn: () => exportApi.downloadMaintenance(startDate || undefined, endDate || undefined),
    },
    {
      title: 'Exportar Auditoria',
      desc: 'Log de eventos com filtro de periodo. Apenas ADMIN.',
      icon: <Shield size={20} />,
      color: 'bg-purple-100 text-purple-700',
      roles: 'ADMIN only',
      fn: () => exportApi.downloadAudit(startDate || undefined, endDate || undefined),
    },
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold tracking-tight">Relatorios e Exportacoes</h1>
        <p className="text-[13px] text-slate-500 mt-1">Exporte dados em CSV por modulo</p>
      </div>

      <div className="flex gap-3 items-center mb-6 bg-white rounded-[10px] border border-slate-200 p-4 shadow-sm">
        <span className="text-[13px] font-semibold text-slate-600">Periodo:</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[7px] text-[13px] outline-none"
        />
        <span className="text-slate-400">ate</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[7px] text-[13px] outline-none"
        />
      </div>

      <div className="grid grid-cols-3 gap-[14px] mb-6">
        {reports.map((r) => (
          <div
            key={r.title}
            className="bg-white rounded-[10px] border border-slate-200 p-[22px] shadow-sm hover:shadow-md transition-all"
          >
            <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center mb-4 ${r.color}`}>
              {r.icon}
            </div>
            <div className="text-[14px] font-bold mb-[6px]">{r.title}</div>
            <div className="text-[12.5px] text-slate-400 leading-relaxed mb-4">{r.desc}</div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">{r.roles}</span>
              <button
                onClick={r.fn}
                className="flex items-center gap-2 px-3 py-[6px] rounded-[7px] bg-blue-700 text-white text-[12px] font-semibold hover:bg-blue-800 transition"
              >
                <FileDown size={12} />
                Baixar CSV
              </button>
            </div>
          </div>
        ))}
      </div>

      {portfolio && (
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <h3 className="text-[13.5px] font-bold mb-4">Depreciacao do Portfolio</h3>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-[.4px] mb-1">Valor de Compra</div>
              <div className="text-[18px] font-bold">
                {portfolio.totalPurchaseValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-[.4px] mb-1">Valor Atual</div>
              <div className="text-[18px] font-bold text-blue-700">
                {portfolio.totalCurrentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-[.4px] mb-1">Total Depreciado</div>
              <div className="text-[18px] font-bold text-red-600">
                {portfolio.totalDepreciation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400 uppercase tracking-[.4px] mb-1">% Depreciado</div>
              <div className="text-[18px] font-bold text-amber-600">
                {portfolio.depreciationPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-700"
              style={{ width: `${100 - portfolio.depreciationPercentage}%` }}
            />
          </div>
          <div className="text-[11.5px] text-slate-400 mt-2">
            {(100 - portfolio.depreciationPercentage).toFixed(1)}% do valor patrimonial ativo - {portfolio.totalAssets} ativos
          </div>
        </div>
      )}
    </div>
  )
}
