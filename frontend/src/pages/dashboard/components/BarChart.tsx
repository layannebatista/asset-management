import React from 'react'

interface BarChartProps {
  items: [string, number][]
  colorMap: Record<string, string>
  labelMap: Record<string, string>
  height?: number
}

export function BarChart({ items, colorMap, labelMap, height = 140 }: BarChartProps) {
  const values = items.map(([, v]) => v)
  const max = values.length > 0 ? Math.max(...values) : 1

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {items.map(([key, val]) => (
        <div key={key} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-[11px] text-slate-500 font-semibold">{val}</span>
          <div
            className="w-full rounded-t-[5px] min-h-[4px] transition-all"
            style={{
              height: `${(val / max) * (height - 32)}px`,
              background: colorMap[key] ?? '#94a3b8'
            }}
          />
          <span className="text-[10.5px] text-slate-400 text-center leading-tight break-words w-full">
            {labelMap[key] ?? key}
          </span>
        </div>
      ))}
    </div>
  )
}