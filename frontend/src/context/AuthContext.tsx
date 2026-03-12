import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '../types'
import { authApi } from '../api'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AuthUser {
  userId: number
  email: string
  role: UserRole
  name?: string
}

type AuthStep = 'idle' | 'mfa' // 'mfa' = waiting for OTP

interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  authStep: AuthStep
  pendingUserId: number | null   // set when MFA is required
  login: (email: string, password: string) => Promise<void>
  verifyMfa: (code: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isGestor: boolean
  isOperador: boolean
}

// ─── Context ─────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseJwt(token: string): { sub?: string; role?: UserRole; userId?: number } | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
  } catch {
    return null
  }
}

function buildUserFromToken(token: string, role?: UserRole): AuthUser | null {
  const parsed = parseJwt(token)
  if (!parsed) return null
  return {
    userId: parsed.userId ?? 0,
    email: parsed.sub ?? '',
    role: role ?? parsed.role ?? 'OPERADOR',
  }
}

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authStep, setAuthStep] = useState<AuthStep>('idle')
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const role = localStorage.getItem('userRole') as UserRole | null
    if (token) {
      const u = buildUserFromToken(token, role ?? undefined)
      if (u) setUser(u)
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login({ email, password })

    if (data.mfaRequired) {
      // Store pending userId and wait for OTP
      setPendingUserId(data.userId)
      setAuthStep('mfa')
      return
    }

    // No MFA required — store tokens and set user
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('userRole', data.role)
    const u = buildUserFromToken(data.accessToken, data.role)
    setUser(u)
    setAuthStep('idle')
  }, [])

  const verifyMfa = useCallback(async (code: string) => {
    if (!pendingUserId) throw new Error('No pending MFA session')
    const data = await authApi.mfaVerify({ userId: pendingUserId, code })

    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('refreshToken', data.refreshToken)
    localStorage.setItem('userRole', data.role)
    const u = buildUserFromToken(data.accessToken, data.role)
    setUser(u)
    setAuthStep('idle')
    setPendingUserId(null)
  }, [pendingUserId])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {}) // fire-and-forget
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('userRole')
    setUser(null)
    setAuthStep('idle')
    setPendingUserId(null)
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    authStep,
    pendingUserId,
    login,
    verifyMfa,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isGestor: user?.role === 'ADMIN' || user?.role === 'GESTOR',
    isOperador: true, // all roles can do operador actions
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
