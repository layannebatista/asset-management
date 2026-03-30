import { useEffect, useState } from 'react'
import { FileDown, Package, Wrench, Shield } from 'lucide-react'
import { exportApi, depreciationApi } from '../../api'
import type { PortfolioDepreciation } from '../../types'
import {
  DateRangeFilter,
  DepreciationBar,
  formatCurrency,
  ErrorBanner,
} from '../../shared'

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [portfolio, setPortfolio] = useState<PortfolioDepreciation | null>(null)
  const [loadingPortfolio, setLoadingPortfolio] = useState(true)

  const [exporting, setExporting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoadingPortfolio(true)

    depreciationApi
      .getPortfolio()
      .then((data) => setPortfolio(data ?? null))
      .catch(() => {
        // Gestor pode não ter permissão ou não haver dados — não exibir erro, apenas sem dados
        setPortfolio(null)
      })
      .finally(() => setLoadingPortfolio(false))
  }, [])

  const dateError =
    startDate && endDate && endDate < startDate
      ? 'A data final deve ser posterior à data inicial'
      : ''

  const handleExport = async (type: string, fn: () => Promise<any>) => {
    if (exporting) return

    setExporting(type)
    setError('')

    try {
      await fn()
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
        'Erro ao exportar relatório'
      )
    } finally {
      setExporting(null)
    }
  }

  const reports = [
    {
      key: 'assets',
      title: 'Exportar Ativos',
      desc: 'Todos os ativos com status, unidade, responsável e tipo.',
      icon: <Package size={20} />,
      color: 'bg-blue-100 text-blue-700',
      fn: () => exportApi.downloadAssets(startDate || undefined, endDate || undefined),
    },
    {
      key: 'maintenance',
      title: 'Exportar Manutenções',
      desc: 'Ordens de serviço com filtro de período.',
      icon: <Wrench size={20} />,
      color: 'bg-amber-100 text-amber-700',
      fn: () => exportApi.downloadMaintenance(startDate || undefined, endDate || undefined),
    },
    {
      key: 'audit',
      title: 'Exportar Auditoria',
      desc: 'Log de eventos com filtro de período.',
      icon: <Shield size={20} />,
      color: 'bg-purple-100 text-purple-700',
      fn: () => exportApi.downloadAudit(startDate || undefined, endDate || undefined),
    },
  ]

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold tracking-tight">
          Relatórios e Exportações
        </h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Exporte dados em CSV por módulo
        </p>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Filtro */}
      <div className="flex gap-3 items-end mb-6 bg-white rounded-[10px] border border-slate-200 p-4 shadow-sm flex-wrap">
        <span className="text-[13px] font-semibold text-slate-600">
          Período:
        </span>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartChange={setStartDate}
          onEndChange={setEndDate}
          onClear={() => {
            setStartDate('')
            setEndDate('')
          }}
          error={dateError}
        />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-3 gap-[14px] mb-6">
        {reports.map((r) => (
          <div
            key={r.key}
            className="bg-white rounded-[10px] border border-slate-200 p-[22px] shadow-sm hover:shadow-md transition-all"
          >
            <div className={`w-11 h-11 rounded-[10px] flex items-center justify-center mb-4 ${r.color}`}>
              {r.icon}
            </div>

            <div className="text-[14px] font-bold mb-[6px]">
              {r.title}
            </div>

            <div className="text-[12.5px] text-slate-400 leading-relaxed mb-4">
              {r.desc}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleExport(r.key, r.fn)}
                disabled={!!dateError || exporting !== null}
                className="flex items-center gap-2 px-3 py-[6px] rounded-[7px] bg-blue-700 text-white text-[12px] font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting === r.key ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown size={12} /> Baixar CSV
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Depreciação */}
      <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
        <h3 className="text-[13.5px] font-bold mb-4">
          Depreciação do Portfólio
        </h3>

        {loadingPortfolio ? (
          <div className="text-center py-6 text-slate-400">
            Carregando...
          </div>
        ) : !portfolio ? (
          <div className="text-center py-6 text-slate-400">
            Nenhum dado disponível
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Valor de Compra', val: formatCurrency(portfolio.totalPurchaseValue), color: '' },
                { label: 'Valor Atual', val: formatCurrency(portfolio.totalCurrentValue), color: 'text-blue-700' },
                { label: 'Total Depreciado', val: formatCurrency(portfolio.totalDepreciation), color: 'text-red-600' },
                { label: '% Depreciado', val: `${portfolio.depreciationPercentage.toFixed(1)}%`, color: 'text-amber-600' },
              ].map((f) => (
                <div key={f.label}>
                  <div className="text-[11px] text-slate-400 uppercase tracking-[.4px] mb-1">
                    {f.label}
                  </div>
                  <div className={`text-[18px] font-bold ${f.color}`}>
                    {f.val}
                  </div>
                </div>
              ))}
            </div>

            <DepreciationBar depreciationPercentage={portfolio.depreciationPercentage} />

            <div className="text-[11.5px] text-slate-400 mt-1">
              {portfolio.totalAssets} ativos no portfólio
            </div>
          </>
        )}
      </div>
    </div>
  )
}