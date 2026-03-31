import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { UserRole } from '../types'
import { tokenService } from '../utils/token'

interface Props {
  children: ReactNode
  roles?: UserRole[]
}

// ─────────────────────────────────────────────────────────
// Loading Component 
// ─────────────────────────────────────────────────────────
function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <div className="w-7 h-7 border-[2.5px] border-slate-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-[13px]">Carregando...</span>
      </div>
    </div>
  )
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user, authStep } = useAuth()

  const hasToken = typeof window !== 'undefined' && !!tokenService.getAccess()

  // ─────────────────────────────────────────────────────────
  // MFA FLOW 
  // ─────────────────────────────────────────────────────────
  if (authStep === 'mfa') return null

  // ─────────────────────────────────────────────────────────
  // REHYDRATE 
  // ─────────────────────────────────────────────────────────
  if (!isAuthenticated && hasToken) {
    return <FullScreenLoader />
  }

  // ─────────────────────────────────────────────────────────
  // NOT AUTHENTICATED
  // ─────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // ─────────────────────────────────────────────────────────
  // ROLE VALIDATION
  // ─────────────────────────────────────────────────────────
  if (roles && (!user || !roles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />
  }

  // ─────────────────────────────────────────────────────────
  // OK
  // ─────────────────────────────────────────────────────────
  return <>{children}</>
}