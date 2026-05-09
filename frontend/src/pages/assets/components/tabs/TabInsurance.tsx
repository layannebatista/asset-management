import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { insuranceApi } from '../../../../api'
import type { AssetInsurance } from '../../../../types'
import {
  Field,
  ModalFooter,
  Pagination,
  formatCurrency,
  formatCurrencyInput,
  formatDate,
  parseCurrency,
} from '../../../../shared'

const INPUT_CLS =
  'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

const INS_PAGE_SIZE = 5

function insuranceStatus(ins: AssetInsurance) {
  return new Date(ins.expiryDate) < new Date()
    ? { label: 'Vencido', cls: 'bg-red-100 text-red-700' }
    : { label: 'Ativo', cls: 'bg-emerald-100 text-emerald-700' }
}

interface TabInsuranceProps {
  assetId: number
  insurance: AssetInsurance[]
  setInsurance: React.Dispatch<React.SetStateAction<AssetInsurance[]>>
  isAdmin: boolean
  isGestor: boolean
  retired?: boolean
}

export function TabInsurance({
  assetId,
  insurance,
  setInsurance,
  isAdmin,
  isGestor,
  retired = false,
}: TabInsuranceProps) {
  const [insPage, setInsPage] = useState(0)
  const [showIns, setShowIns] = useState(false)
  const [insForm, setInsForm] = useState({
    policyNumber: '',
    insurer: '',
    coverageValue: '',
    premium: '',
    startDate: '',
    expiryDate: '',
  })
  const [saving, setSaving] = useState(false)
  const [insError, setInsError] = useState('')

  const insTotalPages = Math.ceil(insurance.length / INS_PAGE_SIZE)

  // ✅ garante que página nunca fica inválida
  useEffect(() => {
    if (insPage > 0 && insPage >= insTotalPages) {
      setInsPage(insTotalPages - 1)
    }
  }, [insurance.length, insTotalPages, insPage])

  const insSlice = insurance.slice(
    insPage * INS_PAGE_SIZE,
    (insPage + 1) * INS_PAGE_SIZE
  )

  const handleAdd = async () => {
    setInsError('')

    if (
      !insForm.policyNumber ||
      !insForm.insurer ||
      !insForm.coverageValue ||
      !insForm.startDate ||
      !insForm.expiryDate
    ) {
      setInsError('Preencha todos os campos obrigatórios')
      return
    }

    // ✅ comparação correta de datas
    if (new Date(insForm.expiryDate) <= new Date(insForm.startDate)) {
      setInsError('A data de vencimento deve ser posterior à data de início')
      return
    }

    if (parseCurrency(insForm.coverageValue) <= 0) {
      setInsError('O valor de cobertura deve ser maior que zero')
      return
    }

    setSaving(true)
    try {
      const created = await insuranceApi.create(assetId, {
        policyNumber: insForm.policyNumber,
        insurer: insForm.insurer,
        coverageValue: parseCurrency(insForm.coverageValue),
        premium: insForm.premium
          ? parseCurrency(insForm.premium)
          : undefined,
        startDate: insForm.startDate,
        expiryDate: insForm.expiryDate,
      })

      setInsurance((prev) => [created, ...prev])

      setInsForm({
        policyNumber: '',
        insurer: '',
        coverageValue: '',
        premium: '',
        startDate: '',
        expiryDate: '',
      })

      setShowIns(false)
    } catch (e: any) {
      setInsError(
        e?.response?.data?.error?.message ??
          e?.response?.data?.message ??
          'Erro ao cadastrar apólice'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (insId: number) => {
    if (!confirm('Tem certeza que deseja remover esta apólice?')) return
    try {
      await insuranceApi.delete(insId)
      setInsurance((prev) => prev.filter((i) => i.id !== insId))
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      {(isAdmin || isGestor) && !retired && (
        <div className="flex justify-end mb-3">
          <button
            type="button"
            onClick={() => setShowIns(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
          >
            <Plus size={14} /> Cadastrar Apólice
          </button>
        </div>
      )}

      {insurance.length === 0 ? (
        <div className="bg-white rounded-[10px] border border-slate-200 p-10 text-center text-slate-400 shadow-sm">
          Nenhuma apólice cadastrada
        </div>
      ) : (
        <>
          {insSlice.map((ins) => {
            const st = insuranceStatus(ins)
            return (
              <div
                key={ins.id}
                className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm mb-3"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[13px] font-bold text-blue-700">
                      {ins.policyNumber}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  {(isAdmin || isGestor) && !retired && (
                    <button
                      type="button"
                      onClick={() => handleDelete(ins.id)}
                      className="w-[28px] h-[28px] rounded-[6px] border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Seguradora', val: ins.insurer },
                    { label: 'Cobertura', val: formatCurrency(ins.coverageValue) },
                    { label: 'Prêmio', val: ins.premium ? formatCurrency(ins.premium) : 'N/A' },
                    { label: 'Início', val: formatDate(ins.startDate) },
                    { label: 'Vencimento', val: formatDate(ins.expiryDate) },
                  ].map((f) => (
                    <div key={f.label}>
                      <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">
                        {f.label}
                      </div>
                      <div className="text-[13.5px] font-semibold">{f.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          <Pagination
            currentPage={insPage}
            totalPages={insTotalPages}
            totalElements={insurance.length}
            pageSize={INS_PAGE_SIZE}
            isFirst={insPage === 0}
            isLast={insPage >= insTotalPages - 1}
            onPageChange={setInsPage}
            currentCount={insSlice.length}
          />
        </>
      )}

      {showIns && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
          onClick={(e) =>
            e.target === e.currentTarget && setShowIns(false)
          }
        >
          <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">
                Cadastrar Apólice de Seguro
              </h2>
              <button
                type="button"
                onClick={() => setShowIns(false)}
                className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Número da Apólice *">
                  <input
                    value={insForm.policyNumber}
                    maxLength={50}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        policyNumber: e.target.value,
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="Seguradora *">
                  <input
                    value={insForm.insurer}
                    maxLength={100}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        insurer: e.target.value,
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="Valor de Cobertura *">
                  <input
                    inputMode="numeric"
                    value={insForm.coverageValue}
                    maxLength={15}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        coverageValue: formatCurrencyInput(e.target.value),
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="Prêmio">
                  <input
                    inputMode="numeric"
                    value={insForm.premium}
                    maxLength={15}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        premium: formatCurrencyInput(e.target.value),
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="Início *">
                  <input
                    type="date"
                    value={insForm.startDate}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>

                <Field label="Vencimento *">
                  <input
                    type="date"
                    value={insForm.expiryDate}
                    onChange={(e) =>
                      setInsForm((f) => ({
                        ...f,
                        expiryDate: e.target.value,
                      }))
                    }
                    className={INPUT_CLS}
                  />
                </Field>
              </div>

              {insError && (
                <div className="bg-red-50 border border-red-200 rounded-[8px] p-3 text-[12.5px] text-red-700 mt-2">
                  {insError}
                </div>
              )}

              <ModalFooter
                onCancel={() => {
                  setShowIns(false)
                  setInsError('')
                }}
                onConfirm={handleAdd}
                loading={saving}
                confirmLabel="Cadastrar"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}