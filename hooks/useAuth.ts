'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profil } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profil, setProfil] = useState<Profil | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchProfil = async (userId: string) => {
      try {
        const { data } = await supabase
          .from('profils')
          .select('*')
          .eq('id', userId)
          .single()
        setProfil(data)
      } catch {
        setProfil(null)
      }
    }

    const init = async () => {
      try {
        // Timeout de sécurité : si Supabase ne répond pas en 5s, on arrête le loading
        const timeout = setTimeout(() => {
          setLoading(false)
        }, 5000)

        const { data: { user } } = await supabase.auth.getUser()
        clearTimeout(timeout)
        setUser(user)
        if (user) await fetchProfil(user.id)
      } catch {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchProfil(session.user.id)
      } else {
        setProfil(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return { user, profil, loading, logout }
}
