import { useEffect } from 'react'
import type { AssetResponse, UnitResponse } from '../../../../types'
import { Modal, Field, ModalFooter, INPUT_CLS } from '../../../../shared'

interface FormState {
  toUnitId: string
  reason: string
}

interface TransferModalProps {
  asset: AssetResponse | null
  onClose: () => void
  units: UnitResponse[]
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  onConfirm: () => void
  saving: boolean
}

export function TransferModal({
  asset,
  onClose,
  units,
  form,
  setForm,
  onConfirm,
  saving,
}: TransferModalProps) {

  // ✅ reset ao abrir/trocar asset
  useEffect(() => {
    if (asset) {
      setForm({ toUnitId: '', reason: '' })
    }
  }, [asset, setForm])

  const availableUnits = units.filter(
    (u) => u.status === 'ACTIVE' && u.id !== asset?.unitId
  )

  const trimmedReason = form.reason.trim()

  const isValid =
    !!form.toUnitId &&
    trimmedReason.length > 0

  const handleConfirm = () => {
    if (!isValid || saving) return
    onConfirm()
  }

  return (
    <Modal
      open={!!asset}
      onClose={onClose}
      title={asset ? `Transferir: ${asset.assetTag}` : 'Transferir ativo'}
      testId="asset-transfer-modal"
      closeButtonTestId="asset-transfer-close-btn"
    >
      <Field label="Unidade de Destino *">
        {availableUnits.length === 0 ? (
          <p className="text-[12px] text-slate-400">
            Nenhuma unidade disponível para transferência
          </p>
        ) : (
          <select
            data-testid="asset-transfer-unit-select"
            value={form.toUnitId}
            onChange={(e) =>
              setForm((f) => ({ ...f, toUnitId: e.target.value }))
            }
            className={INPUT_CLS}
          >
            <option value="">Selecione a unidade...</option>
            {availableUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Motivo *">
        <textarea
          data-testid="asset-transfer-reason-input"
          value={form.reason}
          onChange={(e) =>
            setForm((f) => ({ ...f, reason: e.target.value }))
          }
          rows={3}
          maxLength={1000}
          placeholder="Descreva o motivo..."
          className={INPUT_CLS}
        />
      </Field>

      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        loading={saving}
        confirmLabel="Solicitar Transferência"
        disabled={!isValid || saving}
        cancelTestId="asset-transfer-cancel-btn"
        confirmTestId="asset-transfer-confirm-btn"
      />
    </Modal>
  )
}