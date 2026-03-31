import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell, LogOut, X } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { auditApi } from '../../api'
import type { AuditEvent } from '../../types'
import { USER_ROLE_LABELS } from '../../shared'

const AUDIT_LABELS: Record<string, string> = {
  ASSET_CREATED:          'Ativo criado',
  ASSET_ASSIGNED:         'Ativo atribuído',
  ASSET_UNASSIGNED:       'Ativo desatribuído',
  ASSET_RETIRED:          'Ativo aposentado',
  ASSET_STATUS_CHANGED:   'Status do ativo alterado',
  ASSET_UPDATED:          'Ativo atualizado',
  TRANSFER_REQUESTED:     'Transferência solicitada',
  TRANSFER_APPROVED:      'Transferência aprovada',
  TRANSFER_REJECTED:      'Transferência rejeitada',
  TRANSFER_COMPLETED:     'Transferência concluída',
  TRANSFER_CANCELLED:     'Transferência cancelada',
  MAINTENANCE_OPENED:     'Manutenção aberta',
  MAINTENANCE_STARTED:    'Manutenção iniciada',
  MAINTENANCE_COMPLETED:  'Manutenção concluída',
  MAINTENANCE_CANCELLED:  'Manutenção cancelada',
  USER_CREATED:           'Usuário criado',
  USER_BLOCKED:           'Usuário bloqueado',
  USER_ACTIVATED:         'Usuário ativado',
  USER_INACTIVATED:       'Usuário inativado',
  USER_STATUS_CHANGED:    'Status do usuário alterado',
  UNIT_CREATED:           'Unidade criada',
  UNIT_ACTIVATED:         'Unidade ativada',
  UNIT_INACTIVATED:       'Unidade inativada',
  UNIT_STATUS_CHANGED:    'Status da unidade alterado',
}

const AUDIT_DETAILS: Record<string, string> = {
  // Usuários
  'User created':           'Usuário criado',
  'User activated':         'Usuário ativado',
  'User blocked':           'Usuário bloqueado',
  'User inactivated':       'Usuário inativado',
  // Unidades
  'Unit created':           'Unidade criada',
  'Unit activated':         'Unidade ativada',
  'Unit inactivated':       'Unidade inativada',
  // Ativos
  'Asset created':          'Ativo criado',
  'Asset updated':          'Ativo atualizado',
  'Asset retired':          'Ativo aposentado',
  'Asset assigned':         'Ativo atribuído',
  'Asset unassigned':       'Ativo desatribuído',
  // Transferências
  'Transfer requested':     'Transferência solicitada',
  'Transfer approved':      'Transferência aprovada',
  'Transfer rejected':      'Transferência rejeitada',
  'Transfer completed':     'Transferência concluída',
  'Transfer cancelled':     'Transferência cancelada',
  // Manutenções (inglês, caso a API retorne)
  'Maintenance opened':     'Manutenção aberta',
  'Maintenance started':    'Manutenção iniciada',
  'Maintenance completed':  'Manutenção concluída',
  'Maintenance cancelled':  'Manutenção cancelada',
}

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
function getInitials(name?: string, email?: string) {
  if (name) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }
  return email?.slice(0, 2).toUpperCase() ?? 'U'
}

function formatDate(date: string) {
  return new Date(date).toLocaleString('pt-BR')
}

function translateDetails(details?: string) {
  if (!details) return undefined
  return AUDIT_DETAILS[details] ?? details
}

export default function Header() {
  const { user, logout } = useAuth()

  const [showBell, setShowBell] = useState(false)
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [hasUnread, setHasUnread] = useState(true)

  const eventsRef = useRef<AuditEvent[]>([])
  eventsRef.current = events

  // ─────────────────────────────────────────────────────────
  // FETCH EVENTS
  // ─────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    try {
      setLoadingEvents(true)

      const items = await auditApi.list({ size: 10, sort: 'createdAt,desc' })

      const prev = eventsRef.current

      if (items.length > 0 && prev.length > 0 && items[0]?.id !== prev[0]?.id) {
        setHasUnread(true)
      } else if (prev.length === 0 && items.length > 0) {
        setHasUnread(true)
      }

      setEvents(items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingEvents(false)
    }
  }, [])

  // ─────────────────────────────────────────────────────────
  // LOAD WHEN OPEN
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (showBell) fetchEvents()
  }, [showBell, fetchEvents])

  // Fechar painel com ESC
  useEffect(() => {
    if (!showBell) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowBell(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showBell])

  // ─────────────────────────────────────────────────────────
  // POLLING
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showBell) {
        auditApi
          .list({ size: 1, sort: 'createdAt,desc' })
          .then((items) => {
            const prev = eventsRef.current

            if (items.length > 0 && prev.length > 0 && items[0]?.id !== prev[0]?.id) {
              setHasUnread(true)
            }
          })
          .catch(() => {})
      }
    }, 60_000)

    return () => clearInterval(interval)
  }, [showBell])

  const initials = getInitials(user?.name, user?.email)

  return (
    <header className="h-[54px] bg-white border-b border-slate-200 flex items-center justify-between px-[18px] flex-shrink-0">

      <div />

      <div className="flex items-center gap-[6px]">

        <div className="relative">
          <button
            onClick={() => {
              setShowBell((v) => !v)
              setHasUnread(false)
            }}
            title="Últimas atividades"
            className="relative w-[34px] h-[34px] rounded-[7px] border-[1.5px] border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <Bell size={15} />

            {hasUnread && !showBell && (
              <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] bg-red-600 rounded-full border-[1.5px] border-white" />
            )}
          </button>

          {showBell && (
            <div
              className="absolute top-[42px] right-0 z-50 bg-white rounded-[12px] border border-slate-200 shadow-xl w-[360px]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
                <span className="text-[13.5px] font-bold">Últimas atividades</span>
                <button onClick={() => setShowBell(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={14} />
                </button>
              </div>

              <ul className="max-h-[340px] overflow-y-auto divide-y divide-slate-50">
                {loadingEvents ? (
                  <li className="text-center py-6 text-[12px] text-slate-400">Carregando...</li>
                ) : events.length === 0 ? (
                  <li className="text-center py-6 text-[12px] text-slate-400">Sem atividades</li>
                ) : (
                  events.map((e) => (
                    <li key={e.id} className="px-4 py-3 hover:bg-slate-50 transition">
                      <div className="text-[12.5px] font-medium text-slate-700">
                        {AUDIT_LABELS[e.eventType] ?? e.eventType}
                      </div>

                      {e.details && (
                        <div className="text-[11px] text-slate-400 mt-[2px] truncate">
                          {translateDetails(e.details)}
                        </div>
                      )}

                      <div className="text-[10.5px] text-slate-400 mt-[2px]">
                        {formatDate(e.createdAt)}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        {showBell && (
          <div className="fixed inset-0 z-40" onClick={() => setShowBell(false)} />
        )}

        <div className="flex items-center gap-2 px-[10px] py-[5px] rounded-[8px] border-[1.5px] border-slate-200 ml-1">
          <div className="w-[26px] h-[26px] rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
            {initials}
          </div>

          <div>
            <div className="text-[12.5px] font-semibold text-slate-900 leading-tight">
              {user?.email}
            </div>
            <div className="text-[10.5px] text-slate-400 leading-tight">
              {USER_ROLE_LABELS[user?.role as keyof typeof USER_ROLE_LABELS] ?? user?.role}
            </div>
          </div>

          <button
            onClick={logout}
            title="Sair"
            className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </header>
  )
}
