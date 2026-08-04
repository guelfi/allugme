import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as authApi from '../api/auth'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  isInitializing: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isSaasAdmin: boolean
  isAgencyAdmin: boolean
  isIndependent: boolean
  canManageBrokers: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const token = authApi.readToken()
    if (!token) {
      setIsInitializing(false)
      return
    }

    authApi
      .fetchMe()
      .then(setUser)
      .catch(() => authApi.clearToken())
      .finally(() => setIsInitializing(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authApi.login(email, password)
      authApi.persistToken(result.accessToken)
      setUser(result.user)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha no login'
      return { success: false, error: message }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    authApi.clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isInitializing,
      isLoading,
      login,
      logout,
      isSaasAdmin: user?.role === 'saas_admin',
      isAgencyAdmin: user?.membershipRole === 'agency_admin',
      isIndependent:
        user?.membershipRole === 'independent_broker' || user?.tenantType === 'independent',
      canManageBrokers: Boolean(user?.canManageBrokers),
    }),
    [user, isInitializing, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
