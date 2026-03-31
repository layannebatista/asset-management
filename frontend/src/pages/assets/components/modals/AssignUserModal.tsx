import { useEffect } from 'react'
import type { AssetResponse, UserResponse } from '../../../../types'
import { Modal, Field, ModalFooter, INPUT_CLS } from '../../../../shared'

interface AssignUserModalProps {
  asset: AssetResponse | null
  onClose: () => void
  users: UserResponse[]
  assignUserId: string
  setAssignUserId: (id: string) => void
  onConfirm: () => void
  saving: boolean
}

export function AssignUserModal({
  asset,
  onClose,
  users,
  assignUserId,
  setAssignUserId,
  onConfirm,
  saving,
}: AssignUserModalProps) {

  // ✅ reset ao abrir / trocar ativo
  useEffect(() => {
    if (asset) {
      setAssignUserId('')
    }
  }, [asset, setAssignUserId])

  const activeUsers = users.filter((u) => u.status === 'ACTIVE')

  const handleConfirm = () => {
    if (!assignUserId || saving) return
    onConfirm()
  }

  return (
    <Modal open={!!asset} onClose={onClose} title="Atribuir Usuário ao Ativo">
      {/* Info do ativo */}
      <div className="bg-slate-50 border border-slate-200 rounded-[8px] px-4 py-3 mb-4">
        <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-[2px]">
          Ativo selecionado
        </div>
        <div className="text-[13.5px] font-semibold">
          {asset?.model ?? '—'}
        </div>
        <div className="font-mono text-[12px] text-blue-700">
          {asset?.assetTag ?? '—'}
        </div>
      </div>

      {/* Select */}
      <Field label="Usuário *">
        {activeUsers.length === 0 ? (
          <p className="text-[12px] text-slate-400">
            Nenhum usuário ativo disponível
          </p>
        ) : (
          <select
            value={assignUserId}
            onChange={(e) => setAssignUserId(e.target.value)}
            className={INPUT_CLS}
          >
            <option value="">Selecione o usuário...</option>
            {activeUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.email}
              </option>
            ))}
          </select>
        )}
      </Field>

      {/* Footer */}
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        loading={saving}
        confirmLabel="Confirmar Atribuição"
        disabled={!assignUserId || saving}
      />
    </Modal>
  )
}