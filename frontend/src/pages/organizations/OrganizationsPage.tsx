import { useEffect, useState } from 'react'
import { Building2, Pencil, X, Check } from 'lucide-react'
import { organizationApi, unitApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { OrganizationResponse, UnitResponse } from '../../types'
import { INPUT_CLS, ErrorBanner } from '../../shared'

// ─── Linha de informação ──────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1 font-semibold">
        {label}
      </div>
      <div className="text-[14px] font-semibold text-slate-800">{value}</div>
    </div>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function OrganizationsPage() {
  const { user } = useAuth()

  const [org, setOrg] = useState<OrganizationResponse | null>(null)
  const [units, setUnits] = useState<UnitResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // edição do nome
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!user?.organizationId) return

    setLoading(true)
    setLoadError('')

    Promise.all([
      organizationApi.getById(user.organizationId),
      unitApi.listByOrg(user.organizationId),
    ])
      .then(([o, u]) => {
        setOrg(o)
        setUnits(Array.isArray(u) ? u : [])
      })
      .catch(() => setLoadError('Erro ao carregar informações da organização'))
      .finally(() => setLoading(false))
  }, [user?.organizationId])

  const openEdit = () => {
    if (!org) return
    setEditName(org.name)
    setSaveError('')
    setSaveSuccess(false)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setSaveError('')
  }

  const handleSave = async () => {
    const trimmed = editName.trim()
    if (!trimmed || !org) return

    setSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      await organizationApi.updateName(org.id, trimmed)
      setOrg((prev) => prev ? { ...prev, name: trimmed } : prev)
      setEditing(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      setSaveError(
        e?.response?.data?.message ?? 'Erro ao atualizar nome da organização'
      )
    } finally {
      setSaving(false)
    }
  }

  // Estatísticas de unidades
  const totalUnits = units.length
  const activeUnits = units.filter((u: UnitResponse) => u.status === 'ACTIVE').length
  const inactiveUnits = totalUnits - activeUnits

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Carregando...
      </div>
    )
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="mb-6">
        <h1 className="text-[20px] font-bold tracking-tight">Organização</h1>
        <p className="text-[13px] text-slate-500 mt-1">
          Informações e configurações da organização
        </p>
      </div>

      <ErrorBanner message={loadError} onDismiss={() => setLoadError('')} />

      {org && (
        <>
          {/* Card principal */}
          <div className="bg-white rounded-[12px] border border-slate-200 shadow-sm overflow-hidden mb-5">
            {/* Header do card */}
            <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
              <div className="w-12 h-12 rounded-[10px] bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Building2 size={22} className="text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                {editing ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') cancelEdit()
                      }}
                      maxLength={100}
                      autoFocus
                      className="flex-1 border-[1.5px] border-blue-400 rounded-[7px] px-3 py-[7px] text-[15px] font-semibold outline-none bg-white focus:ring-2 focus:ring-blue-100 transition"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving || !editName.trim()}
                      title="Salvar"
                      className="w-8 h-8 rounded-[6px] bg-blue-700 text-white flex items-center justify-center hover:bg-blue-800 transition disabled:opacity-50"
                    >
                      {saving
                        ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Check size={14} />
                      }
                    </button>
                    <button
                      onClick={cancelEdit}
                      title="Cancelar"
                      className="w-8 h-8 rounded-[6px] border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-slate-50 transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <span className="text-[17px] font-bold text-slate-900 truncate">
                      {org.name}
                    </span>
                    <button
                      onClick={openEdit}
                      title="Editar nome"
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-[6px] border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-slate-50 hover:text-slate-700 transition"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11.5px] font-semibold px-[8px] py-[2px] rounded-full bg-emerald-100 text-emerald-700">
                    Ativa
                  </span>
                </div>
              </div>
            </div>

            {/* Campos de informação */}
            <div className="grid grid-cols-3 gap-6 px-6 py-5">
              <InfoRow label="Total de unidades" value={String(totalUnits)} />
              <InfoRow label="Unidades ativas" value={String(activeUnits)} />
              <InfoRow label="Unidades inativas" value={String(inactiveUnits)} />
            </div>
          </div>

          {/* Tabela original INTACTA */}
          <div className="bg-white rounded-[12px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-bold text-slate-800">
                Unidades vinculadas
              </h2>
              <p className="text-[12px] text-slate-400 mt-[2px]">
                Para gerenciar unidades, acesse o menu <strong>Unidades</strong>.
              </p>
            </div>

            <table className="w-full border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  {['Nome', 'Tipo', 'Status'].map((h) => (
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
                    <td colSpan={3} className="text-center py-10 text-slate-400 text-[13px]">
                      Nenhuma unidade cadastrada
                    </td>
                  </tr>
                ) : (
                  units.map((u: UnitResponse) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-[14px] py-3 border-b border-slate-50">
                        <span className="text-[13.5px] font-semibold text-slate-800">
                          {u.name}
                        </span>
                      </td>
                      <td className="px-[14px] py-3 border-b border-slate-50">
                        {u.mainUnit ? (
                          <span className="text-[11.5px] font-semibold px-[8px] py-[2px] rounded-full bg-blue-100 text-blue-700">
                            Matriz
                          </span>
                        ) : (
                          <span className="text-[12px] text-slate-400">Filial</span>
                        )}
                      </td>
                      <td className="px-[14px] py-3 border-b border-slate-50">
                        <span
                          className={`text-[11.5px] font-semibold px-[8px] py-[2px] rounded-full ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}