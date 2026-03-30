import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { UserRole } from '../types'
import { authApi, userApi } from '../api'
import { tokenService } from '../utils/token'

interface AuthUser {
  userId: number
  email: string
  role: UserRole
  name?: string
  organizationId: number
  unitId: number | null
}

type AuthStep = 'idle' | 'mfa'

export interface AuthContextType {
  user: AuthUser | null
  isAuthenticated: boolean
  authStep: AuthStep
  pendingUserId: number | null
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean }>
  verifyMfa: (code: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isGestor: boolean
  isOperador: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

// ─────────────────────────────────────────────────────────
// JWT
// ─────────────────────────────────────────────────────────
interface JwtPayload {
  sub?: string
  role?: UserRole
  userId?: number
  organizationId?: number
  unitId?: number
}

function parseJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split('.')[1]
    const decoded = decodeURIComponent(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(decoded)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [authStep, setAuthStep] = useState<AuthStep>('idle')
  const [pendingUserId, setPendingUserId] = useState<number | null>(null)

  // ─────────────────────────────────────────────────────────
  // FALLBACK: enriquece com dados da API quando JWT não tem claims completos
  // ─────────────────────────────────────────────────────────
  const enrichUser = useCallback(async (base: { email: string; role: UserRole }, signal?: AbortSignal) => {
    try {
      if (signal?.aborted) return

      const result = await userApi.list({ page: 0, size: 50, sort: 'id,asc' })
      const found = result.content.find((u) => u.email === base.email) ?? null

      if (signal?.aborted) return

      if (found) {
        setUser({
          userId: found.id,
          email: found.email,
          role: found.role,
          name: found.name,
          organizationId: found.organizationId,
          unitId: found.unitId ?? null,
        })
      } else {
        setUser({ userId: 0, organizationId: 0, unitId: null, ...base })
      }
    } catch {
      if (signal?.aborted) return
      setUser({ userId: 0, organizationId: 0, unitId: null, ...base })
    }
  }, [])

  // ─────────────────────────────────────────────────────────
  // REHYDRATE
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    const token = tokenService.getAccess()

    if (!token) return

    const parsed = parseJwt(token)

    if (!parsed?.sub) return

    // ✅ JWT com claims completos (backend atualizado) — rehydrate instantâneo sem chamada API
    if (parsed.role && parsed.userId && parsed.organizationId) {
      setUser({
        userId: parsed.userId,
        email: parsed.sub,
        role: parsed.role,
        organizationId: parsed.organizationId,
        unitId: parsed.unitId ?? null,
      })
      return
    }

    // Fallback: JWT sem claims (tokens antigos) — busca dados na API
    if (parsed.role) {
      setUser({
        userId: 0,
        email: parsed.sub,
        role: parsed.role,
        organizationId: 0,
        unitId: null,
      })
    }

    enrichUser(
      { email: parsed.sub, role: parsed.role ?? 'OPERADOR' },
      controller.signal
    )

    return () => controller.abort()
  }, [enrichUser])

  // ─────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string): Promise<{ mfaRequired: boolean }> => {
      const data = await authApi.login({ email, password })

      if (data.mfaRequired) {
        setPendingUserId(data.userId)
        setAuthStep('mfa')
        return { mfaRequired: true }
      }

      tokenService.set(data.accessToken, data.refreshToken)

      setUser({
        userId: data.userId,
        email: data.email ?? email,
        role: data.role,
        organizationId: data.organizationId ?? 0,
        unitId: data.unitId ?? null,
      })

      setAuthStep('idle')
      return { mfaRequired: false }
    },
    []
  )

  // ─────────────────────────────────────────────────────────
  // MFA
  // ─────────────────────────────────────────────────────────
  const verifyMfa = useCallback(
    async (code: string) => {
      if (!pendingUserId) throw new Error('No pending MFA session')

      const data = await authApi.mfaVerify({ userId: pendingUserId, code })

      tokenService.set(data.accessToken, data.refreshToken)

      setUser({
        userId: data.userId,
        email: data.email ?? '',
        role: data.role,
        organizationId: data.organizationId ?? 0,
        unitId: data.unitId ?? null,
      })

      setAuthStep('idle')
      setPendingUserId(null)
    },
    [pendingUserId]
  )

  // ─────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    tokenService.clear()
    setUser(null)
    setAuthStep('idle')
    setPendingUserId(null)
  }, [])

  // ─────────────────────────────────────────────────────────
  // ROLES
  // ─────────────────────────────────────────────────────────
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    authStep,
    pendingUserId,
    login,
    verifyMfa,
    logout,
    isAdmin: user?.role === 'ADMIN',
    isGestor: user?.role === 'GESTOR',
    isOperador: user?.role === 'OPERADOR',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
