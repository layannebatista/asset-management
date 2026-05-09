import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Play, CheckCheck, X } from 'lucide-react'
import { maintenanceApi, assetApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { MaintenanceResponse, MaintenanceBudget, MaintenanceStatus, Page, AssetResponse } from '../../types'
import {
  MAINTENANCE_STATUS_LABELS, MAINTENANCE_STATUS_COLORS,
  TipButton, Pagination, ErrorBanner, formatCurrency, resolveAssetLabel, formatCode,
} from '../../shared'
import { CreateMaintenanceModal } from './components/CreateMaintenanceModal'
import { CompleteMaintenanceModal } from './components/CompleteMaintenanceModal'

const VALID_STATUSES = ['ALL', 'REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']

type StatusFilterValue = MaintenanceStatus | 'ALL' | 'OPEN'

export default function MaintenancePage() {
  const [searchParams] = useSearchParams()
  const { user, isAdmin, isGestor } = useAuth()

  const urlUnitId = searchParams.get('unitId') ? Number(searchParams.get('unitId')) : undefined
  const urlAssignedUserId = searchParams.get('assignedUserId') ? Number(searchParams.get('assignedUserId')) : undefined

  const effectiveUnitId = urlUnitId ?? (!isAdmin && isGestor ? user?.unitId : undefined)
  const effectiveAssignedUserId = urlAssignedUserId ?? (!isAdmin && !isGestor ? user?.userId : undefined)

  const urlStatus = searchParams.get('status')
  const initialStatus: StatusFilterValue =
    urlStatus === 'OPEN' ? 'OPEN'
    : urlStatus && VALID_STATUSES.includes(urlStatus) ? urlStatus as MaintenanceStatus
    : 'ALL'

  const [page, setPage] = useState<Page<MaintenanceResponse> | null>(null)
  const [budget, setBudget] = useState<MaintenanceBudget | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>(initialStatus)
  const [currentPage, setCurrentPage] = useState(0)
  const [loading, setLoading] = useState(true)

  const [showCreate, setShowCreate] = useState(false)
  const [showComplete, setShowComplete] = useState<MaintenanceResponse | null>(null)

  const [assetList, setAssetList] = useState<AssetResponse[]>([])

  const [form, setForm] = useState({ assetId: '', description: '', estimatedCost: '' })
  const [descError, setDescError] = useState('')

  const [completeForm, setCompleteForm] = useState({ resolution: '', actualCost: '' })
  const [resolveError, setResolveError] = useState('')

  const [saving, setSaving] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    assetApi.list({
      size: 500,
      ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
      ...(effectiveAssignedUserId ? { assignedUserId: effectiveAssignedUserId } : {}),
    })
      .then((p) => setAssetList(Array.isArray(p?.content) ? p.content : []))
      .catch(console.error)
  }, [effectiveUnitId, effectiveAssignedUserId])

  const load = useCallback(() => {
    setLoading(true)

    const apiStatus: MaintenanceStatus | undefined =
      statusFilter === 'ALL' || statusFilter === 'OPEN'
        ? undefined
        : statusFilter

    Promise.all([
      maintenanceApi.list({
        page: currentPage,
        size: 20,
        sort: 'createdAt,desc',
        ...(apiStatus ? { status: apiStatus } : {}),
        ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
        ...(effectiveAssignedUserId ? { requestedByUserId: effectiveAssignedUserId } : {}),
      }),
      (isAdmin || isGestor)
        ? maintenanceApi.getBudget({
            ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
          })
        : Promise.resolve(null),
    ])
      .then(([p, b]) => {
        if (statusFilter === 'OPEN' && p?.content) {
          const filtered = p.content.filter(
            (m) => m.status === 'REQUESTED' || m.status === 'IN_PROGRESS'
          )
          setPage({ ...p, content: filtered, totalElements: filtered.length })
        } else {
          setPage(p ?? null)
        }
        setBudget(b ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentPage, statusFilter, effectiveUnitId, effectiveAssignedUserId])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.assetId) return
    if (form.description.length < 10) {
      setDescError('Descrição deve ter no mínimo 10 caracteres')
      return
    }
    if (form.description.length > 1000) {
      setDescError('Descrição deve ter no máximo 1000 caracteres')
      return
    }
    setSaving(true)
    setActionError('')
    try {
      const parsedEstimated = form.estimatedCost
        ? Number(form.estimatedCost.replace(/[R$\s.]/g, '').replace(',', '.'))
        : undefined
      await maintenanceApi.create({
        assetId: Number(form.assetId),
        description: form.description,
        ...(parsedEstimated !== undefined && parsedEstimated > 0 ? { estimatedCost: parsedEstimated } : {}),
      })
      setShowCreate(false)
      load()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Erro ao abrir ordem'
      )
    } finally { setSaving(false) }
  }

  const handleComplete = async () => {
    if (!showComplete) return
    const trimmedRes = completeForm.resolution.trim()
    if (trimmedRes.length < 10) {
      setResolveError('Descreva a resolução com pelo menos 10 caracteres')
      return
    }
    setSaving(true)
    setActionError('')
    setResolveError('')
    try {
      const parsedCost = completeForm.actualCost
        ? Number(completeForm.actualCost.replace(/[R$\s.]/g, '').replace(',', '.'))
        : undefined
      await maintenanceApi.complete(showComplete.id, trimmedRes, parsedCost)
      setShowComplete(null)
      load()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Erro ao concluir manutenção'
      )
    } finally { setSaving(false) }
  }

  const handleStart = async (m: MaintenanceResponse) => {
    setActionLoadingId(m.id)
    setActionError('')
    try {
      await maintenanceApi.start(m.id)
      load()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Erro ao iniciar'
      )
    } finally { setActionLoadingId(null) }
  }

  const handleCancel = async (m: MaintenanceResponse) => {
    if (!confirm(`Cancelar a manutenção ${formatCode('MNT', m.id)}?`)) return
    setActionLoadingId(m.id)
    setActionError('')
    try {
      await maintenanceApi.cancel(m.id)
      load()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ?? e?.response?.data?.message ?? 'Erro ao cancelar'
      )
    } finally { setActionLoadingId(null) }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Manutenção</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {effectiveAssignedUserId
              ? 'Ordens de serviço relacionadas a você'
              : effectiveUnitId
              ? 'Ordens de serviço da sua unidade'
              : 'Controle de ordens de serviço e orçamento'}
          </p>
        </div>
        <button
          data-testid="maintenance-open-order-btn"
          onClick={() => {
            setForm({ assetId: '', description: '', estimatedCost: '' })
            setDescError('')
            setActionError('')
            setShowCreate(true)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Abrir Ordem
        </button>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

      {budget && (
        <div className="grid grid-cols-3 gap-[14px] mb-5">
          <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-[.5px] mb-2">Total de ordens</div>
            <div className="text-[22px] font-bold text-slate-800">{budget.totalRecords}</div>
            <div className="text-[11.5px] text-slate-400 mt-1">
              {budget.completedRecords} concluída{budget.completedRecords !== 1 ? 's' : ''}
              {budget.totalRecords > 0 && (
                <span className="ml-1">({Math.round((budget.completedRecords / budget.totalRecords) * 100)}%)</span>
              )}
            </div>
          </div>
          <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-[.5px] mb-2">Custo estimado</div>
            {budget.totalEstimatedCost > 0 ? (
              <>
                <div className="text-[22px] font-bold text-slate-800">{formatCurrency(budget.totalEstimatedCost)}</div>
                <div className="text-[11.5px] text-slate-400 mt-1">soma das ordens abertas</div>
              </>
            ) : (
              <>
                <div className="text-[18px] font-semibold text-slate-300">—</div>
                <div className="text-[11.5px] text-slate-400 mt-1">nenhuma estimativa informada</div>
              </>
            )}
          </div>
          <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
            <div className="text-[11px] text-slate-400 uppercase tracking-[.5px] mb-2">Custo real</div>
            {budget.totalActualCost > 0 ? (
              <>
                <div className={`text-[22px] font-bold ${
                  budget.totalEstimatedCost > 0 && budget.totalActualCost > budget.totalEstimatedCost
                    ? 'text-red-600'
                    : budget.totalEstimatedCost > 0
                    ? 'text-emerald-600'
                    : 'text-slate-800'
                }`}>
                  {formatCurrency(budget.totalActualCost)}
                </div>
                <div className="text-[11.5px] text-slate-400 mt-1">
                  {budget.totalEstimatedCost > 0
                    ? budget.totalActualCost > budget.totalEstimatedCost
                      ? `${formatCurrency(budget.totalActualCost - budget.totalEstimatedCost)} acima do estimado`
                      : `${formatCurrency(budget.totalEstimatedCost - budget.totalActualCost)} abaixo do estimado`
                    : `${budget.completedRecords} ordem(ns) concluída(s)`}
                </div>
              </>
            ) : (
              <>
                <div className="text-[18px] font-semibold text-slate-300">—</div>
                <div className="text-[11.5px] text-slate-400 mt-1">nenhum custo registrado</div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex gap-[6px] px-4 py-[10px] border-b border-slate-100 flex-wrap">
          {(['ALL', 'REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
            <button
              key={s}
              data-testid={`maintenance-status-filter-${String(s).toLowerCase()}`}
              onClick={() => { setStatusFilter(s); setCurrentPage(0) }}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border-[1.5px] transition ${
                statusFilter === s
                  ? 'bg-blue-100 text-blue-700 border-blue-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
              }`}
            >
              {s === 'ALL' ? 'Todas' : MAINTENANCE_STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Código', 'Ativo', 'Descrição', 'Status', 'Criada em', 'Ações'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : (page?.content ?? []).length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma ordem encontrada</td></tr>
              ) : (page?.content ?? []).map((m) => (
                <tr key={m.id} data-testid="maintenance-row" className="hover:bg-slate-50 transition-colors">
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className="font-mono text-[12px] text-blue-700">{formatCode('MNT', m.id)}</span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-600">
                    {resolveAssetLabel(m.assetId, assetList)}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] max-w-[240px] truncate" title={m.description}>
                    {m.description}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                          <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${
                            MAINTENANCE_STATUS_COLORS[m.status as keyof typeof MAINTENANCE_STATUS_COLORS] ?? 'bg-slate-100 text-slate-500'
                          }`}>
                            {MAINTENANCE_STATUS_LABELS[m.status as keyof typeof MAINTENANCE_STATUS_LABELS] ?? m.status}
                          </span>
                        </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                    {new Date(m.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <div className="flex gap-[5px]">
                      {m.status === 'REQUESTED' && (
                        <TipButton testId="maintenance-action-start" tip="Iniciar" loading={actionLoadingId === m.id} onClick={() => handleStart(m)}>
                          <Play size={13} />
                        </TipButton>
                      )}
                      {m.status === 'IN_PROGRESS' && (
                        <TipButton testId="maintenance-action-complete" tip="Concluir" onClick={() => {
                          setCompleteForm({ resolution: '', actualCost: '' })
                          setShowComplete(m)
                        }}>
                          <CheckCheck size={13} />
                        </TipButton>
                      )}
                      {['REQUESTED', 'IN_PROGRESS'].includes(m.status) && (
                        <TipButton testId="maintenance-action-cancel" tip="Cancelar" danger loading={actionLoadingId === m.id} onClick={() => handleCancel(m)}>
                          <X size={13} />
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

      <CreateMaintenanceModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        assets={assetList}
        form={form}
        setForm={setForm}
        descError={descError}
        setDescError={setDescError}
        onConfirm={handleCreate}
        saving={saving}
        actionError={actionError}
      />

      <CompleteMaintenanceModal
        maintenance={showComplete}
        onClose={() => setShowComplete(null)}
        assets={assetList}
        form={completeForm}
        setForm={setCompleteForm}
        resolveError={resolveError}
        setResolveError={setResolveError}
        onConfirm={handleComplete}
        saving={saving}
        actionError={actionError}
      />
    </div>
  )
}
