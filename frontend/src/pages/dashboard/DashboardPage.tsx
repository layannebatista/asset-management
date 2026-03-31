import { useAuth } from '../../context/AuthContext'
import { AdminDashboard } from './AdminDashboard'
import { GestorDashboard } from './GestorDashboard'
import { OperadorDashboard } from './OperadorDashboard'

export default function DashboardPage() {
  const { user, isAdmin, isGestor } = useAuth()

  // ✅ fallback de loading
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        Carregando dashboard...
      </div>
    )
  }

  // ✅ prioridade explícita
  if (isAdmin) {
    return <AdminDashboard />
  }

  if (isGestor) {
    return <GestorDashboard />
  }

  // ✅ fallback padrão seguro
  return <OperadorDashboard />
}