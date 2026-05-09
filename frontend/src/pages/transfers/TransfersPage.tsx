import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { transferApi, assetApi, unitApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import type { TransferResponse, AssetResponse, UnitResponse, TransferStatus } from '../../types'
import {
  TRANSFER_STATUS_LABELS,
  TRANSFER_STATUS_COLORS,
  resolveUnitName,
  formatCode,
  formatDate,
  ErrorBanner,
} from '../../shared'
import { TransferDetail } from './components/TransferDetail'
import { CreateTransferModal } from './components/CreateTransferModal'

const PAGE_SIZE = 20

const TRANSFER_STATUS_FILTERS: Array<{ label: string; value: TransferStatus | 'ALL' }> = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Pendente', value: 'PENDING' },
  { label: 'Aprovado', value: 'APPROVED' },
  { label: 'Rejeitado', value: 'REJECTED' },
  { label: 'Concluído', value: 'COMPLETED' },
  { label: 'Cancelado', value: 'CANCELLED' },
]

export default function TransfersPage() {
  const { user, isGestor, isAdmin } = useAuth()

  const effectiveUnitId = !isAdmin && isGestor ? user?.unitId : undefined

  const [transfers, setTransfers] = useState<TransferResponse[]>([])
  const [selected, setSelected] = useState<TransferResponse | null>(null)
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'ALL'>('ALL')

  const [loading, setLoading] = useState(true)
  const [transferPage, setTransferPage] = useState(0)
  const [transferTotal, setTransferTotal] = useState(0)

  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  const [allUnits, setAllUnits] = useState<UnitResponse[]>([])
  const [allAssets, setAllAssets] = useState<AssetResponse[]>([])

  const [showCreate, setShowCreate] = useState(false)
  const [modalAssets, setModalAssets] = useState<AssetResponse[]>([])
  const [modalUnits, setModalUnits] = useState<UnitResponse[]>([])

  const [form, setForm] = useState({
    assetId: '',
    toUnitId: '',
    reason: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reasonError, setReasonError] = useState('')

  useEffect(() => {
    if (!user?.organizationId) return

    unitApi
      .listByOrg(user.organizationId)
      .then((list) => setAllUnits(Array.isArray(list) ? list : []))
      .catch(console.error)

    assetApi
      .list({
        size: 500,
        ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
      })
      .then((p) =>
        setAllAssets(Array.isArray(p?.content) ? p.content : [])
      )
      .catch(console.error)
  }, [user?.organizationId, effectiveUnitId])

  const load = (pg = transferPage, selectFirst = false) => {
    setLoading(true)

    transferApi
      .list({
        page: pg,
        size: PAGE_SIZE,
        sort: 'requestedAt,desc',
        ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
        ...(effectiveUnitId ? { unitId: effectiveUnitId } : {}),
      })
      .then((p) => {
        const content = Array.isArray(p?.content) ? p.content : []

        setTransfers(content)
        setTransferTotal(p?.totalElements ?? 0)

        if (content.length) {
          const stillExists = selectFirst
            ? undefined
            : content.find((t) => t.id === selected?.id)
          setSelected(stillExists ?? content[0])
        } else {
          setSelected(null)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(0)
  }, [statusFilter])

  useEffect(() => {
    load(transferPage)
  }, [transferPage])

  const openCreate = () => {
    setError('')
    setReasonError('')
    setForm({ assetId: '', toUnitId: '', reason: '' })

    Promise.all([
      assetApi.list({ size: 100, status: 'AVAILABLE' }),
      user?.organizationId
        ? unitApi.listByOrg(user.organizationId)
        : Promise.resolve([]),
    ])
      .then(([ap, ul]) => {
        setModalAssets(
          Array.isArray(ap?.content) ? ap.content : []
        )
        setModalUnits(Array.isArray(ul) ? ul : [])
      })
      .catch(console.error)

    setShowCreate(true)
  }

  const handleCreate = async () => {
    if (!form.assetId || !form.toUnitId) return

    const trimmedReason = form.reason.trim()

    if (trimmedReason.length < 10) {
      setReasonError(
        'Descreva o motivo com pelo menos 10 caracteres'
      )
      return
    }

    setSaving(true)
    setError('')
    setReasonError('')

    try {
      await transferApi.create({
        assetId: Number(form.assetId),
        toUnitId: Number(form.toUnitId),
        reason: trimmedReason,
      })

      setShowCreate(false)
      load(0, true)
    } catch (e: any) {
      setError(
        e?.response?.data?.error?.message ??
          e?.response?.data?.message ??
          'Erro ao criar solicitação'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleAction = async (
    fn: () => Promise<any>,
    label: string
  ) => {
    setActionError('')
    setActionLoading(true)

    try {
      await fn()
      load(transferPage)
    } catch (e: any) {
      setActionError(
        e?.response?.data?.error?.message ??
          e?.response?.data?.message ??
          `Erro ao ${label}`
      )
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold tracking-tight">
            Transferências
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Movimentações de ativos entre unidades
          </p>
        </div>

        <button
          data-testid="transfer-new-request-btn"
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
        >
          <Plus size={14} /> Nova Solicitação
        </button>
      </div>

      <ErrorBanner
        message={actionError}
        onDismiss={() => setActionError('')}
      />

      <div className="flex gap-[6px] px-4 py-[10px] border-b border-slate-100 flex-wrap items-center">
        {TRANSFER_STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            data-testid={`transfer-status-filter-${String(f.value).toLowerCase()}`}
            onClick={() => { setStatusFilter(f.value); setTransferPage(0) }}
            className={`px-3 py-1 rounded-full text-[12px] font-medium border-[1.5px] transition ${
              statusFilter === f.value
                ? 'bg-blue-100 text-blue-700 border-blue-500'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-400'
            }`}
          >
            {f.label}{f.value === 'ALL' ? ` (${transferTotal})` : ''}
          </button>
        ))}
      </div>

      <div
        className="flex rounded-[10px] border border-slate-200 bg-white overflow-hidden shadow-sm"
        style={{ height: 'calc(100vh - 190px)' }}
      >
        <div className="w-[290px] min-w-[290px] border-r border-slate-200 flex flex-col">
          <div className="p-[14px] border-b border-slate-100">
            <div className="font-bold text-[14px]">
              Transferências
            </div>
            <div className="text-[11.5px] text-slate-500 mt-[2px]">
              {
                transfers.filter(
                  (t) => t.status === 'PENDING'
                ).length
              }{' '}
              aguardando aprovação
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-[13px]">
                Carregando...
              </div>
            ) : (
              transfers.map((t: TransferResponse) => (
                <div
                  key={t.id}
                  data-testid="transfer-card"
                  onClick={() => setSelected(t)}
                  className={`px-[14px] py-3 border-b border-slate-50 cursor-pointer transition border-l-[3px] ${
                    selected?.id === t.id
                      ? 'bg-blue-50 border-l-blue-700'
                      : 'border-l-transparent hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-[5px]">
                    <span className="font-mono text-[12.5px] text-blue-700 font-bold">
                      {formatCode('TRF', t.id)}
                    </span>

                    <span
                      className={`text-[11px] font-semibold px-[8px] py-[2px] rounded-full ${
                        TRANSFER_STATUS_COLORS[t.status as keyof typeof TRANSFER_STATUS_COLORS] ??
                        'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {TRANSFER_STATUS_LABELS[t.status as keyof typeof TRANSFER_STATUS_LABELS] ??
                        t.status}
                    </span>
                  </div>

                  <div className="text-[11.5px] text-slate-400">
                    {resolveUnitName(
                      t.fromUnitId,
                      allUnits
                    )}{' '}
                    →{' '}
                    {resolveUnitName(
                      t.toUnitId,
                      allUnits
                    )}
                  </div>

                  <div className="text-[11px] text-slate-300 mt-1">
                    {formatDate(t.requestedAt)}
                  </div>
                </div>
              ))
            )}
          </div>

          {transferTotal > PAGE_SIZE && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 flex-shrink-0">
              <span className="text-[10.5px] text-slate-400">
                {transferTotal} total
              </span>

              <div className="flex gap-1 items-center">
                <button
                  type="button"
                  disabled={transferPage === 0}
                  onClick={() =>
                    setTransferPage((p) => p - 1)
                  }
                  className="w-6 h-6 rounded border border-slate-200 text-slate-500 text-[11px] flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                >
                  ‹
                </button>

                <span className="text-[11px] text-slate-500 px-1">
                  {transferPage + 1}/
                  {Math.ceil(transferTotal / PAGE_SIZE)}
                </span>

                <button
                  type="button"
                  disabled={
                    (transferPage + 1) * PAGE_SIZE >=
                    transferTotal
                  }
                  onClick={() =>
                    setTransferPage((p) => p + 1)
                  }
                  className="w-6 h-6 rounded border border-slate-200 text-slate-500 text-[11px] flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 p-5 overflow-y-auto">
          {!selected ? (
            <div className="flex items-center justify-center h-full text-slate-400 text-[13px]">
              Selecione uma transferência
            </div>
          ) : (
            <TransferDetail
              selected={selected}
              allUnits={allUnits}
              allAssets={allAssets}
              isAdmin={isAdmin}
              isGestor={isGestor}
              actionLoading={actionLoading}
              onAction={handleAction}
            />
          )}
        </div>
      </div>

      <CreateTransferModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        assets={modalAssets}
        units={modalUnits}
        form={form}
        setForm={setForm}
        reasonError={reasonError}
        setReasonError={setReasonError}
        error={error}
        onConfirm={handleCreate}
        saving={saving}
      />
    </div>
  )
}