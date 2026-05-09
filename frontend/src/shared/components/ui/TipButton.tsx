import type { ReactNode } from 'react'

interface TipButtonProps {
  tip: string
  onClick?: () => void
  danger?: boolean
  disabled?: boolean
  testId?: string
  /** Exibe spinner de loading no lugar do children */
  loading?: boolean
  children: ReactNode
}

/**
 * Botão quadrado pequeno com tooltip no hover.
 * Versão canônica — suporta loading com spinner, danger e disabled.
 */
export function TipButton({ tip, onClick, danger, disabled, testId, loading, children }: TipButtonProps) {
  const isDisabled = disabled || loading

  return (
    <div className="relative group">
      <button
        type="button"
        data-testid={testId}
        title={tip}
        aria-label={tip}
        onClick={() => {
          if (!isDisabled && onClick) onClick()
        }}
        disabled={isDisabled}
        className={`w-[28px] h-[28px] rounded-[6px] border flex items-center justify-center transition disabled:opacity-40 disabled:cursor-not-allowed ${
          danger
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        {loading ? (
          <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          children
        )}
      </button>

      <div
        role="tooltip"
        className="absolute bottom-full mb-[6px] left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-[3px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity"
      >
        {tip}
      </div>
    </div>
  )
}