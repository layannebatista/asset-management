import { ASSET_STATUS_LABELS, ASSET_TYPE_LABELS } from '../../../../shared'
import type { AssetResponseExtended } from '../../AssetDetailsPage'
import type { ReactNode } from 'react'

interface TabInfoProps {
  asset: AssetResponseExtended
  orgName: string
  unitName: string
  userName: string
}

export function TabInfo({ asset, orgName, unitName, userName }: TabInfoProps) {
  const safe = (val: unknown): ReactNode => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-slate-400 italic">Não informado</span>
    }
    return String(val)
  }

  const fields = [
    { label: 'Código do Ativo', val: asset.assetTag },
    { label: 'Modelo', val: asset.model },
    { label: 'Tipo', val: ASSET_TYPE_LABELS[asset.type] ?? asset.type },
    { label: 'Status', val: ASSET_STATUS_LABELS[asset.status] ?? asset.status },
    { label: 'Organização', val: orgName },
    { label: 'Unidade', val: unitName },
    { label: 'Atribuído a', val: asset.assignedUserId ? userName : 'Nenhum' },
  ]

  return (
    <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm grid grid-cols-3 gap-4">
      {fields.map((f) => (
        <div key={f.label}>
          <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">
            {f.label}
          </div>
          <div className="text-[13.5px] font-semibold">
            {safe(f.val)}
          </div>
        </div>
      ))}
    </div>
  )
}