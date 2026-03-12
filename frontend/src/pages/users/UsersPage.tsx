import { useEffect, useState, useCallback } from 'react'
import { Plus, Mail, Lock, UserMinus, UserCheck } from 'lucide-react'
import { userApi } from '../../api'
import type { UserResponse, UserStatus, UserRole, Page } from '../../types'

const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  BLOCKED: 'bg-red-100 text-red-700',
  PENDING: 'bg-amber-100 text-amber-700',
}
const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  BLOCKED: 'Bloqueado',
  PENDING: 'Pendente',
}
const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  GESTOR: 'bg-blue-100 text-blue-700',
  OPERADOR: 'bg-emerald-100 text-emerald-700',
}

function TBtn({ tip, onClick, danger, children }: {
  tip: string; onClick?: () => void; danger?: boolean; children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-[28px] h-[28px] rounded-[6px] border flex items-center justify-center transition ${
          danger ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
        }`}
      >
        {children}
      </button>
      <div className="absolute bottom-full mb-[6px] left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-[3px] rounded whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
        {tip}
      </div>
    </div>
  )
}

function PBtn({ label, active, disabled, onClick }: {
  label: string; active?: boolean; disabled?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-7 h-7 rounded-[6px] border-[1.5px] text-[12px] font-semibold flex items-center justify-center transition ${
        active ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 disabled:opacity-40'
      }`}
    >
      {label}
    </button>
  )
}

const iCls = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

export default function UsersPage() {
  const [page, setPage] = useState<Page<UserResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    name: '', email: '', documentNumber: '', role: '',
    unitId: '', organizationId: '1', phoneNumber: '',
  })
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    userApi.list({ page: currentPage, size: 20, sort: 'id,desc' })
      .then(setPage)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentPage])

  useEffect(load, [load])

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.documentNumber || !form.role || !form.unitId) return
    setSaving(true)
    try {
      await userApi.create({
        name: form.name,
        email: form.email,
        documentNumber: form.documentNumber,
        role: form.role as UserRole,
        unitId: Number(form.unitId),
        organizationId: Number(form.organizationId),
        phoneNumber: form.phoneNumber || undefined,
      })
      setShowCreate(false)
      setForm({ name: '', email: '', documentNumber: '', role: '', unitId: '', organizationId: '1', phoneNumber: '' })
      load()
    } catch (e) { console.error(e) } finally { setSaving(false) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Usuarios</h1>
          <p className="text-[13px] text-slate-500 mt-1">Gerenciamento de acessos e perfis</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Novo Usuario
        </button>
      </div>

      {page && (
        <div className="grid grid-cols-3 gap-[14px] mb-5">
          {[
            { label: 'Total', val: page.totalElements, icon: <UserCheck size={18} />, color: 'bg-blue-100 text-blue-700' },
            { label: 'Ativos', val: page.content.filter((u) => u.status === 'ACTIVE').length, icon: <UserCheck size={18} />, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Pendentes', val: page.content.filter((u) => u.status === 'PENDING').length, icon: <Mail size={18} />, color: 'bg-amber-100 text-amber-700' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm flex items-center gap-4">
              <div className={`w-[42px] h-[42px] rounded-[9px] flex items-center justify-center ${c.color}`}>{c.icon}</div>
              <div>
                <div className="text-[22px] font-bold">{c.val}</div>
                <div className="text-[12px] text-slate-400">{c.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Nome', 'Email', 'Perfil', 'Unidade', 'Status', 'MFA', 'Acoes'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : page?.content.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhum usuario encontrado</td></tr>
              ) : (
                page?.content.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-[13.5px] font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">{u.email}</td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className={`text-[11.5px] font-bold px-[10px] py-[3px] rounded-full ${ROLE_COLORS[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">#{u.unitId}</td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${STATUS_COLORS[u.status]}`}>
                        {STATUS_LABELS[u.status]}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${u.mfaEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                        {u.mfaEnabled ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <div className="flex gap-[5px]">
                        {u.status === 'PENDING' && (
                          <TBtn tip="Reenviar ativacao" onClick={() => userApi.generateActivationToken(u.id)}>
                            <Mail size={13} />
                          </TBtn>
                        )}
                        {u.status === 'ACTIVE' && (
                          <TBtn tip="Bloquear acesso" danger onClick={() => userApi.block(u.id).then(load)}>
                            <Lock size={13} />
                          </TBtn>
                        )}
                        {u.status === 'BLOCKED' && (
                          <TBtn tip="Reativar usuario" onClick={() => userApi.activate(u.id).then(load)}>
                            <UserCheck size={13} />
                          </TBtn>
                        )}
                        {u.status === 'ACTIVE' && (
                          <TBtn tip="Inativar usuario" danger onClick={() => userApi.inactivate(u.id).then(load)}>
                            <UserMinus size={13} />
                          </TBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {page && (
          <div className="flex items-center justify-between px-4 py-[11px] border-t border-slate-100">
            <span className="text-[13px] text-slate-500">
              Exibindo <strong>{page.content.length}</strong> de <strong>{page.totalElements}</strong>
            </span>
            <div className="flex gap-1">
              <PBtn label="<" disabled={page.first} onClick={() => setCurrentPage((p) => p - 1)} />
              {[...Array(Math.min(5, page.totalPages))].map((_, i) => (
                <PBtn key={i} label={String(i + 1)} active={i === currentPage} onClick={() => setCurrentPage(i)} />
              ))}
              <PBtn label=">" disabled={page.last} onClick={() => setCurrentPage((p) => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="bg-white rounded-[14px] w-full max-w-[560px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center px-6 pt-5 pb-0">
              <h2 className="text-[17px] font-bold">Novo Usuario</h2>
              <button onClick={() => setShowCreate(false)} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400">x</button>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Nome *', key: 'name', type: 'text', ph: 'Nome completo' },
                  { label: 'Email *', key: 'email', type: 'email', ph: 'email@empresa.com' },
                  { label: 'CPF/CNPJ *', key: 'documentNumber', type: 'text', ph: '000.000.000-00' },
                  { label: 'Telefone (habilita MFA)', key: 'phoneNumber', type: 'tel', ph: '55 11 99999-8888' },
                ].map(({ label, key, type, ph }) => (
                  <div key={key}>
                    <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      placeholder={ph}
                      className={iCls}
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">Perfil *</label>
                  <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className={iCls}>
                    <option value="">Selecione...</option>
                    <option>ADMIN</option>
                    <option>GESTOR</option>
                    <option>OPERADOR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">ID da Unidade *</label>
                  <input type="number" value={form.unitId} onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))} className={iCls} />
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-[8px] p-3 text-[12.5px] text-emerald-700 mt-3 mb-2">
                Um email com link de ativacao sera enviado automaticamente.
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-2">
                <button onClick={() => setShowCreate(false)} className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold hover:bg-slate-50">Cancelar</button>
                <button onClick={handleCreate} disabled={saving} className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {saving ? 'Criando...' : 'Criar Usuario'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
