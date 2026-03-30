import { Pencil } from 'lucide-react'
import type { AssetDepreciation } from '../../../../types'
import { formatCurrency } from '../../../../shared'

const DEP_METHOD_LABELS: Record<string, string> = {
  LINEAR: 'Linear',
  DECLINING_BALANCE: 'Saldo Decrescente',
  SUM_OF_YEARS: 'Soma dos Dígitos',
}

interface TabDepreciationProps {
  dep: AssetDepreciation | null
  onEdit: () => void
  canEdit: boolean
}

export function TabDepreciation({ dep, onEdit, canEdit }: TabDepreciationProps) {
  const remaining = dep
    ? Math.max(0, Math.min(100, 100 - dep.depreciationPercentage))
    : 0

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
          >
            <Pencil size={14} />
            {dep ? 'Editar Dados Financeiros' : 'Cadastrar Dados Financeiros'}
          </button>
        </div>
      )}

      {dep ? (
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Valor de Compra', val: formatCurrency(dep.purchaseValue) },
              { label: 'Valor Atual', val: formatCurrency(dep.currentValue) },
              { label: 'Depreciado', val: `${dep.depreciationPercentage.toFixed(1)}%` },
              { label: 'Método', val: DEP_METHOD_LABELS[dep.depreciationMethod] ?? dep.depreciationMethod },
              { label: 'Meses Decorridos', val: `${dep.elapsedMonths} / ${dep.usefulLifeMonths}` },
              { label: 'Totalmente Depreciado', val: dep.fullyDepreciated ? 'Sim' : 'Não' },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">
                  {f.label}
                </div>
                <div className="text-[13.5px] font-semibold">{f.val}</div>
              </div>
            ))}
          </div>

          <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-700"
              style={{ width: `${remaining}%` }}
            />
          </div>

          <div className="text-[11.5px] text-slate-400 mt-2">
            {remaining.toFixed(1)}% do valor patrimonial ainda ativo
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-slate-200 p-10 text-center text-slate-400 shadow-sm">
          Sem dados de depreciação para este ativo
        </div>
      )}
    </div>
  )
}