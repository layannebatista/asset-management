import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { assetApi, depreciationApi, insuranceApi } from '../../api'
import type {
  AssetResponse,
  AssetDepreciation,
  AssetInsurance,
  AssetStatusHistory,
} from '../../types'

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-amber-100 text-amber-700',
  RETIRED: 'bg-slate-100 text-slate-500',
  TRANSFER: 'bg-purple-100 text-purple-700',
}

const TAB_LABELS: Record<string, string> = {
  info: 'Informacoes',
  depreciation: 'Depreciacao',
  insurance: 'Seguros',
  history: 'Historico',
}

const iCls = 'w-full border-[1.5px] border-slate-200 rounded-[7px] px-3 py-[9px] text-[13.5px] outline-none bg-slate-50 focus:border-blue-600 focus:bg-white transition'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px]">
      <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-[.4px] mb-[6px]">
        {label}
      </label>
      {children}
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, loading, label }: {
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  label: string
}) {
  return (
    <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 mt-2">
      <button
        onClick={onCancel}
        className="px-4 py-[8px] rounded-[8px] border-[1.5px] border-slate-200 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition"
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        disabled={loading}
        className="px-4 py-[8px] rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition disabled:opacity-50"
      >
        {loading ? 'Salvando...' : label}
      </button>
    </div>
  )
}

export default function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const assetId = Number(id)

  const [asset, setAsset] = useState<AssetResponse | null>(null)
  const [dep, setDep] = useState<AssetDepreciation | null>(null)
  const [insurance, setInsurance] = useState<AssetInsurance[]>([])
  const [history, setHistory] = useState<AssetStatusHistory[]>([])
  const [tab, setTab] = useState<'info' | 'depreciation' | 'insurance' | 'history'>('info')
  const [loading, setLoading] = useState(true)
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

  useEffect(() => {
    if (!assetId) return
    setLoading(true)
    Promise.all([
      assetApi.getById(assetId),
      depreciationApi.getByAsset(assetId).catch(() => null),
      insuranceApi.getByAsset(assetId).catch(() => []),
      assetApi.getStatusHistory(assetId).catch(() => []),
    ])
      .then(([a, d, i, h]) => {
        setAsset(a)
        setDep(d)
        setInsurance(i as AssetInsurance[])
        setHistory(h as AssetStatusHistory[])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [assetId])

  const handleAddInsurance = async () => {
    if (!insForm.policyNumber || !insForm.insurer || !insForm.coverageValue) return
    setSaving(true)
    try {
      await insuranceApi.create(assetId, {
        policyNumber: insForm.policyNumber,
        insurer: insForm.insurer,
        coverageValue: Number(insForm.coverageValue),
        premium: insForm.premium ? Number(insForm.premium) : undefined,
        startDate: insForm.startDate,
        expiryDate: insForm.expiryDate,
      })
      setShowIns(false)
      insuranceApi.getByAsset(assetId).then(setInsurance)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-20 text-slate-400">Carregando...</div>
  }
  if (!asset) {
    return <div className="text-center py-20 text-slate-400">Ativo nao encontrado</div>
  }

  return (
    <div>
      <div className="mb-5">
        <div className="font-mono text-[13px] text-blue-700 mb-1">{asset.assetTag}</div>
        <h1 className="text-[20px] font-bold tracking-tight">{asset.model}</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[11.5px] bg-slate-100 text-slate-600 font-semibold px-2 py-[3px] rounded-full">
            {asset.type}
          </span>
          <span className={`text-[11.5px] font-semibold px-[10px] py-[3px] rounded-full ${STATUS_COLORS[asset.status] ?? ''}`}>
            {asset.status}
          </span>
        </div>
      </div>

      <div className="flex gap-1 mb-5 border-b border-slate-200">
        {(['info', 'depreciation', 'insurance', 'history'] as const).map((t) => (
          <button
            key={t}
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
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm grid grid-cols-3 gap-4">
          {[
            { label: 'AssetTag', val: asset.assetTag },
            { label: 'Modelo', val: asset.model },
            { label: 'Tipo', val: asset.type },
            { label: 'Status', val: asset.status },
            { label: 'Organizacao', val: `#${asset.organizationId}` },
            { label: 'Unidade', val: `#${asset.unitId}` },
            { label: 'Atribuido a', val: asset.assignedUserId ? `#${asset.assignedUserId}` : 'Nenhum' },
          ].map((f) => (
            <div key={f.label}>
              <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">{f.label}</div>
              <div className="text-[13.5px] font-semibold">{f.val}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'depreciation' && dep && (
        <div className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Valor de Compra', val: dep.purchaseValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
              { label: 'Valor Atual', val: dep.currentValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
              { label: 'Depreciado', val: `${dep.depreciationPercentage.toFixed(1)}%` },
              { label: 'Metodo', val: dep.depreciationMethod },
              { label: 'Meses Decorridos', val: `${dep.elapsedMonths} / ${dep.usefulLifeMonths}` },
              { label: 'Total Depreciado', val: dep.fullyDepreciated ? 'Sim' : 'Nao' },
            ].map((f) => (
              <div key={f.label}>
                <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">{f.label}</div>
                <div className="text-[13.5px] font-semibold">{f.val}</div>
              </div>
            ))}
          </div>
          <div className="h-[8px] bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-700"
              style={{ width: `${100 - dep.depreciationPercentage}%` }}
            />
          </div>
          <div className="text-[11.5px] text-slate-400 mt-2">
            {(100 - dep.depreciationPercentage).toFixed(1)}% do valor patrimonial ainda ativo
          </div>
        </div>
      )}

      {tab === 'depreciation' && !dep && (
        <div className="bg-white rounded-[10px] border border-slate-200 p-10 text-center text-slate-400 shadow-sm">
          Sem dados de depreciacao para este ativo
        </div>
      )}

      {tab === 'insurance' && (
        <div>
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setShowIns(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-[8px] bg-blue-700 text-white text-[13px] font-semibold hover:bg-blue-800 transition"
            >
              <Plus size={14} />
              Cadastrar Apolice
            </button>
          </div>

          {insurance.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-slate-200 p-10 text-center text-slate-400 shadow-sm">
              Nenhuma apolice cadastrada
            </div>
          ) : (
            insurance.map((ins) => (
              <div key={ins.id} className="bg-white rounded-[10px] border border-slate-200 p-[18px] shadow-sm mb-3 grid grid-cols-3 gap-4">
                {[
                  { label: 'Apolice', val: ins.policyNumber },
                  { label: 'Seguradora', val: ins.insurer },
                  { label: 'Cobertura', val: ins.coverageValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
                  { label: 'Inicio', val: new Date(ins.startDate).toLocaleDateString('pt-BR') },
                  { label: 'Vencimento', val: new Date(ins.expiryDate).toLocaleDateString('pt-BR') },
                  { label: 'Premio', val: ins.premium ? ins.premium.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A' },
                ].map((f) => (
                  <div key={f.label}>
                    <div className="text-[10.5px] text-slate-400 uppercase tracking-[.4px] mb-1">{f.label}</div>
                    <div className="text-[13.5px] font-semibold">{f.val}</div>
                  </div>
                ))}
              </div>
            ))
          )}

          {showIns && (
            <div
              className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-5"
              onClick={(e) => e.target === e.currentTarget && setShowIns(false)}
            >
              <div className="bg-white rounded-[14px] w-full max-w-[520px] shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center px-6 pt-5 pb-0">
                  <h2 className="text-[17px] font-bold">Cadastrar Apolice de Seguro</h2>
                  <button
                    onClick={() => setShowIns(false)}
                    className="w-7 h-7 rounded-[6px] border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-50"
                  >
                    x
                  </button>
                </div>
                <div className="px-6 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Numero da Apolice *">
                      <input value={insForm.policyNumber} onChange={(e) => setInsForm((f) => ({ ...f, policyNumber: e.target.value }))} className={iCls} />
                    </Field>
                    <Field label="Seguradora *">
                      <input value={insForm.insurer} onChange={(e) => setInsForm((f) => ({ ...f, insurer: e.target.value }))} className={iCls} />
                    </Field>
                    <Field label="Valor de Cobertura *">
                      <input type="number" value={insForm.coverageValue} onChange={(e) => setInsForm((f) => ({ ...f, coverageValue: e.target.value }))} className={iCls} />
                    </Field>
                    <Field label="Premio">
                      <input type="number" value={insForm.premium} onChange={(e) => setInsForm((f) => ({ ...f, premium: e.target.value }))} className={iCls} />
                    </Field>
                    <Field label="Inicio *">
                      <input type="date" value={insForm.startDate} onChange={(e) => setInsForm((f) => ({ ...f, startDate: e.target.value }))} className={iCls} />
                    </Field>
                    <Field label="Vencimento *">
                      <input type="date" value={insForm.expiryDate} onChange={(e) => setInsForm((f) => ({ ...f, expiryDate: e.target.value }))} className={iCls} />
                    </Field>
                  </div>
                  <ModalFooter onCancel={() => setShowIns(false)} onConfirm={handleAddInsurance} loading={saving} label="Cadastrar" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-[10px] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50">
              <tr>
                {['Status Anterior', 'Novo Status', 'Alterado em', 'Por'].map((h) => (
                  <th key={h} className="px-[14px] py-[10px] text-left text-[11px] font-bold text-slate-400 uppercase tracking-[.5px] border-b border-slate-200">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-400">Sem historico</td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50">
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px]">{h.oldStatus ?? 'N/A'}</td>
                    <td className="px-[14px] py-3 border-b border-slate-50">
                      <span className="text-[11.5px] font-semibold bg-blue-100 text-blue-700 px-2 py-[3px] rounded-full">
                        {h.newStatus}
                      </span>
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      {new Date(h.changedAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-[14px] py-3 border-b border-slate-50 text-[13px] text-slate-500">
                      #{h.changedByUserId}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
