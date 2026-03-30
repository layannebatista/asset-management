import type { UserResponse } from '../../../../types'
import { ModalFooter } from '../../../../shared'

interface AssignModalProps {
  open: boolean
  users: UserResponse[]
  assignUserId: string
  onUserChange: (id: string) => void
  onConfirm: () => void
  onCancel: () => void
  saving: boolean
}

export function AssignModal({
  open,
  users,
  assignUserId,
  onUserChange,
  onConfirm,
  onCancel,
  saving,
}: AssignModalProps) {
  if (!open) return null

  const activeUsers = users.filter((u) => u.status === 'ACTIVE')

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-user-title"
        className="bg-white rounded-[14px] w-full max-w-[420px] shadow-2xl p-6"
      >
        <h2 id="assign-user-title" className="text-[17px] font-bold mb-4">
          Atribuir Usuário
        </h2>

        <label
          htmlFor="assign-user-select"
          className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]"
        >
          Usuário *
        </label>

        <select
          id="assign-user-select"
          value={assignUserId}
          onChange={(e) => onUserChange(e.target.value)}
          className="w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 mb-4"
        >
          <option value="">Selecione o usuário...</option>

          {activeUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} — {u.email}
            </option>
          ))}
        </select>

        <ModalFooter
          onCancel={onCancel}
          onConfirm={() => {
            if (assignUserId) onConfirm()
          }}
          loading={saving}
          confirmLabel="Confirmar"
          disabled={!assignUserId}
        />
      </div>
    </div>
  )
}