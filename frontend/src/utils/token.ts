const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

export const tokenService = {
  getAccess: (): string | null => {
    try {
      return localStorage.getItem(ACCESS_KEY)
    } catch {
      return null
    }
  },

  getRefresh: (): string | null => {
    try {
      return localStorage.getItem(REFRESH_KEY)
    } catch {
      return null
    }
  },

  set: (access: string, refresh: string): void => {
    try {
      localStorage.setItem(ACCESS_KEY, access)
      localStorage.setItem(REFRESH_KEY, refresh)
    } catch {
      // evita crash silencioso
    }
  },

  clear: (): void => {
    try {
      localStorage.removeItem(ACCESS_KEY)
      localStorage.removeItem(REFRESH_KEY)
    } catch {
      // evita crash silencioso
    }
  },
}