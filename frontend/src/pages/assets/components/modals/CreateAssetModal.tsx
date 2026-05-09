import { useEffect } from 'react'
import type { AssetType, UnitResponse } from '../../../../types'
import {
  Modal,
  Field,
  ModalFooter,
  INPUT_CLS,
  ASSET_TYPE_OPTIONS,
} from '../../../../shared'

interface FormState {
  type: AssetType | ''
  model: string
  unitId: string
}

interface CreateAssetModalProps {
  open: boolean
  onClose: () => void
  form: FormState
  setForm: React.Dispatch<React.SetStateAction<FormState>>
  units: UnitResponse[]
  onConfirm: () => void
  saving: boolean
  error: string
}

export function CreateAssetModal({
  open,
  onClose,
  form,
  setForm,
  units,
  onConfirm,
  saving,
  error,
}: CreateAssetModalProps) {

  // ✅ reset ao abrir
  useEffect(() => {
    if (open) {
      setForm({
        type: '',
        model: '',
        unitId: '',
      })
    }
  }, [open, setForm])

  const activeUnits = units.filter((u) => u.status === 'ACTIVE')

  const isValid =
    !!form.type &&
    form.model.trim().length > 0 &&
    !!form.unitId

  const handleConfirm = () => {
    if (!isValid || saving) return
    onConfirm()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Ativo" testId="create-asset-modal" closeButtonTestId="create-asset-close-btn">
      {/* erro */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      {/* linha 1 */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo *">
          <select
            data-testid="create-asset-type-select"
            value={form.type}
            onChange={(e) => {
              const value = e.target.value as AssetType | ''
              setForm((f) => ({ ...f, type: value }))
            }}
            className={INPUT_CLS}
          >
            <option value="">Selecione...</option>
            {ASSET_TYPE_OPTIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Modelo *">
          <input
            data-testid="create-asset-model-input"
            value={form.model}
            maxLength={255}
            onChange={(e) =>
              setForm((f) => ({ ...f, model: e.target.value }))
            }
            placeholder="Dell Latitude 5520"
            className={INPUT_CLS}
          />
        </Field>
      </div>

      {/* unidade */}
      <Field label="Unidade *">
        {activeUnits.length === 0 ? (
          <p className="text-[12px] text-slate-400">
            Nenhuma unidade ativa disponível
          </p>
        ) : (
          <select
            data-testid="create-asset-unit-select"
            value={form.unitId}
            onChange={(e) =>
              setForm((f) => ({ ...f, unitId: e.target.value }))
            }
            className={INPUT_CLS}
          >
            <option value="">Selecione a unidade...</option>
            {activeUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      {/* footer */}
      <ModalFooter
        onCancel={onClose}
        onConfirm={handleConfirm}
        loading={saving}
        confirmLabel="Criar Ativo"
        disabled={!isValid || saving}
        cancelTestId="create-asset-cancel-btn"
        confirmTestId="create-asset-confirm-btn"
      />
    </Modal>
  )
}