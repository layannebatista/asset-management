import { useEffect, useState, useCallback } from 'react'
import { Plus, MapPin, CheckCircle, XCircle } from 'lucide-react'
import { unitApi, organizationApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { UnitResponse, OrganizationResponse } from '../../types'
import { INPUT_CLS, ErrorBanner } from '../../shared'

export default function UnitsPage() {
  const { user } = useAuth()

  const [units, setUnits] = useState<UnitResponse[]>([])
  const [org, setOrg] = useState<OrganizationResponse | null>(null)

  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const [error, setError] = useState('')
  const [toggleError, setToggleError] = useState('')
  const [loadError, setLoadError] = useState('')

  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(() => {
    if (user?.organizationId == null) return

    setLoading(true)
    setLoadError('')

    Promise.all([
      unitApi.listByOrg(user.organizationId),
      organizationApi.getById(user.organizationId),
    ])
      .then(([u, o]) => {
        setUnits(Array.isArray(u) ? u : [])
        setOrg(o ?? null)
      })
      .catch((e: any) => {
        console.error(e)
        setUnits([])
        setOrg(null)
        setLoadError('Erro ao carregar unidades')
      })
      .finally(() => setLoading(false))
  }, [user?.organizationId])

  useEffect(() => {
    load()
  }, [load])

  const handleCreate = async () => {
    if (!name.trim() || user?.organizationId == null) return

    setSaving(true)
    setError('')

    try {
      await unitApi.create(user.organizationId, name.trim())

      setName('')
      setShowCreate(false)
      load()
    } catch (e: any) {
      setError(
        e?.response?.data?.message ??
        'Erro ao criar unidade'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (unit: UnitResponse) => {
    setTogglingId(unit.id)
    setToggleError('')

    try {
      if (unit.status === 'ACTIVE') {
        await unitApi.inactivate(unit.id)
      } else {
        await unitApi.activate(unit.id)
      }

      load()
    } catch (e: any) {
      setToggleError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao alterar status'
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">
            Unidades
          </h1>
          <p className="text-[13px] text-slate-400 mt-[2px]">
            {org
              ? `Organização: ${org.name}`
              : 'Unidades da sua organização'}
          </p>
        </div>

        <button
          onClick={() => {
            if (!user?.organizationId) return
            setName('')
            setError('')
            setShowCreate(true)
          }}
          disabled={!user?.organizationId}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50"
        >
          <Plus size={14} /> Nova Unidade
        </button>
      </div>

      <ErrorBanner message={loadError} onDismiss={() => setLoadError('')} />
      <ErrorBanner message={toggleError} onDismiss={() => setToggleError('')} />

      {loading ? (
        <div className="text-center py-20 text-slate-400">
          Carregando...
        </div>
      ) : (
        <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Nome', 'Principal', 'Status', 'Ações'].map((h) => (
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
              {units.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">
                    Nenhuma unidade cadastrada
                  </td>
                </tr>
              ) : (
                units.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition">

                    <td className="px-[14px] py-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-blue-600" />
                        <span className="text-[13.5px] font-semibold">
                          {unit.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-[14px] py-3 border-b border-slate-100">
                      {unit.mainUnit ? (
                        <span className="text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full bg-blue-100 text-blue-700">
                          Matriz
                        </span>
                      ) : (
                        <span className="text-[11.5px] text-slate-400">
                          Filial
                        </span>
                      )}
                    </td>

                    <td className="px-[14px] py-3 border-b border-slate-100">
                      <span
                        className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${
                          unit.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {unit.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>

                    <td className="px-[14px] py-3 border-b border-slate-100">
                      <button
                        onClick={() => handleToggle(unit)}
                        disabled={unit.mainUnit || togglingId === unit.id}
                        title={
                          unit.mainUnit
                            ? 'Não é possível inativar a unidade principal'
                            : undefined
                        }
                        className={`flex items-center gap-1 px-3 py-[6px] rounded-[7px] text-[12px] font-semibold border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          unit.status === 'ACTIVE'
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {togglingId === unit.id ? (
                          <>
                            <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                            Aguarde...
                          </>
                        ) : unit.status === 'ACTIVE' ? (
                          <>
                            <XCircle size={13} /> Inativar
                          </>
                        ) : (
                          <>
                            <CheckCircle size={13} /> Ativar
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
          onClick={(e) =>
            e.target === e.currentTarget && setShowCreate(false)
          }
        >
          <div className="bg-white rounded-[14px] w-full max-w-[420px] shadow-2xl">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">
                Nova Unidade
              </h2>

              <button
                onClick={() => setShowCreate(false)}
                className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5">
              <div className="mb-4">
                <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
                  Nome *
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && handleCreate()
                  }
                  maxLength={100}
                  placeholder="Ex: Filial SP"
                  className={INPUT_CLS}
                  autoFocus
                />

                {error && (
                  <p className="text-[12px] text-red-500 mt-1">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>

                <button
                  onClick={handleCreate}
                  disabled={saving || !name.trim()}
                  className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Criando...' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}