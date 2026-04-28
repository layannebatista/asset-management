import type { ReactNode } from 'react'

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps {
  label: string
  children: ReactNode
  htmlFor?: string
}

/** Label + conteúdo de campo de formulário com espaçamento padronizado */
export function Field({ label, children, htmlFor }: FieldProps) {
  return (
    <div className="mb-[14px]">
      <label
        htmlFor={htmlFor}
        className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]"
      >
        {label}
      </label>
      {children}
    </div>
  )
}

// ─── ModalFooter ──────────────────────────────────────────────────────────────

interface ModalFooterProps {
  onCancel: () => void
  onConfirm: () => void
  loading?: boolean
  /** Texto do botão de confirmação */
  confirmLabel: string
  disabled?: boolean
  cancelTestId?: string
  confirmTestId?: string
}

/** Rodapé padronizado para modais: botão Cancelar + botão de confirmação */
export function ModalFooter({
  onCancel,
  onConfirm,
  loading,
  confirmLabel,
  disabled,
  cancelTestId,
  confirmTestId,
}: ModalFooterProps) {
  const isDisabled = loading || disabled

  return (
    <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 mt-3">
      <button
        type="button"
        data-testid={cancelTestId}
        onClick={onCancel}
        className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        Cancelar
      </button>

      <button
        type="button"
        data-testid={confirmTestId}
        onClick={() => {
          if (!isDisabled) onConfirm()
        }}
        disabled={isDisabled}
        className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Salvando...' : confirmLabel}
      </button>
    </div>
  )
}