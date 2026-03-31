import React from 'react'

interface KpiCardProps {
  label: string
  value: number | string
  sub?: string
  color: string
  icon: React.ReactNode
  onClick?: () => void
}

export function KpiCard({ label, value, sub, color, icon, onClick }: KpiCardProps) {
  const baseColor = color?.split(' ')?.[0] ?? 'bg-slate-200'

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-[12px] border border-slate-200 p-5 shadow-sm overflow-hidden flex gap-4 items-center ${
        onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''
      }`}
    >
      <div className={`w-[48px] h-[48px] rounded-[10px] flex-shrink-0 flex items-center justify-center ${color}`}>
        {icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[28px] font-bold tracking-tight leading-none">{value}</div>
        <div className="text-[13px] text-slate-500 mt-1 font-medium">{label}</div>
        {sub && <div className="text-[11.5px] text-slate-400 mt-[2px]">{sub}</div>}
      </div>

      <div className={`absolute bottom-0 left-0 right-0 h-[3px] ${baseColor}`} />
    </div>
  )
}