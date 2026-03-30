// ─── PageButton ───────────────────────────────────────────────────────────────

interface PageButtonProps {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

function PageButton({ label, active, disabled, onClick }: PageButtonProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (!disabled) onClick()
      }}
      disabled={disabled}
      className={`w-7 h-7 rounded-[6px] border-[1.5px] text-[12px] font-semibold flex items-center justify-center transition ${
        active
          ? 'bg-blue-700 text-white border-blue-700'
          : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 disabled:opacity-40'
      }`}
    >
      {label}
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalElements: number
  pageSize: number
  isFirst: boolean
  isLast: boolean
  onPageChange: (page: number) => void
  /** Quantos itens estão sendo exibidos nesta página */
  currentCount?: number
}

/**
 * Paginação com janela deslizante — sempre exibe a página atual no centro.
 * Corrige o bug presente em MaintenancePage e AuditPage onde a janela
 * ficava fixa nos primeiros índices independente da página atual.
 */
export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  isFirst,
  isLast,
  onPageChange,
  currentCount,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getRange = (): number[] => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i)

    const half = 2
    let start = Math.max(0, currentPage - half)
    let end = Math.min(totalPages - 1, currentPage + half)

    if (end - start < 4) {
      if (start === 0) end = Math.min(4, totalPages - 1)
      else start = Math.max(0, end - 4)
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const range = getRange()

  // FIX: evitar range inválido quando não há dados
  const displayFrom = totalElements === 0 ? 0 : currentPage * pageSize + 1
  const displayTo = Math.min((currentPage + 1) * pageSize, totalElements)

  // FIX: cálculo correto do range exibido
  const from = totalElements === 0
    ? 0
    : currentPage * pageSize + 1

  const to = totalElements === 0
    ? 0
    : currentPage * pageSize + (currentCount ?? pageSize)

  return (
    <div className="flex items-center justify-between px-4 py-[11px] border-t border-slate-100">
      <span className="text-[13px] text-slate-500">
        Exibindo{' '}
        <strong>
          {from}–{Math.min(to, totalElements)}
        </strong>{' '}
        de <strong>{totalElements}</strong>
      </span>

      <div className="flex gap-1">
        <PageButton
          label="‹"
          disabled={isFirst}
          onClick={() => onPageChange(currentPage - 1)}
        />

        {currentPage > 2 && totalPages > 5 && (
          <>
            <PageButton label="1" onClick={() => onPageChange(0)} />
            {currentPage > 3 && (
              <span className="flex items-center px-1 text-slate-400 text-[12px]">…</span>
            )}
          </>
        )}

        {range.map((i) => (
          <PageButton
            key={i}
            label={String(i + 1)}
            active={i === currentPage}
            onClick={() => onPageChange(i)}
          />
        ))}

        {currentPage < totalPages - 3 && totalPages > 5 && (
          <>
            {currentPage < totalPages - 4 && (
              <span className="flex items-center px-1 text-slate-400 text-[12px]">…</span>
            )}
            <PageButton
              label={String(totalPages)}
              onClick={() => onPageChange(totalPages - 1)}
            />
          </>
        )}

        <PageButton
          label="›"
          disabled={isLast}
          onClick={() => onPageChange(currentPage + 1)}
        />
      </div>
    </div>
  )
}