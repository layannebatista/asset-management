interface DepreciationBarProps {
  /** Percentual já depreciado (0–100) */
  depreciationPercentage: number
  className?: string
}

/**
 * Barra de progresso visual de depreciação.
 * Compartilhada entre AssetDetailPage (aba Depreciação) e ReportsPage.
 * A barra representa o valor RESTANTE (não depreciado).
 */
export function DepreciationBar({ depreciationPercentage, className = '' }: DepreciationBarProps) {
  // FIX: garantir número válido
  const safeDepreciation = Number.isFinite(depreciationPercentage) ? depreciationPercentage : 0

  // FIX: clamp 0–100
  const clamped = Math.min(100, Math.max(0, safeDepreciation))

  const remaining = 100 - clamped

  return (
    <div className={className}>
      <div
        className="h-[8px] bg-slate-100 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={remaining}
        aria-label="Percentual de valor patrimonial restante"
      >
        <div
          className="h-full rounded-full bg-blue-700 transition-all"
          style={{ width: `${remaining}%` }}
        />
      </div>
      <div className="text-[11.5px] text-slate-400 mt-2">
        {remaining.toFixed(1)}% do valor patrimonial ainda ativo
      </div>
    </div>
  )
}