import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Download, Search, Eye, UserCheck, ArrowLeftRight, Wrench, Trash2, UserX } from 'lucide-react'
import { assetApi, maintenanceApi, transferApi, unitApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { AssetResponse, AssetStatus, Page } from '../../types'

const STATUS_LABELS: Record<AssetStatus, string> = {
  AVAILABLE: 'Disponível', ASSIGNED: 'Atribuído', MAINTENANCE: 'Manutenção',
  RETIRED: 'Aposentado', TRANSFER: 'Transferência',
}
const STATUS_COLORS: Record<AssetStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700', ASSIGNED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700', RETIRED: 'bg-slate-100 text-slate-500',
  TRANSFER: 'bg-purple-100 text-purple-700',
}
const STATUS_FILTERS: Array<AssetStatus | 'ALL'> = ['ALL', 'AVAILABLE', 'ASSIGNED', 'MAINTENANCE', 'TRANSFER', 'RETIRED']

// ─── Tooltip icon button ──────────────────────────────────────────────────────
function TipBtn({ tip, onClick, danger, children }: {
  tip: string; onClick?: () => void; danger?: boolean; children: React.ReactNode
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`w-[28px] h-[28px] rounded-[6px] border flex items-center justify-center transition ${
          danger
            ? 'border-red-200 text-red-500 hover:bg-red-50'
            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
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

export default function AssetListPage() {
  const navigate = useNavigate()
  const { user, isGestor } = useAuth()

  const [page, setPage] = useState<Page<AssetResponse> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'ALL'>('ALL')

  // Modal state
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ type: '', model: '', unitId: '', mode: 'auto' })
  const [showAssign, setShowAssign] = useState<AssetResponse | null>(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [showTransfer, setShowTransfer] = useState<AssetResponse | null>(null)
  const [transferForm, setTransferForm] = useState({ toUnitId: '', reason: '' })
  const [showMaint, setShowMaint] = useState<AssetResponse | null>(null)
  const [maintDesc, setMaintDesc] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    assetApi.list({
      page: currentPage, size: 20, sort: 'id,desc',
      ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
      ...(search ? { model: search } : {}),
    }).then(setPage).catch(console.error).finally(() => setLoading(false))
  }, [currentPage, statusFilter, search])

  useEffect(() => { load() }, [load])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!createForm.model || !createForm.type || !createForm.unitId || !user) return
    setSaving(true)
    try {
      const orgId = user.userId // fallback; ideally from user.organizationId
      const body = { type: createForm.type as any, model: createForm.model, unitId: Number(createForm.unitId) }
      if (createForm.mode === 'auto') await assetApi.createAuto(orgId, body)
      else await assetApi.create(orgId, body)
      setShowCreate(false); setCreateForm({ type: '', model: '', unitId: '', mode: 'auto' }); load()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleAssign = async () => {
    if (!showAssign || !assignUserId) return
    setSaving(true)
    try { await assetApi.assign(showAssign.id, Number(assignUserId)); setShowAssign(null); load() }
    catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleUnassign = async (asset: AssetResponse) => {
    await assetApi.unassign(asset.id); load()
  }

  const handleTransfer = async () => {
    if (!showTransfer || !transferForm.toUnitId || !transferForm.reason) return
    setSaving(true)
    try {
      await transferApi.create({ assetId: showTransfer.id, toUnitId: Number(transferForm.toUnitId), reason: transferForm.reason })
      setShowTransfer(null); setTransferForm({ toUnitId: '', reason: '' }); load()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleMaintenance = async () => {
    if (!showMaint || maintDesc.length < 10) return
    setSaving(true)
    try {
      await maintenanceApi.create({ assetId: showMaint.id, description: maintDesc })
      setShowMaint(null); setMaintDesc(''); load()
    } catch (err) { console.error(err) } finally { setSaving(false) }
  }

  const handleRetire = async (asset: AssetResponse) => {
    if (!confirm(`Aposentar ${asset.assetTag}? Esta ação não pode ser desfeita.`)) return
    await assetApi.retire(asset.id); load()
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">Ativos</h1>
          <p className="text-[13px] text-slate-500 mt-1">Ciclo de vida completo dos ativos da organização</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/reports')} className="flex items-center gap-[7px] px-4 py-2 rounded-[8px] border-[1.5px] border-slate-200 bg-white text-[13px] font-semibold hover:bg-slate-50 transition">
            <Download size={14} /> Exportar CSV
          </button>
          {isGestor && (
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-[7px] px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition">
              <Plus size={14} /> Novo Ativo
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
        {/* Search bar */}
        <div className="flex items-center gap-2 px-4 py-[14px] border-b border-slate-100">
          <div className="relative flex-1 max-w-[320px]">
            <Search size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por modelo, AssetTag..."
              className="w-full border-[1.5px] border-slate-200 rounded-[7px] py-2 pl-8 pr-3 text-[13px] bg-slate-50 outline-none focus:border-blue-600 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Status pills */}
        <div className="flex gap-[6px] px-4 py-[10px] border-b border-slate-100 flex-wrap">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setCurrentPage(0) }}
              className={`px-3 py-1 rounded-full text-[12px] font-medium border-[1.5px] transition ${
                statusFilter === s
                  ? 'bg-blue-100 text-blue-700 border-blue-500'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
              }`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s as AssetStatus]}
              {s === 'ALL' && page ? ` (${page.totalElements})` : ''}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['AssetTag', 'Modelo', 'Tipo', 'Unidade', 'Responsável', 'Status', 'Ações'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Carregando...</td></tr>
              ) : page?.content.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Nenhum ativo encontrado</td></tr>
              ) : page?.content.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className="font-mono text-[12px] text-blue-700 font-medium">{asset.assetTag}</span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px]">{asset.model}</td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className="text-[11.5px] font-semibold bg-slate-100 text-slate-600 px-2 py-[3px] rounded-full">{asset.type}</span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px] text-slate-600">Unidade #{asset.unitId}</td>
                  <td className="px-[14px] py-3 border-b border-slate-50 text-[13.5px] text-slate-600">
                    {asset.assignedUserId ? `Usuário #${asset.assignedUserId}` : '—'}
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${STATUS_COLORS[asset.status]}`}>
                      {STATUS_LABELS[asset.status]}
                    </span>
                  </td>
                  <td className="px-[14px] py-3 border-b border-slate-50">
                    <div className="flex gap-[5px]">
                      <TipBtn tip="Ver detalhes" onClick={() => navigate(`/assets/${asset.id}`)}>
                        <Eye size={13} />
                      </TipBtn>
                      {asset.status === 'AVAILABLE' && (
                        <TipBtn tip="Atribuir usuário" onClick={() => setShowAssign(asset)}>
                          <UserCheck size={13} />
                        </TipBtn>
                      )}
                      {asset.status === 'ASSIGNED' && (
                        <TipBtn tip="Remover atribuição" onClick={() => handleUnassign(asset)}>
                          <UserX size={13} />
                        </TipBtn>
                      )}
                      {['AVAILABLE', 'ASSIGNED'].includes(asset.status) && (
                        <TipBtn tip="Solicitar transferência" onClick={() => setShowTransfer(asset)}>
                          <ArrowLeftRight size={13} />
                        </TipBtn>
                      )}
                      {['AVAILABLE', 'ASSIGNED'].includes(asset.status) && (
                        <TipBtn tip="Abrir manutenção" onClick={() => setShowMaint(asset)}>
                          <Wrench size={13} />
                        </TipBtn>
                      )}
                      {isGestor && asset.status !== 'RETIRED' && (
                        <TipBtn tip="Aposentar ativo" danger onClick={() => handleRetire(asset)}>
                          <Trash2 size={13} />
                        </TipBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer pagination */}
        {page && (
          <div className="flex items-center justify-between px-4 py-[11px] border-t border-slate-100">
            <span className="text-[13px] text-slate-500">
              Exibindo <strong>{page.content.length}</strong> de <strong>{page.totalElements}</strong> ativos
            </span>
            <div className="flex gap-1">
              <PageBtn label="‹" disabled={page.first} onClick={() => setCurrentPage((p) => p - 1)} />
              {Array.from({ length: Math.min(5, page.totalPages) }, (_, i) => (
                <PageBtn key={i} label={String(i + 1)} active={i === currentPage} onClick={() => setCurrentPage(i)} />
              ))}
              <PageBtn label="›" disabled={page.last} onClick={() => setCurrentPage((p) => p + 1)} />
            </div>
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Novo Ativo">
        <div className="flex gap-2 mb-4">
          {['auto', 'manual'].map((m) => (
            <button key={m} onClick={() => setCreateForm((f) => ({ ...f, mode: m }))}
              className={`flex-1 py-2 rounded-[7px] text-[12.5px] font-semibold border-[1.5px] transition ${createForm.mode === m ? 'bg-blue-700 text-white border-blue-700' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}>
              {m === 'auto' ? 'AssetTag automático' : 'AssetTag manual'}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo *">
            <select value={createForm.type} onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value }))} className={inputCls}>
              <option value="">Selecione...</option>
              {['NOTEBOOK','DESKTOP','MONITOR','SMARTPHONE','IMPRESSORA','SERVIDOR','OUTROS'].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Modelo *">
            <input value={createForm.model} onChange={(e) => setCreateForm((f) => ({ ...f, model: e.target.value }))} placeholder="Dell Latitude 5520" className={inputCls} />
          </Field>
        </div>
        <Field label="ID da Unidade *">
          <input type="number" value={createForm.unitId} onChange={(e) => setCreateForm((f) => ({ ...f, unitId: e.target.value }))} placeholder="Ex: 1" className={inputCls} />
        </Field>
        <ModalFooter onCancel={() => setShowCreate(false)} onConfirm={handleCreate} loading={saving} confirmLabel="Criar Ativo" />
      </Modal>

      <Modal open={!!showAssign} onClose={() => setShowAssign(null)} title={`Atribuir: ${showAssign?.assetTag}`}>
        <Field label="Ativo">
          <input value={`${showAssign?.assetTag} · ${showAssign?.model}`} readOnly className={`${inputCls} bg-slate-50 text-slate-400`} />
        </Field>
        <Field label="ID do Usuário *">
          <input type="number" value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} placeholder="Ex: 42" className={inputCls} />
        </Field>
        <ModalFooter onCancel={() => setShowAssign(null)} onConfirm={handleAssign} loading={saving} confirmLabel="Confirmar Atribuição" />
      </Modal>

      <Modal open={!!showTransfer} onClose={() => setShowTransfer(null)} title={`Transferir: ${showTransfer?.assetTag}`}>
        <Field label="ID da Unidade de Destino *">
          <input type="number" value={transferForm.toUnitId} onChange={(e) => setTransferForm((f) => ({ ...f, toUnitId: e.target.value }))} className={inputCls} />
        </Field>
        <Field label="Motivo *">
          <textarea value={transferForm.reason} onChange={(e) => setTransferForm((f) => ({ ...f, reason: e.target.value }))} rows={3} className={inputCls} />
        </Field>
        <ModalFooter onCancel={() => setShowTransfer(null)} onConfirm={handleTransfer} loading={saving} confirmLabel="Solicitar Transferência" />
      </Modal>

      <Modal open={!!showMaint} onClose={() => setShowMaint(null)} title={`Manutenção: ${showMaint?.assetTag}`}>
        <Field label="Descrição do problema * (mín. 10 caracteres)">
          <textarea value={maintDesc} onChange={(e) => setMaintDesc(e.target.value)} rows={4} placeholder="Descreva o problema detalhadamente..." className={inputCls} />
        </Field>
        <ModalFooter onCancel={() => setShowMaint(null)} onConfirm={handleMaintenance} loading={saving} confirmLabel="Abrir Ordem" />
      </Modal>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────
const inputCls = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

function PageBtn({ label, active, disabled, onClick }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`w-7 h-7 rounded-[6px] border-[1.5px] text-[12px] font-semibold flex items-center justify-center transition ${
        active ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400 disabled:opacity-40'
      }`}>
      {label}
    </button>
  )
}

function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-[0_25px_60px_rgba(0,0,0,0.25)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-5 pb-0">
          <h2 className="text-[17px] font-bold">{title}</h2>
          <button onClick={onClose} className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50">✕</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px]">
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">{label}</label>
      {children}
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, loading, confirmLabel }: {
  onCancel: () => void; onConfirm: () => void; loading: boolean; confirmLabel: string
}) {
  return (
    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-2">
      <button onClick={onCancel} className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition">Cancelar</button>
      <button onClick={onConfirm} disabled={loading} className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50">
        {loading ? 'Salvando...' : confirmLabel}
      </button>
    </div>
  )
}
