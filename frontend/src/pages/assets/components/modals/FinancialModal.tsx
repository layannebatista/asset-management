import { useState, useEffect } from 'react'
import type { AssetDepreciation } from '../../../../types'
import type { AssetResponseExtended } from '../../AssetDetailsPage'
import { ModalFooter, formatCurrency, formatCurrencyInput } from '../../../../shared'

const INPUT_CLS = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

export interface FinancialFormState {
  purchaseValue: string
  residualValue: string
  usefulLifeMonths: string
  depreciationMethod: string
  purchaseDate: string
  warrantyExpiry: string
  supplier: string
  invoiceNumber: string
  invoiceDate: string
}

interface FinancialModalProps {
  open: boolean
  dep: AssetDepreciation | null
  asset: AssetResponseExtended | null
  onClose: () => void
  onSave: (form: FinancialFormState) => void
  saving: boolean
}

export function FinancialModal({
  open,
  dep,
  asset,
  onClose,
  onSave,
  saving,
}: FinancialModalProps) {
  const [form, setForm] = useState<FinancialFormState>({
    purchaseValue: '',
    residualValue: '',
    usefulLifeMonths: '',
    depreciationMethod: 'LINEAR',
    purchaseDate: '',
    warrantyExpiry: '',
    supplier: '',
    invoiceNumber: '',
    invoiceDate: '',
  })

  useEffect(() => {
    if (!open) return

    setForm({
      purchaseValue: dep?.purchaseValue ? formatCurrency(dep.purchaseValue) : '',
      residualValue: dep?.residualValue ? formatCurrency(dep.residualValue) : '',
      usefulLifeMonths: dep?.usefulLifeMonths ? String(dep.usefulLifeMonths) : '',
      depreciationMethod: dep?.depreciationMethod ?? 'LINEAR',
      purchaseDate: asset?.purchaseDate ?? '',
      warrantyExpiry: asset?.warrantyExpiry ?? '',
      supplier: asset?.supplier ?? '',
      invoiceNumber: asset?.invoiceNumber ?? '',
      invoiceDate: asset?.invoiceDate ?? '',
    })
  }, [open, dep, asset])

  if (!open) return null

  const isDisabled =
    !form.purchaseValue ||
    !form.purchaseDate ||
    !form.usefulLifeMonths

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="financial-modal-title"
        className="bg-white rounded-[14px] w-full max-w-[560px] shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center px-6 pt-5 pb-0">
          <h2 id="financial-modal-title" className="text-[17px] font-bold">
            Dados Financeiros
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="purchaseValue" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Valor de Compra *
              </label>
              <input
                id="purchaseValue"
                inputMode="numeric"
                value={form.purchaseValue}
                maxLength={15}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    purchaseValue: formatCurrencyInput(e.target.value),
                  }))
                }
                placeholder="R$ 0,00"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="residualValue" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Valor Residual
              </label>
              <input
                id="residualValue"
                inputMode="numeric"
                value={form.residualValue}
                maxLength={15}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    residualValue: formatCurrencyInput(e.target.value),
                  }))
                }
                placeholder="R$ 0,00"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="usefulLifeMonths" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Vida Útil (meses) *
              </label>
              <input
                id="usefulLifeMonths"
                inputMode="numeric"
                value={form.usefulLifeMonths}
                maxLength={4}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    usefulLifeMonths: e.target.value.replace(/\D/g, ''),
                  }))
                }
                placeholder="Ex: 48"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="depreciationMethod" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Método de Depreciação *
              </label>
              <select
                id="depreciationMethod"
                value={form.depreciationMethod}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    depreciationMethod: e.target.value,
                  }))
                }
                className={INPUT_CLS}
              >
                <option value="LINEAR">Linear</option>
                <option value="DECLINING_BALANCE">Saldo Decrescente</option>
                <option value="SUM_OF_YEARS">Soma dos Dígitos</option>
              </select>
            </div>

            <div>
              <label htmlFor="purchaseDate" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Data de Compra *
              </label>
              <input
                id="purchaseDate"
                type="date"
                value={form.purchaseDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, purchaseDate: e.target.value }))
                }
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="warrantyExpiry" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Garantia até
              </label>
              <input
                id="warrantyExpiry"
                type="date"
                value={form.warrantyExpiry}
                onChange={(e) =>
                  setForm((f) => ({ ...f, warrantyExpiry: e.target.value }))
                }
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="supplier" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Fornecedor
              </label>
              <input
                id="supplier"
                value={form.supplier}
                maxLength={100}
                onChange={(e) =>
                  setForm((f) => ({ ...f, supplier: e.target.value }))
                }
                placeholder="Ex: Dell Brasil"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="invoiceNumber" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Nº Nota Fiscal
              </label>
              <input
                id="invoiceNumber"
                value={form.invoiceNumber}
                maxLength={50}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoiceNumber: e.target.value }))
                }
                placeholder="Ex: NF-12345"
                className={INPUT_CLS}
              />
            </div>

            <div>
              <label htmlFor="invoiceDate" className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                Data da NF
              </label>
              <input
                id="invoiceDate"
                type="date"
                value={form.invoiceDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoiceDate: e.target.value }))
                }
                className={INPUT_CLS}
              />
            </div>
          </div>

          <ModalFooter
            onCancel={onClose}
            onConfirm={() => {
              if (!isDisabled) onSave(form)
            }}
            loading={saving}
            confirmLabel="Salvar"
            disabled={isDisabled}
          />
        </div>
      </div>
    </div>
  )
}