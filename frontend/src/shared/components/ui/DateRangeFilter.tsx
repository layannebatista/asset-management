interface DateRangeFilterProps {
  startDate: string
  endDate: string
  onStartChange: (val: string) => void
  onEndChange: (val: string) => void
  onClear: () => void
  error?: string
}

/**
 * Seletor De/Até com validação e botão de limpar.
 * Compartilhado entre AuditPage e ReportsPage.
 */
export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
  error,
}: DateRangeFilterProps) {
  const hasValues = Boolean(startDate || endDate)

  return (
    <div className="flex gap-3 flex-wrap items-end">
      <div>
        <label
          htmlFor="start-date"
          className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[5px]"
        >
          De
        </label>
        <input
          id="start-date"
          type="date"
          value={startDate}
          max={endDate || undefined}
          onChange={(e) => onStartChange(e.target.value)}
          className={`border-[1.5px] rounded-[7px] px-3 py-[7px] text-[13px] bg-slate-50 outline-none ${
            error ? 'border-red-400' : 'border-slate-200'
          }`}
        />
      </div>
      <div>
        <label
          htmlFor="end-date"
          className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[5px]"
        >
          Até
        </label>
        <input
          id="end-date"
          type="date"
          value={endDate}
          min={startDate || undefined}
          onChange={(e) => onEndChange(e.target.value)}
          className={`border-[1.5px] rounded-[7px] px-3 py-[7px] text-[13px] bg-slate-50 outline-none ${
            error ? 'border-red-400' : 'border-slate-200'
          }`}
        />
      </div>

      {hasValues && (
        <button
          type="button"
          onClick={onClear}
          className="text-[12px] text-slate-400 hover:text-slate-600 transition"
        >
          Limpar período
        </button>
      )}

      {error && (
        <p className="text-[12px] text-red-500 w-full -mt-1">
          {error}
        </p>
      )}
    </div>
  )
}