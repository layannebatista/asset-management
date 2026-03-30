import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect, useState } from 'react'
import { unitApi } from '../../api'
import type { UnitResponse } from '../../types'
import type { UserRole } from '../../types'
import type { ReactNode } from 'react'
import { memo } from 'react'
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  ClipboardList, Users, FileText, BarChart3, Shield,
  Building2, MapPin, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react'

interface Props {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  badge?: number
  roles?: UserRole[]
  /**
   * Quando true, o link recebe automaticamente params de escopo conforme a role:
   * GESTOR  → ?unitId=X
   * OPERADOR → ?assignedUserId=X
   * ADMIN   → sem params (acesso total)
   */
  scoped?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/assets', label: 'Ativos', icon: <Package size={16} />, scoped: true },
  { to: '/transfers', label: 'Transferências', icon: <ArrowLeftRight size={16} />, roles: ['ADMIN', 'GESTOR'] },
  { to: '/maintenance', label: 'Manutenção', icon: <Wrench size={16} />, scoped: true },
  { to: '/inventory', label: 'Inventário', icon: <ClipboardList size={16} />, roles: ['ADMIN', 'GESTOR'] },
]

const MGMT_ITEMS: NavItem[] = [
  { to: '/organizations', label: 'Organização', icon: <Building2 size={16} />, roles: ['ADMIN'] },
  { to: '/units', label: 'Unidades', icon: <MapPin size={16} />, roles: ['ADMIN'] },
  { to: '/users', label: 'Usuários', icon: <Users size={16} />, roles: ['ADMIN'] },
  { to: '/audit', label: 'Auditoria', icon: <FileText size={16} />, roles: ['ADMIN', 'GESTOR'] },
  { to: '/reports', label: 'Relatórios', icon: <BarChart3 size={16} />, roles: ['ADMIN', 'GESTOR'] },
]

function canAccess(item: NavItem, role?: UserRole) {
  if (!item.roles) return true
  if (!role) return false
  return item.roles.includes(role)
}

/**
 * Resolve o destino final do link considerando a role do usuário logado.
 * As páginas de Ativos e Manutenção leem esses params via useSearchParams
 * e aplicam como filtro fixo de escopo — o usuário não consegue alterá-los.
 */
function buildScopedTo(basePath: string, scoped: boolean | undefined, user: { role: UserRole; unitId?: number | null; userId?: number | null } | null, isAdmin: boolean, isGestor: boolean): string {
  if (!scoped || isAdmin) return basePath

  if (isGestor && user?.unitId) {
    return `${basePath}?unitId=${user.unitId}`
  }

  // OPERADOR puro
  if (!isGestor && user?.userId) {
    return `${basePath}?assignedUserId=${user.userId}`
  }

  return basePath
}

export default function Sidebar({ collapsed, onToggle }: Props) {
  const { user, isAdmin, isGestor } = useAuth()
  const role = user?.role

  return (
    <aside
      className={`flex flex-col bg-slate-900 h-screen transition-all duration-200 ${
        collapsed ? 'w-[60px] min-w-[60px]' : 'w-[232px] min-w-[232px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-[14px] py-[18px] border-b border-slate-800 overflow-hidden">
        <div className="flex items-center gap-[10px] overflow-hidden">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-700 rounded-[7px] flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-[13.5px] font-bold text-slate-100">Patrimônio 360</div>
              <div className="text-[10px] text-slate-500">Gestão de Ativos</div>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          className="flex-shrink-0 w-7 h-7 rounded-[6px] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          title={collapsed ? 'Expandir menu' : 'Retrair menu'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-[6px] py-2 overflow-y-auto overflow-x-hidden space-y-px">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-[10px] pt-[10px] pb-1">
            Principal
          </p>
        )}

        {NAV_ITEMS.filter((item) => canAccess(item, role)).map((item) => (
          <NavLinkItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            to={buildScopedTo(item.to, item.scoped, user, isAdmin, isGestor)}
          />
        ))}

        {(isAdmin || isGestor) && (
          <>
            {!collapsed && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-[10px] pt-[14px] pb-1">
                Gestão
              </p>
            )}

            {collapsed && <div className="h-[1px] bg-slate-800 mx-2 my-2" />}

            {MGMT_ITEMS.filter((item) => canAccess(item, role)).map((item) => (
              <NavLinkItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                to={item.to}
              />
            ))}
          </>
        )}
      </nav>
      {/* Footer — context info for GESTOR */}
      {!collapsed && isGestor && !isAdmin && user?.unitId && (
        <SidebarUnitFooter unitId={user.unitId} />
      )}
    </aside>
  )
}

function SidebarUnitFooter({ unitId }: { unitId: number }) {
  const [unit, setUnit] = useState<UnitResponse | null>(null)

  useEffect(() => {
    unitApi.getById(unitId)
      .then(setUnit)
      .catch(() => {})
  }, [unitId])

  return (
    <div className="px-[10px] py-3 border-t border-slate-800 flex-shrink-0">
      <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-[3px]">
        Sua unidade
      </div>
      <div className="text-[12px] text-slate-300 font-semibold truncate">
        {unit?.name ?? 'Carregando...'}
      </div>
    </div>
  )
}

const NavLinkItem = memo(function NavLinkItem({
  item,
  collapsed,
  to,
}: {
  item: NavItem
  collapsed: boolean
  to: string
}) {
  return (
    <div className="relative group">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `flex items-center gap-[9px] px-[10px] py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden ${
            isActive
              ? 'bg-blue-700 text-white'
              : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
          }`
        }
      >
        <span className="flex-shrink-0">{item.icon}</span>
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && item.badge !== undefined && (
          <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-[6px] py-px rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>

      {collapsed && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-1 rounded-[5px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
          {item.label}
        </div>
      )}
    </div>
  )
})