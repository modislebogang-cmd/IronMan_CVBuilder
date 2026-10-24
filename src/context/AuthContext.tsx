import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, getToken, setToken } from '../lib/api'
import type { AiDraft, User } from '../types'

interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
  purchase: (card: { cardNumber: string; cardName: string; expiry: string; cvv: string }) => Promise<void>
  generate: (resume: Partial<User['resume']>) => Promise<AiDraft>
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      const { user: fresh } = await api<{ user: User }>('/auth/me')
      setUser(fresh)
    } catch (err) {
      // Token expired or account deleted — clear it so the app falls back to
      // the logged-out state instead of looping on 401s.
      if (err instanceof ApiError && err.status === 401) setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const authenticate = async (path: '/auth/login' | '/auth/register', payload: Record<string, string>) => {
    const { token, user: nextUser } = await api<{ token: string; user: User }>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    setToken(token)
    setUser(nextUser)
  }

  const login = (email: string, password: string) => authenticate('/auth/login', { email, password })

  const register = (name: string, email: string, password: string) =>
    authenticate('/auth/register', { name, email, password })

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const purchase = async (card: { cardNumber: string; cardName: string; expiry: string; cvv: string }) => {
    const { user: nextUser } = await api<{ user: User }>('/billing/purchase', {
      method: 'POST',
      body: JSON.stringify({ plan: 'pro', ...card }),
    })
    setUser(nextUser)
  }

  const generate = async (resume: Partial<User['resume']>) => {
    const { draft, user: nextUser } = await api<{ draft: AiDraft; user: User }>('/resume/generate', {
      method: 'POST',
      body: JSON.stringify(resume),
    })
    setUser(nextUser)
    return draft
  }

  const value = useMemo<AuthValue>(
    () => ({ user, loading, login, register, logout, refresh, purchase, generate, setUser }),
    [user, loading, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
