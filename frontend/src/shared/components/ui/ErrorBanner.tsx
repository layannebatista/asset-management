import { X } from 'lucide-react'

interface ErrorBannerProps {
  message: string
  onDismiss?: () => void
}

/** Faixa de erro vermelha com botão de fechar opcional */
export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  if (!message) return null

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="mb-4 bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700 flex items-center justify-between gap-3"
    >
      <span className="break-words">{message}</span>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fechar mensagem de erro"
          className="text-red-400 hover:text-red-600 flex-shrink-0"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}