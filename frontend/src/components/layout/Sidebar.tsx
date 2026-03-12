import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, ArrowLeftRight, Wrench,
  ClipboardList, Users, FileText, BarChart3, Shield,
} from 'lucide-react'

interface Props {
  collapsed: boolean
}

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  badge?: number
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { to: '/assets', label: 'Ativos', icon: <Package size={16} /> },
  { to: '/transfers', label: 'Transferências', icon: <ArrowLeftRight size={16} />, badge: 3 },
  { to: '/maintenance', label: 'Manutenção', icon: <Wrench size={16} /> },
  { to: '/inventory', label: 'Inventário', icon: <ClipboardList size={16} /> },
]

const MGMT_ITEMS: NavItem[] = [
  { to: '/users', label: 'Usuários', icon: <Users size={16} />, roles: ['ADMIN'] },
  { to: '/audit', label: 'Auditoria', icon: <FileText size={16} />, roles: ['ADMIN', 'GESTOR'] },
  { to: '/reports', label: 'Relatórios', icon: <BarChart3 size={16} />, roles: ['ADMIN', 'GESTOR'] },
]

export default function Sidebar({ collapsed }: Props) {
  const { user } = useAuth()
  const { pathname } = useLocation()

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  const navLinkClass = (active: boolean) =>
    `flex items-center gap-[9px] px-[10px] py-2 rounded-md text-[13px] font-medium transition-colors w-full text-left border-0 bg-transparent cursor-pointer whitespace-nowrap overflow-hidden ${
      active
        ? 'bg-blue-700 text-white'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`

  return (
    <aside
      className={`flex flex-col bg-slate-900 h-screen transition-all duration-200 ${
        collapsed ? 'w-[60px] min-w-[60px]' : 'w-[232px] min-w-[232px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-[10px] px-[14px] py-[18px] border-b border-slate-800 overflow-hidden">
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

      {/* Nav */}
      <nav className="flex-1 px-[6px] py-2 overflow-y-auto overflow-x-hidden space-y-px">
        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-[10px] pt-[10px] pb-1">
            Principal
          </p>
        )}
        {NAV_ITEMS.map((item) => (
          <NavLinkItem key={item.to} item={item} collapsed={collapsed} active={pathname.startsWith(item.to)} />
        ))}

        {!collapsed && (
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-[10px] pt-[14px] pb-1">
            Gestão
          </p>
        )}
        {collapsed && <div className="h-[1px] bg-slate-800 mx-2 my-2" />}
        {MGMT_ITEMS.filter((i) => !i.roles || (user && i.roles.includes(user.role))).map((item) => (
          <NavLinkItem key={item.to} item={item} collapsed={collapsed} active={pathname.startsWith(item.to)} />
        ))}
      </nav>

      {/* User */}
      <div className="px-[10px] pb-3 border-t border-slate-800 pt-3">
        <div className="flex items-center gap-[9px] px-[10px] py-[9px] bg-slate-800 rounded-[7px] overflow-hidden">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
            {initials}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <div className="text-[12.5px] font-semibold text-slate-100 truncate">{user?.email}</div>
              <div className="text-[10.5px] text-slate-500">{user?.role}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function NavLinkItem({ item, collapsed, active }: { item: NavItem; collapsed: boolean; active: boolean }) {
  return (
    <div className="relative group">
      <NavLink
        to={item.to}
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
        {!collapsed && item.badge && (
          <span className="ml-auto bg-red-600 text-white text-[10px] font-bold px-[6px] py-px rounded-full">
            {item.badge}
          </span>
        )}
      </NavLink>

      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-1 rounded-[5px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
          {item.label}
          {item.badge ? ` (${item.badge})` : ''}
        </div>
      )}
    </div>
  )
}
