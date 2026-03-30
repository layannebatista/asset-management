import { useEffect } from 'react'
import type { AssetResponse } from '../../../../types'
import { Modal, Field, ModalFooter, INPUT_CLS } from '../../../../shared'

interface MaintenanceModalProps {
  asset: AssetResponse | null
  onClose: () => void
  desc: string
  setDesc: (v: string) => void
  onConfirm: () => void
  saving: boolean
}

export function MaintenanceModal({
  asset,
  onClose,
  desc,
  setDesc,
  onConfirm,
  saving,
}: MaintenanceModalProps) {

  // ✅ reset ao abrir/trocar ativo
  useEffect(() => {
    if (asset) setDesc('')
  }, [asset, setDesc])

  const trimmed = desc.trim()
  const isInvalid = trimmed.length > 0 && trimmed.length < 10
  const isValid = trimmed.length >= 10

  const handleConfirm = () => {
    if (!isValid || saving) return
    onConfirm()
  }

  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title={asset ? `Manutenção: ${asset.assetTag}` : 'Manutenção'}
    >
      <Field label="Descrição do problema * (mín. 10 caracteres)">
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Descreva o problema detalhadamente..."
          className={`${INPUT_CLS} ${
            isInvalid ? 'border-red-400 focus:border-red-400' : ''
          }`}
        />

        <div className="flex justify-between mt-1">
          {isInvalid ? (
            <p className="text-[11.5px] text-red-500">
              Mínimo de 10 caracteres. Faltam {10 - trimmed.length}.
            </p>
          ) : (
            <span />
          )}

          <p className="text-[11px] text-slate-400">
            {desc.length}/1000
          </p>
        </div>
      </Field>

      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        loading={saving}
        confirmLabel="Abrir Ordem"
        disabled={!isValid || saving}
      />
    </Modal>
  )
}