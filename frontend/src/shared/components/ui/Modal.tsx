import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

/**
 * Modal genérico reutilizável.
 * Fecha ao clicar no backdrop.
 */
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-[520px]' }: ModalProps) {
  // ESC para fechar
  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // lock scroll do body
  useEffect(() => {
    if (!open) return

    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = original
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white rounded-[14px] w-full ${maxWidth} shadow-[0_25px_60px_rgba(0,0,0,0.25)] max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 id="modal-title" className="text-[17px] font-bold">
            {title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}