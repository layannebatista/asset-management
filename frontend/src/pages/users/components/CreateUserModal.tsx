import type { UnitResponse } from '../../../types'
import { INPUT_CLS } from '../../../shared'

interface UserForm {
  name: string
  email: string
  documentNumber: string
  role: string
  unitId: string
  organizationId: string
  phoneNumber: string
}

interface CreateUserModalProps {
  open: boolean
  onClose: () => void
  form: UserForm
  setForm: React.Dispatch<React.SetStateAction<UserForm>>
  units: UnitResponse[]
  onConfirm: () => void
  saving: boolean
  createError: string
  maskCPF: (raw: string) => string
  maskPhone: (raw: string) => string
}

export function CreateUserModal({
  open,
  onClose,
  form,
  setForm,
  units,
  onConfirm,
  saving,
  createError,
  maskCPF,
  maskPhone,
}: CreateUserModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-[14px] w-full max-w-[560px] shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center px-6 pt-5 pb-0">
          <h2 className="text-[17px] font-bold">Novo Usuário</h2>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            {([
              {
                label: 'Nome *',
                key: 'name',
                type: 'text',
                ph: 'Nome completo',
              },
              {
                label: 'E-mail *',
                key: 'email',
                type: 'email',
                ph: 'email@empresa.com',
              },
            ] as const).map(({ label, key, type, ph }) => (
              <div key={key}>
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                  {label}
                </label>

                <input
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      [key]: e.target.value,
                    }))
                  }
                  placeholder={ph}
                  className={INPUT_CLS}
                />
              </div>
            ))}

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                CPF/CNPJ *
              </label>

              <input
                type="text"
                value={form.documentNumber}
                placeholder="000.000.000-00"
                className={INPUT_CLS}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    documentNumber: maskCPF(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Telefone (habilita MFA)
              </label>

              <input
                type="tel"
                value={form.phoneNumber}
                placeholder="(11) 99999-8888"
                className={INPUT_CLS}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    phoneNumber: maskPhone(e.target.value),
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Perfil *
              </label>

              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value,
                  }))
                }
                className={INPUT_CLS}
              >
                <option value="">Selecione...</option>
                <option value="ADMIN">Administrador</option>
                <option value="GESTOR">Gestor</option>
                <option value="OPERADOR">Operador</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Unidade *
              </label>

              <select
                value={form.unitId}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    unitId: e.target.value,
                  }))
                }
                className={INPUT_CLS}
              >
                <option value="">Selecione uma unidade...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-3 text-[12.5px] text-emerald-700 mt-3 mb-1">
            Um e-mail com link de ativação será enviado automaticamente.
          </div>

          {createError && (
            <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700 mb-2">
              {createError}
            </div>
          )}

          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={
                saving ||
                !form.name.trim() ||
                !form.email.trim() ||
                !form.documentNumber ||
                !form.role ||
                !form.unitId
              }
              className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Criando...' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}