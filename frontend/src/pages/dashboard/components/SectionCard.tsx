import React from 'react'

interface SectionCardProps {
  title: string
  action?: string
  onAction?: () => void
  children: React.ReactNode
}

export function SectionCard({ title, action, onAction, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-[12px] border border-slate-200 p-[18px] shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[14px] font-bold">{title}</h3>

        {action && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="text-[12px] text-blue-700 hover:underline font-medium"
          >
            {action} →
          </button>
        )}
      </div>

      {children}
    </div>
  )
}