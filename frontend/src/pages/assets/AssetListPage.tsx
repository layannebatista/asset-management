import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Download, Search, Eye, UserCheck, ArrowLeftRight, Wrench, Trash2, UserX, ShieldAlert } from 'lucide-react'
import { unitApi, userApi, exportApi, insuranceApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { AssetResponse, AssetInsurance, AssetStatus, AssetType, UnitResponse, UserResponse } from '../../types'
import {
  ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_TYPE_LABELS, ASSET_TYPE_OPTIONS,
  INPUT_CLS, resolveUnitName, resolveUserName,
  TipButton, Pagination, ErrorBanner, parseCurrency,
} from '../../shared'

import { useAssets } from './hooks/useAssets'

import { RetireModal } from './components/modals/RetireModal'
import { CreateAssetModal } from './components/modals/CreateAssetModal'
import { AssignUserModal } from './components/modals/AssignUserModal'
import { TransferModal } from './components/modals/TransferModal'
import { MaintenanceModal } from './components/modals/MaintenanceModal'

const STATUS_FILTERS: Array<{ label: string; value: AssetStatus | 'ALL' }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Disponível', value: 'AVAILABLE' },
  { label: 'Atribuído', value: 'ASSIGNED' },
  { label: 'Manutenção', value: 'IN_MAINTENANCE' },
  { label: 'Transferência', value: 'IN_TRANSFER' },
  { label: 'Aposentado', value: 'RETIRED' },
]

const VALID_STATUSES: Array<AssetStatus | 'ALL'> = ['ALL', 'AVAILABLE', 'ASSIGNED', 'IN_MAINTENANCE', 'IN_TRANSFER', 'RETIRED']

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AssetListPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAdmin, isGestor } = useAuth()
  const assets = useAssets()

  // Filtros vindos da URL
  const urlUnitId = searchParams.get('unitId') ? Number(searchParams.get('unitId')) : undefined
  const urlAssignedUserId = searchParams.get('assignedUserId') ? Number(searchParams.get('assignedUserId')) : undefined
  const urlStatus = searchParams.get('status') as AssetStatus | null
  const insuranceMode = searchParams.get('insurance') === 'expiring'

  const initialStatus: AssetStatus | 'ALL' =
    urlStatus && VALID_STATUSES.includes(urlStatus) ? urlStatus : 'ALL'

  const effectiveUnitId = urlUnitId ?? (!isAdmin && isGestor ? user?.unitId : undefined)
  const effectiveAssignedUserId = urlAssignedUserId ?? (!isAdmin && !isGestor ? user?.userId : undefined)

  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'ALL'>(initialStatus)
  const [typeFilter, setTypeFilter] = useState<AssetType | 'ALL'>('ALL')
  const [actionError, setActionError] = useState('')

  const [units, setUnits] = useState<UnitResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])

  // Mapa assetId → seguro a vencer (só carregado no modo insurance)
  const [expiringMap, setExpiringMap] = useState<Map<number, AssetInsurance>>(new Map())
  const [expiringAssetIds, setExpiringAssetIds] = useState<Set<number>>(new Set())

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<{ type: AssetType | ''; model: string; unitId: string }>({ type: '', model: '', unitId: '' })

  const [showAssign, setShowAssign] = useState<AssetResponse | null>(null)
  const [assignUserId, setAssignUserId] = useState('')

  const [showTransfer, setShowTransfer] = useState<AssetResponse | null>(null)
  const [transferForm, setTransferForm] = useState({ toUnitId: '', reason: '' })

  const [showMaint, setShowMaint] = useState<AssetResponse | null>(null)
  const [maintDesc, setMaintDesc] = useState('')
  const [maintCost, setMaintCost] = useState('')

  const [showRetire, setShowRetire] = useState<AssetResponse | null>(null)

  const [saving, setSaving] = useState(false)

  // Carrega seguros a vencer quando no modo insurance
  useEffect(() => {
    if (!insuranceMode) return
    insuranceApi.getExpiring(30)
      .then((list) => {
        const map = new Map<number, AssetInsurance>()
        const ids = new Set<number>()
        list.forEach((ins) => {
          map.set(ins.assetId, ins)
          ids.add(ins.assetId)
        })
        setExpiringMap(map)
        setExpiringAssetIds(ids)
      })
      .catch(console.error)
  }, [insuranceMode])

  const load = useCallback(() => {
    assets.load({
      page: currentPage,
      size: 10,
      sort: 'id,desc',
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(typeFilter !== 'ALL' ? { type: typeFilter } : {}),
      ...(search ? { search } : {}),
      ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
      ...(effectiveAssignedUserId ? { assignedUserId: effectiveAssignedUserId } : {}),
    })
  }, [currentPage, statusFilter, search, effectiveUnitId, effectiveAssignedUserId, typeFilter])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    userApi.list({ size: 200, status: 'ACTIVE' })
      .then((p) => setUsers(Array.isArray(p?.content) ? p.content : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    const orgId = user?.organizationId
    if (!orgId) return
    unitApi.listByOrg(orgId)
      .then((list) => {
        const active = Array.isArray(list) ? list.filter(u => u.status === 'ACTIVE') : []
        setUnits(isGestor && user?.unitId ? active.filter(u => u.id === user.unitId) : active)
      })
      .catch(console.error)
  }, [user?.organizationId])

  const reload = () => load()

  const handleCreate = async () => {
    if (!user || !createForm.model || !createForm.type || !createForm.unitId) return
    setSaving(true); setActionError('')
    try {
      await assets.create(user.organizationId, {
        type: createForm.type,
        model: createForm.model,
        unitId: Number(createForm.unitId),
      })
      setShowCreate(false)
      setCreateForm({ type: '', model: '', unitId: '' })
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao criar ativo')
    } finally { setSaving(false) }
  }

  const handleAssign = async () => {
    if (!showAssign || !assignUserId) return
    setSaving(true); setActionError('')
    try {
      await assets.assign(showAssign.id, Number(assignUserId))
      setShowAssign(null); setAssignUserId('')
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao atribuir ativo')
    } finally { setSaving(false) }
  }

  const handleUnassign = async (asset: AssetResponse) => {
    if (!confirm(`Remover atribuição do ativo ${asset.assetTag}? O ativo voltará para Disponível.`)) return
    setActionError('')
    try {
      await assets.unassign(asset.id)
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao remover atribuição')
    }
  }

  const handleTransfer = async () => {
    if (!showTransfer || !transferForm.toUnitId || !transferForm.reason) return
    setSaving(true); setActionError('')
    try {
      await assets.transfer({
        assetId: showTransfer.id,
        toUnitId: Number(transferForm.toUnitId),
        reason: transferForm.reason,
      })
      setShowTransfer(null); setTransferForm({ toUnitId: '', reason: '' })
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao solicitar transferência')
    } finally { setSaving(false) }
  }

  const handleMaintenance = async () => {
    if (!showMaint || maintDesc.length < 10) return
    setSaving(true); setActionError('')
    try {
      const estimatedCost = maintCost ? parseCurrency(maintCost) : undefined
      await assets.maintenance({ assetId: showMaint.id, description: maintDesc, estimatedCost })
      setShowMaint(null); setMaintDesc(''); setMaintCost('')
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao abrir manutenção')
    } finally { setSaving(false) }
  }

  const handleRetire = async () => {
    if (!showRetire) return
    setSaving(true); setActionError('')
    try {
      await assets.retire(showRetire.id)
      setShowRetire(null)
      reload()
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? 'Erro ao aposentar ativo')
    } finally { setSaving(false) }
  }

  // No modo insurance, filtra client-side para só mostrar ativos com seguro a vencer
  const pageContent = assets.page?.content ?? []
  const visibleContent = insuranceMode && expiringAssetIds.size > 0
    ? pageContent.filter((a) => expiringAssetIds.has(a.id))
    : pageContent

  const page = assets.page
  const totalPages = page?.totalPages ?? 0

  // Colunas da tabela — adiciona "Seguro" no modo insurance
  const baseHeaders = [
    'Código do Ativo', 'Modelo', 'Tipo',
    ...(effectiveUnitId ? [] : ['Unidade']),
    ...(effectiveAssignedUserId ? [] : ['Responsável']),
    'Status',
    ...(insuranceMode ? ['Seguro'] : []),
    'Ações',
  ]
  const colSpan = baseHeaders.length

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Ativos</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {insuranceMode
              ? 'Ativos com apólice de seguro a vencer em até 30 dias'
              : effectiveAssignedUserId
              ? 'Ativos atribuídos a você'
              : effectiveUnitId
              ? 'Ativos da sua unidade'
              : 'Ciclo de vida completo dos ativos da organização'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportApi.downloadAssets(undefined, undefined)} className="flex items-center gap-[7px] px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-50 transition">
            <Download size={14} /> Exportar CSV
          </button>
          {(isAdmin || isGestor) && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-[7px] px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition">
              <Plus size={14} /> Novo Ativo
            </button>
          )}
        </div>
      </div>

      <ErrorBanner message={actionError || assets.error} onDismiss={() => setActionError('')} />

      {/* Banner informativo no modo insurance */}
      {insuranceMode && (
        <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-[8px] bg-red-50 border border-red-200 text-red-800 text-[13px]">
          <ShieldAlert size={15} className="flex-shrink-0" />
          <span>Exibindo apenas ativos com apólice de seguro a vencer em até 30 dias. Acesse o detalhe do ativo para renovar.</span>
        </div>
      )}

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        {/* Barra de busca — oculta no modo insurance pois o filtro já é fixo */}
        {!insuranceMode && (
          <div className="flex items-center gap-2 px-4 py-[14px] border-b border-slate-100">
            <div className="relative flex-1 max-w-[320px]">
              <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(0) }}
                placeholder="Buscar por modelo ou código..."
                className="w-full border-[1.5px] border-slate-200 rounded-[7px] py-2 pl-8 pr-3 text-[13px] bg-slate-50 outline-none focus:border-blue-600 focus:bg-white transition"
              />
            </div>
          </div>
        )}

        {/* Filtros de status — ocultos no modo insurance */}
        {!insuranceMode && (
          <div className="flex gap-[6px] px-4 py-[10px] border-b border-slate-100 flex-wrap items-center">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setCurrentPage(0) }}
                className={`px-3 py-1 rounded-full text-[12px] font-medium border-[1.5px] transition ${
                  statusFilter === f.value
                    ? 'bg-blue-100 text-blue-700 border-blue-500'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
                }`}
              >
                {f.label}{f.value === 'ALL' && page ? ` (${page.totalElements})` : ''}
              </button>
            ))}
            <div className="ml-2 pl-2 border-l border-slate-200">
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value as AssetType | 'ALL'); setCurrentPage(0) }}
                className="border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[5px] text-[12px] bg-white outline-none text-slate-600 hover:border-blue-400 transition"
              >
                <option value="ALL">Todos os tipos</option>
                {ASSET_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {baseHeaders.map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assets.loading ? (
                <tr><td colSpan={colSpan} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : visibleContent.length === 0 ? (
                <tr><td colSpan={colSpan} className="text-center py-12 text-slate-400">Nenhum ativo encontrado</td></tr>
              ) : visibleContent.map((asset) => {
                const ins = expiringMap.get(asset.id)
                const days = ins ? daysUntil(ins.expiryDate) : null
                return (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className="font-mono text-[12px] text-blue-700 font-medium">{asset.assetTag}</span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px]">{asset.model}</td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className="text-[11.5px] font-semibold bg-slate-100 text-slate-600 px-2 py-[3px] rounded-full">
                        {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
                      </span>
                    </td>
                    {!effectiveUnitId && (
                      <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px] text-slate-600">
                        {resolveUnitName(asset.unitId, units)}
                      </td>
                    )}
                    {!effectiveAssignedUserId && (
                      <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px] text-slate-600">
                        {resolveUserName(asset.assignedUserId, users)}
                      </td>
                    )}
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${ASSET_STATUS_COLORS[asset.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {ASSET_STATUS_LABELS[asset.status] ?? asset.status}
                      </span>
                    </td>

                    {/* Coluna seguro — só no modo insurance */}
                    {insuranceMode && (
                      <td className="px-[14px] py-3 border-b border-slate-50">
                        {ins ? (
                          <div>
                            <div className="text-[12px] font-semibold text-red-700">
                              {days !== null && days <= 0 ? 'Vencida' : `Vence em ${days} dia${days === 1 ? '' : 's'}`}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-[1px]">
                              {ins.insurer} · {ins.policyNumber}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {new Date(ins.expiryDate).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11.5px] text-slate-300">—</span>
                        )}
                      </td>
                    )}

                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <div className="flex gap-[5px]">
                        <TipButton tip="Ver detalhes" onClick={() => navigate(`/assets/${asset.id}`)}>
                          <Eye size={13} />
                        </TipButton>
                        {asset.status === 'AVAILABLE' && (
                          <TipButton tip="Atribuir usuário" onClick={() => { setShowAssign(asset); setAssignUserId('') }}>
                            <UserCheck size={13} />
                          </TipButton>
                        )}
                        {asset.status === 'ASSIGNED' && (
                          <TipButton tip="Remover atribuição" onClick={() => handleUnassign(asset)}>
                            <UserX size={13} />
                          </TipButton>
                        )}
                        {asset.status === 'AVAILABLE' && (
                          <TipButton tip="Solicitar transferência" onClick={() => { setShowTransfer(asset); setTransferForm({ toUnitId: '', reason: '' }) }}>
                            <ArrowLeftRight size={13} />
                          </TipButton>
                        )}
                        {['AVAILABLE', 'ASSIGNED'].includes(asset.status) && (
                          <TipButton tip="Abrir manutenção" onClick={() => { setShowMaint(asset); setMaintDesc('') }}>
                            <Wrench size={13} />
                          </TipButton>
                        )}
                        {(isAdmin || isGestor) && asset.status !== 'RETIRED' && (
                          <TipButton tip="Aposentar ativo" danger onClick={() => setShowRetire(asset)}>
                            <Trash2 size={13} />
                          </TipButton>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {page && !insuranceMode && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalElements={page.totalElements}
            pageSize={10}
            isFirst={page.first}
            isLast={page.last}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      <CreateAssetModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        form={createForm}
        setForm={setCreateForm}
        units={units}
        onConfirm={handleCreate}
        saving={saving}
        error={actionError}
      />
      <AssignUserModal
        asset={showAssign}
        onClose={() => setShowAssign(null)}
        users={users}
        assignUserId={assignUserId}
        setAssignUserId={setAssignUserId}
        onConfirm={handleAssign}
        saving={saving}
      />
      <TransferModal
        asset={showTransfer}
        onClose={() => setShowTransfer(null)}
        units={units}
        form={transferForm}
        setForm={setTransferForm}
        onConfirm={handleTransfer}
        saving={saving}
      />
      <MaintenanceModal
        asset={showMaint}
        onClose={() => { setShowMaint(null); setMaintCost('') }}
        desc={maintDesc}
        setDesc={setMaintDesc}
        cost={maintCost}
        setCost={setMaintCost}
        onConfirm={handleMaintenance}
        saving={saving}
      />
      <RetireModal
        asset={showRetire}
        onCancel={() => setShowRetire(null)}
        onConfirm={handleRetire}
        loading={saving}
      />
    </div>
  )
}
