import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, logout, getSession, onAuthChange } from '@/services/auth'
import type { AuthUser } from '@/types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getSession().then((session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? '' })
      }
      setLoading(false)
    })

    const sub = onAuthChange((u) => setUser(u))
    return () => sub.data.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await login(email, password)
    navigate('/dashboard')
  }, [navigate])

  const signOut = useCallback(async () => {
    await logout()
    navigate('/login')
  }, [navigate])

  return { user, loading, signIn, signOut }
}
