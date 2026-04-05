'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { RoleBadge } from '@/components/ui/RoleBadge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Profil, Role } from '@/lib/types'
import { ROLE_CONFIG } from '@/lib/constants'
import { Users, UserCheck, UserX, Shield } from 'lucide-react'

export default function AdminPage() {
  const { profil } = useAuth()
  const [users, setUsers] = useState<Profil[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (profil?.role !== 'direction') return
    const fetchUsers = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('profils').select('*').order('nom')
      setUsers(data ?? [])
      setLoading(false)
    }
    fetchUsers()
  }, [profil])

  const toggleActif = async (user: Profil) => {
    setSaving(user.id)
    const supabase = createClient()
    await supabase.from('profils').update({ actif: !user.actif }).eq('id', user.id)
    setUsers((u) => u.map((x) => x.id === user.id ? { ...x, actif: !x.actif } : x))
    setSaving(null)
  }

  const changeRole = async (userId: string, role: Role) => {
    setSaving(userId)
    const supabase = createClient()
    await supabase.from('profils').update({ role }).eq('id', userId)
    setUsers((u) => u.map((x) => x.id === userId ? { ...x, role } : x))
    setSaving(null)
  }

  if (profil?.role !== 'direction') {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Accès réservé à la direction</p>
        </div>
      </div>
    )
  }

  if (loading) return <PageLoader />

  const actifs   = users.filter((u) => u.actif)
  const inactifs = users.filter((u) => !u.actif)

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="text-sm text-gray-500">{actifs.length} utilisateur{actifs.length !== 1 ? 's' : ''} actif{actifs.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          <p className="text-xs text-gray-400">Total</p>
        </div>
        <div className="card p-4 text-center border-green-200 bg-green-50">
          <p className="text-2xl font-bold text-green-600">{actifs.length}</p>
          <p className="text-xs text-gray-400">Actifs</p>
        </div>
        <div className="card p-4 text-center border-red-100 bg-red-50">
          <p className="text-2xl font-bold text-red-400">{inactifs.length}</p>
          <p className="text-xs text-gray-400">Inactifs</p>
        </div>
      </div>

      {/* Users list */}
      <div className="card overflow-hidden">
        <div className="card-header flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Utilisateurs</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {users.map((u) => (
            <div key={u.id} className={`px-4 py-3 flex items-center gap-3 flex-wrap ${!u.actif ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{u.prenom} {u.nom}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
                {u.telephone && <p className="text-xs text-gray-400">{u.telephone}</p>}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => changeRole(u.id, e.target.value as Role)}
                  disabled={saving === u.id}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                >
                  {(Object.keys(ROLE_CONFIG) as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
                <button
                  onClick={() => toggleActif(u)}
                  disabled={saving === u.id}
                  className={`p-1.5 rounded-lg transition-colors ${
                    u.actif
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-400 hover:bg-red-50'
                  }`}
                  title={u.actif ? 'Désactiver' : 'Activer'}
                >
                  {u.actif ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
