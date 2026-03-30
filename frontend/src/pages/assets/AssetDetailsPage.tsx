import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { assetApi, depreciationApi, insuranceApi, unitApi, userApi, organizationApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type {
  AssetResponse, AssetDepreciation, AssetInsurance,
  AssetStatusHistory, AssetAssignmentHistory, UnitResponse, UserResponse,
} from '../../types'
import { resolveUnitName, resolveUserName, ErrorBanner, parseCurrency } from '../../shared'
import { ASSET_STATUS_LABELS, ASSET_STATUS_COLORS, ASSET_TYPE_LABELS } from '../../shared'

import { AssetActionBar } from './components/AssetActionBar'
import { TabInfo } from './components/tabs/TabInfo'
import { TabDepreciation } from './components/tabs/TabDepreciation'
import { TabInsurance } from './components/tabs/TabInsurance'
import { TabHistory } from './components/tabs/TabHistory'
import { AssignModal } from './components/modals/AssignModal'
import { FinancialModal } from './components/modals/FinancialModal'
import type { FinancialFormState } from './components/modals/FinancialModal'
import { TransferModal } from './components/modals/TransferModal'
import { MaintenanceModal } from './components/modals/MaintenanceModal'
import { maintenanceApi, transferApi } from '../../api'

export interface AssetResponseExtended extends AssetResponse {
  purchaseDate?: string
  warrantyExpiry?: string
  supplier?: string
  invoiceNumber?: string
  invoiceDate?: string
}

const TAB_LABELS: Record<string, string> = {
  info: 'Informações', depreciation: 'Depreciação', insurance: 'Seguros', history: 'Histórico',
}

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const assetId = Number(id)
  const nav = useNavigate()
  const { isAdmin, isGestor } = useAuth()

  const [asset, setAsset] = useState<AssetResponseExtended | null>(null)
  const [dep, setDep] = useState<AssetDepreciation | null>(null)
  const [insurance, setInsurance] = useState<AssetInsurance[]>([])
  const [history, setHistory] = useState<AssetStatusHistory[]>([])
  const [assignmentHistory, setAssignmentHistory] = useState<AssetAssignmentHistory[]>([])
  const [units, setUnits] = useState<UnitResponse[]>([])
  const [users, setUsers] = useState<UserResponse[]>([])
  const [orgName, setOrgName] = useState('')
  const [tab, setTab] = useState<'info' | 'depreciation' | 'insurance' | 'history'>('info')
  const [loading, setLoading] = useState(true)

  const [actionError, setActionError] = useState('')
  const [actionSaving, setActionSaving] = useState(false)
  const [showQuickAssign, setShowQuickAssign] = useState(false)
  const [quickAssignUserId, setQuickAssignUserId] = useState('')

  const [showFinancial, setShowFinancial] = useState(false)
  const [saving, setSaving] = useState(false)

  const [showTransfer, setShowTransfer] = useState(false)
  const [transferForm, setTransferForm] = useState({ toUnitId: '', reason: '' })
  const [transferSaving, setTransferSaving] = useState(false)
  const [transferError, setTransferError] = useState('')

  const [showMaint, setShowMaint] = useState(false)
  const [maintDesc, setMaintDesc] = useState('')
  const [maintSaving, setMaintSaving] = useState(false)

  const handleTransferSubmit = async () => {
    if (!asset || !transferForm.toUnitId || !transferForm.reason) return
    setTransferSaving(true); setTransferError('')
    try {
      await transferApi.create({ assetId: asset.id, toUnitId: Number(transferForm.toUnitId), reason: transferForm.reason })
      setShowTransfer(false)
      setTransferForm({ toUnitId: '', reason: '' })
      await refreshAsset()
    } catch (e: any) {
      setTransferError(e?.response?.data?.message ?? 'Erro ao solicitar transferência')
    } finally { setTransferSaving(false) }
  }

  const handleMaintenanceSubmit = async () => {
    if (!asset || maintDesc.length < 10) return
    setMaintSaving(true)
    try {
      await maintenanceApi.create({ assetId: asset.id, description: maintDesc })
      setShowMaint(false)
      setMaintDesc('')
      await refreshAsset()
    } catch (e: any) {
      console.error(e)
    } finally { setMaintSaving(false) }
  }

  const refreshAsset = async () => {
    if (!assetId || Number.isNaN(assetId)) return
    const updated = await assetApi.getById(assetId)
    setAsset(updated as AssetResponseExtended)
  }

  useEffect(() => {
    if (!assetId || Number.isNaN(assetId)) return

    let mounted = true
    setLoading(true)

    Promise.all([
      assetApi.getById(assetId),
      depreciationApi.getByAsset(assetId).catch(() => null),
      insuranceApi.getByAsset(assetId).catch(() => []),
      assetApi.getStatusHistory(assetId).catch(() => []),
      assetApi.getAssignmentHistory(assetId).catch(() => []),
    ])
      .then(([a, d, i, h, ah]) => {
        if (!mounted) return
        setAsset(a as AssetResponseExtended)
        setDep(d)
        setInsurance(Array.isArray(i) ? i : [])
        setHistory(Array.isArray(h) ? h : [])
        setAssignmentHistory(Array.isArray(ah) ? ah : [])
      })
      .catch((err) => console.error(err))
      .finally(() => mounted && setLoading(false))

    return () => {
      mounted = false
    }
  }, [assetId])

  useEffect(() => {
    if (!asset) return

    unitApi.listByOrg(asset.organizationId)
      .then((list) => setUnits(Array.isArray(list) ? list : []))
      .catch((err) => console.error(err))

    organizationApi.getById(asset.organizationId)
      .then((org) => setOrgName(org.name))
      .catch((err) => console.error(err))

    userApi.list({ size: 100 })
      .then((p) => setUsers(Array.isArray(p?.content) ? p.content : Array.isArray(p) ? p : []))
      .catch((err) => console.error(err))
  }, [asset])

  const handleQuickAssign = async () => {
    if (!quickAssignUserId || !asset) return

    setActionSaving(true)
    setActionError('')

    try {
      await assetApi.assign(asset.id, Number(quickAssignUserId))
      await refreshAsset()
      setShowQuickAssign(false)
      setQuickAssignUserId('')
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao atribuir'
      )
    } finally {
      setActionSaving(false)
    }
  }

  const handleQuickUnassign = async () => {
    if (!asset || (typeof window !== 'undefined' && !confirm('Remover atribuição deste ativo?'))) return

    setActionSaving(true)
    setActionError('')

    try {
      await assetApi.unassign(asset.id)
      await refreshAsset()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao desatribuir'
      )
    } finally {
      setActionSaving(false)
    }
  }

  const handleQuickRetire = async () => {
    if (!asset || (typeof window !== 'undefined' && !confirm(`Aposentar o ativo ${asset.assetTag}? Esta ação é irreversível.`))) return

    setActionSaving(true)
    setActionError('')

    try {
      await assetApi.retire(asset.id)
      await refreshAsset()
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ??
        e?.response?.data?.message ??
        'Erro ao aposentar'
      )
    } finally {
      setActionSaving(false)
    }
  }

  const handleSaveFinancial = async (finForm: FinancialFormState) => {
    setSaving(true)

    try {
      await assetApi.updateFinancial(assetId, {
        purchaseValue: parseCurrency(finForm.purchaseValue),
        residualValue: finForm.residualValue ? parseCurrency(finForm.residualValue) : undefined,
        usefulLifeMonths: Number(finForm.usefulLifeMonths),
        depreciationMethod: finForm.depreciationMethod as 'LINEAR' | 'DECLINING_BALANCE' | 'SUM_OF_YEARS',
        purchaseDate: finForm.purchaseDate,
        warrantyExpiry: finForm.warrantyExpiry || undefined,
        supplier: finForm.supplier || undefined,
        invoiceNumber: finForm.invoiceNumber || undefined,
        invoiceDate: finForm.invoiceDate || undefined,
      })

      const updated = await depreciationApi.getByAsset(assetId).catch(() => null)
      setDep(updated)
      setShowFinancial(false)
    } catch (e) {
      console.error('Erro ao salvar dados financeiros:', e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20 text-slate-400">Carregando...</div>
  if (!asset) return <div className="text-center py-20 text-slate-400">Ativo não encontrado</div>

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="font-mono text-[13px] text-blue-700 mb-[2px]">{asset.assetTag}</div>
          <h1 className="text-[20px] font-bold tracking-tight leading-snug">{asset.model}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11.5px] bg-slate-100 text-slate-600 font-semibold px-2 py-[3px] rounded-full">
              {ASSET_TYPE_LABELS[asset.type] ?? asset.type}
            </span>
            <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${ASSET_STATUS_COLORS[asset.status] ?? 'bg-slate-100 text-slate-500'}`}>
              {ASSET_STATUS_LABELS[asset.status] ?? asset.status}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => nav('/assets')}
          className="flex items-center gap-1 px-3 py-[7px] rounded-[8px] border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition text-[12px] font-semibold"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      <ErrorBanner message={actionError} onDismiss={() => setActionError('')} />

      <AssetActionBar
        asset={asset}
        isAdmin={isAdmin}
        isGestor={isGestor}
        actionSaving={actionSaving}
        onAssign={() => { setShowQuickAssign(true); setQuickAssignUserId('') }}
        onUnassign={handleQuickUnassign}
        onRetire={handleQuickRetire}
        onTransfer={() => { setShowTransfer(true); setTransferForm({ toUnitId: '', reason: '' }); setTransferError('') }}
        onMaintenance={() => { setShowMaint(true); setMaintDesc('') }}
      />

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {(['info', 'depreciation', 'insurance', 'history'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-[10px] text-[13px] font-semibold border-b-2 transition ${
              tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <TabInfo
          asset={asset}
          orgName={orgName}
          unitName={resolveUnitName(asset.unitId, units)}
          userName={resolveUserName(asset.assignedUserId, users)}
        />
      )}

      {tab === 'depreciation' && (
        <TabDepreciation dep={dep} onEdit={() => setShowFinancial(true)} canEdit={isAdmin || isGestor} />
      )}

      {tab === 'insurance' && (
        <TabInsurance
          assetId={assetId}
          insurance={insurance}
          setInsurance={setInsurance}
          isAdmin={isAdmin}
          isGestor={isGestor}
        />
      )}

      {tab === 'history' && (
        <TabHistory
          history={history}
          assignmentHistory={assignmentHistory}
          users={users}
        />
      )}

      <AssignModal
        open={showQuickAssign}
        users={users}
        assignUserId={quickAssignUserId}
        onUserChange={setQuickAssignUserId}
        onConfirm={handleQuickAssign}
        onCancel={() => setShowQuickAssign(false)}
        saving={actionSaving}
      />

      <FinancialModal
        open={showFinancial}
        dep={dep}
        asset={asset}
        onClose={() => setShowFinancial(false)}
        onSave={handleSaveFinancial}
        saving={saving}
      />

      {showTransfer && (
        <TransferModal
          asset={asset}
          onClose={() => setShowTransfer(false)}
          units={units}
          form={transferForm}
          setForm={setTransferForm}
          onConfirm={handleTransferSubmit}
          saving={transferSaving}
        />
      )}

      {showMaint && (
        <MaintenanceModal
          asset={asset}
          onClose={() => setShowMaint(false)}
          desc={maintDesc}
          setDesc={setMaintDesc}
          onConfirm={handleMaintenanceSubmit}
          saving={maintSaving}
        />
      )}
    </div>
  )
}