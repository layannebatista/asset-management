import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, Download, Bell, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface Props {
  onToggleSidebar: () => void
}

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/assets': 'Ativos',
  '/transfers': 'Transferências',
  '/maintenance': 'Manutenção',
  '/inventory': 'Inventário',
  '/users': 'Usuários',
  '/audit': 'Auditoria',
  '/reports': 'Relatórios',
}

export default function Header({ onToggleSidebar }: Props) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const base = '/' + pathname.split('/')[1]
  const pageTitle = BREADCRUMBS[base] ?? 'Patrimônio 360'
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'U'

  return (
    <header className="h-[54px] bg-white border-b border-slate-200 flex items-center justify-between px-[18px] flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-[10px]">
        <button
          onClick={onToggleSidebar}
          title="Recolher / expandir menu"
          className="w-[34px] h-[34px] rounded-[7px] border-[1.5px] border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <Menu size={16} />
        </button>
        <nav className="flex items-center gap-[6px] text-[13px] text-slate-500">
          <span>Patrimônio 360</span>
          <span className="text-slate-300">›</span>
          <span className="text-slate-900 font-semibold">{pageTitle}</span>
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-[6px]">
        {/* Export CSV */}
        <IconButton title="Exportar página atual (CSV)" onClick={() => navigate('/reports')}>
          <Download size={15} />
        </IconButton>

        {/* Reports */}
        <IconButton title="Relatórios & Exportações" onClick={() => navigate('/reports')}>
          <BarChart3 size={15} />
        </IconButton>

        {/* Notifications */}
        <IconButton title="Notificações" onClick={() => navigate('/audit')} dot>
          <Bell size={15} />
        </IconButton>

        {/* User chip */}
        <div className="flex items-center gap-2 px-[10px] py-[5px] rounded-[8px] border-[1.5px] border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors ml-1">
          <div className="w-[26px] h-[26px] rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0">
            {initials}
          </div>
          <div>
            <div className="text-[12.5px] font-semibold text-slate-900 leading-tight">{user?.email}</div>
            <div className="text-[10.5px] text-slate-400 leading-tight">{user?.role}</div>
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

function IconButton({
  children, title, onClick, dot,
}: {
  children: React.ReactNode; title: string; onClick?: () => void; dot?: boolean
}) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="relative w-[34px] h-[34px] rounded-[7px] border-[1.5px] border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
      >
        {children}
        {dot && (
          <span className="absolute top-[7px] right-[7px] w-[6px] h-[6px] bg-red-600 rounded-full border-[1.5px] border-white" />
        )}
      </button>
      <div className="absolute bottom-[-34px] left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-[11px] px-2 py-1 rounded-[5px] whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
        {title}
      </div>
    </div>
  )
}
