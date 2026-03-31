import { useState } from 'react'
import type { AssetStatusHistory, AssetAssignmentHistory, UserResponse } from '../../../../types'
import { ASSET_STATUS_LABELS, resolveUserName, formatDateTime } from '../../../../shared'

interface TabHistoryProps {
  history: AssetStatusHistory[]
  assignmentHistory: AssetAssignmentHistory[]
  users: UserResponse[]
}

export function TabHistory({ history, assignmentHistory, users }: TabHistoryProps) {
  const [historyTab, setHistoryTab] = useState<'status' | 'assignment'>('status')

  return (
    <div>
      <div className="flex gap-1 mb-4">
        {(['status', 'assignment'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setHistoryTab(t)}
            className={`px-3 py-[6px] rounded-[6px] text-[12.5px] font-semibold border-[1.5px] transition ${
              historyTab === t
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
            }`}
          >
            {t === 'status'
              ? `Mudanças de Status (${history.length})`
              : `Atribuições (${assignmentHistory.length})`
            }
          </button>
        ))}
      </div>

      {historyTab === 'status' && (
        <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Status Anterior', 'Novo Status', 'Alterado em', 'Por'].map((h) => (
                  <th
                    key={h}
                    className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    Sem histórico de status
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px]">
                      {h.previousStatus
                        ? (ASSET_STATUS_LABELS[h.previousStatus] ?? h.previousStatus)
                        : 'N/A'}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className="text-[11.5px] font-semibold bg-blue-100 text-blue-700 px-2 py-[3px] rounded-full">
                        {ASSET_STATUS_LABELS[h.newStatus] ?? h.newStatus}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {formatDateTime(h.changedAt)}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {resolveUserName(h.changedByUserId, users)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {historyTab === 'assignment' && (
        <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['De', 'Para', 'Alterado em', 'Por'].map((h) => (
                  <th
                    key={h}
                    className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assignmentHistory.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    Sem histórico de atribuições
                  </td>
                </tr>
              ) : (
                assignmentHistory.map((ah) => (
                  <tr key={ah.id} className="hover:bg-slate-50">
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {resolveUserName(ah.fromUserId, users)}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px]">
                      {ah.toUserId
                        ? <span className="font-semibold">{resolveUserName(ah.toUserId, users)}</span>
                        : <span className="text-slate-400 italic">Desatribuído</span>
                      }
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {formatDateTime(ah.changedAt)}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {resolveUserName(ah.changedByUserId, users)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}