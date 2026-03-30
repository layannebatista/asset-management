import { useEffect, useState } from 'react'
import { Mail, Lock, UserMinus, UserCheck, Plus } from 'lucide-react'
import { userApi, unitApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { UserResponse, UserRole, UnitResponse } from '../../types'
import {
  USER_STATUS_LABELS, USER_STATUS_COLORS, USER_ROLE_LABELS, USER_ROLE_COLORS,
  TipButton, Pagination, ErrorBanner, resolveUnitName,
} from '../../shared'
import { CreateUserModal } from './components/CreateUserModal'
import { useUsers } from '../../hooks/useUsers'

type UserForm = {
  name: string
  email: string
  documentNumber: string
  role: string
  unitId: string
  organizationId: string
  phoneNumber: string
}

function maskCPF(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 11)
    return d.replace(/(\d{3})(\d{0,3})(\d{0,3})(\d{0,2})/, (_, a, b, c, dd) =>
      [a, b, c, dd].filter(Boolean).join('.').replace(/\.([^.]+)$/, '-$1')
    )
  return d.replace(/(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/, (_, a, b, c, dd, e) =>
    `${a}.${b}.${c}/${dd}-${e}`
  )
}

function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10)
    return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) =>
      a ? `(${a})${b ? ' ' + b : ''}${c ? '-' + c : ''}` : ''
    )
  return d.replace(/(\d{0,2})(\d{0,5})(\d{0,4})/, (_, a, b, c) =>
    a ? `(${a})${b ? ' ' + b : ''}${c ? '-' + c : ''}` : ''
  )
}

export default function UsersPage() {
  const { user } = useAuth()

  const { page, loading, error, activeCount, pendingCount, load } = useUsers()

  const [units, setUnits] = useState<UnitResponse[]>([])
  const [currentPage, setCurrentPage] = useState(0)

  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<UserForm>({
    name: '',
    email: '',
    documentNumber: '',
    role: '',
    unitId: '',
    organizationId: '',
    phoneNumber: '',
  })

  const [saving, setSaving] = useState(false)
  const [createError, setCreateError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  useEffect(() => {
    if (!user?.organizationId) return
    load(currentPage)
  }, [user?.organizationId, currentPage])

  useEffect(() => {
    if (!user?.organizationId) return
    unitApi.listByOrg(user.organizationId)
      .then((list) =>
        setUnits(Array.isArray(list) ? list.filter((u) => u.status === 'ACTIVE') : [])
      )
      .catch(console.error)
  }, [user?.organizationId])

  useEffect(() => {
    if (user?.organizationId) {
      setForm((f) => ({
        ...f,
        organizationId: String(user.organizationId),
      }))
    }
  }, [user?.organizationId])

  const openCreate = () => {
    setCreateError('')
    setForm({
      name: '',
      email: '',
      documentNumber: '',
      role: '',
      unitId: '',
      organizationId: String(user?.organizationId ?? ''),
      phoneNumber: '',
    })
    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.documentNumber || !form.role || !form.unitId) return

    setSaving(true)
    setCreateError('')

    try {
      const rawDoc = form.documentNumber.replace(/\D/g, '')

      await userApi.create({
        name: form.name.trim(),
        email: form.email.trim(),
        documentNumber: rawDoc,
        role: form.role as UserRole,
        unitId: Number(form.unitId),
        organizationId: Number(form.organizationId),
        phoneNumber: form.phoneNumber ? form.phoneNumber.replace(/\D/g, '') : undefined,
      })

      setShowCreate(false)
      load(currentPage)
    } catch (e: any) {
      setCreateError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao criar usuário'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleUserAction = async (userId: number, fn: () => Promise<any>) => {
    setActionLoadingId(userId)
    setActionError('')

    try {
      await fn()
      load(currentPage)
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao executar ação'
      )
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Usuários</h1>
          <p className="text-[13px] text-slate-500 mt-1">Gerenciamento de acessos e perfis</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Novo Usuário
        </button>
      </div>

      <ErrorBanner message={error || actionError} onDismiss={() => setActionError('')} />

      {page && (
        <div className="grid grid-cols-3 gap-[14px] mb-5">
          {[
            { label: 'Total', val: page.totalElements, icon: <UserCheck size={18} />, color: 'bg-blue-100 text-blue-700' },
            { label: 'Ativos', val: activeCount, icon: <UserCheck size={18} />, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'Pendentes de ativação', val: pendingCount, icon: <Mail size={18} />, color: 'bg-amber-100 text-amber-700' },
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
        <div className="w-full">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Nome', 'E-mail', 'Perfil', 'Unidade', 'Status', 'Autenticação 2 fatores', 'Ações'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : page?.content?.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhum usuário encontrado</td></tr>
              ) : page?.content?.map((u: UserResponse) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">

                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
                        {u.name ? u.name.slice(0, 2).toUpperCase() : '--'}
                      </div>
                      <span className="text-[13.5px] font-medium">{u.name}</span>
                    </div>
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                    {u.email}
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className={`text-[11.5px] font-bold px-[10px] py-[3px] rounded-full ${USER_ROLE_COLORS[u.role]}`}>
                      {USER_ROLE_LABELS[u.role] ?? u.role}
                    </span>
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                    {resolveUnitName(u.unitId, units)}
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${USER_STATUS_COLORS[u.status]}`}>
                      {USER_STATUS_LABELS[u.status as keyof typeof USER_STATUS_LABELS]}
                    </span>
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${u.mfaEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                      {u.mfaEnabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>

                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <div className="flex gap-[5px]">

                      {u.status === 'PENDING_ACTIVATION' && (
                        <TipButton tip="Reenviar ativação" loading={actionLoadingId === u.id}
                          onClick={() => handleUserAction(u.id, () => userApi.generateActivationToken(u.id))}>
                          <Mail size={13} />
                        </TipButton>
                      )}

                      {u.status === 'ACTIVE' && (
                        <TipButton tip="Bloquear acesso" danger loading={actionLoadingId === u.id}
                          onClick={() => handleUserAction(u.id, () => userApi.block(u.id))}>
                          <Lock size={13} />
                        </TipButton>
                      )}

                      {u.status === 'BLOCKED' && (
                        <TipButton tip="Reativar usuário" loading={actionLoadingId === u.id}
                          onClick={() => handleUserAction(u.id, () => userApi.activate(u.id))}>
                          <UserCheck size={13} />
                        </TipButton>
                      )}

                      {u.status === 'ACTIVE' && (
                        <TipButton tip="Inativar usuário" danger loading={actionLoadingId === u.id}
                          onClick={() => handleUserAction(u.id, () => userApi.inactivate(u.id))}>
                          <UserMinus size={13} />
                        </TipButton>
                      )}

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {page && (
          <Pagination
            currentPage={currentPage}
            totalPages={page.totalPages}
            totalElements={page.totalElements}
            pageSize={20}
            isFirst={page.first}
            isLast={page.last}
            onPageChange={setCurrentPage}
            currentCount={page.content.length}
          />
        )}
      </div>

      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        form={form}
        setForm={setForm}
        units={units}
        onConfirm={handleCreate}
        saving={saving}
        createError={createError}
        maskCPF={maskCPF}
        maskPhone={maskPhone}
      />
    </div>
  )
}