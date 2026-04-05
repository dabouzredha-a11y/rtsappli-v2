'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { PieceDemandee } from '@/lib/types'
import { STATUT_PIECED } from '@/lib/constants'
import { formatRelativeDate } from '@/lib/utils'
import { Package, Bell, CheckCircle, Truck, Search, Filter } from 'lucide-react'

interface PieceWithDossier extends PieceDemandee {
  dossier_numero: string
  dossier_client: string
  dossier_id: string
}

export default function MagasinPage() {
  const [pieces, setPieces] = useState<PieceWithDossier[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('en_attente')
  const [search, setSearch] = useState('')

  const fetchPieces = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('pieces_demandees')
      .select(`
        *,
        dossiers!inner(numero, client_nom, id)
      `)
      .order('created_at', { ascending: false })

    const mapped = (data ?? []).map((p: any) => ({
      ...p,
      dossier_numero: p.dossiers?.numero ?? '—',
      dossier_client: p.dossiers?.client_nom ?? '—',
      dossier_id: p.dossiers?.id ?? p.dossier_id,
    }))
    setPieces(mapped)
    setLoading(false)
  }

  useEffect(() => { fetchPieces() }, [])

  const updateStatut = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('pieces_demandees').update({ statut }).eq('id', id)
    fetchPieces()
  }

  if (loading) return <PageLoader />

  const stats = {
    en_attente: pieces.filter((p) => p.statut === 'en_attente').length,
    commandee:  pieces.filter((p) => p.statut === 'commandee').length,
    recue:      pieces.filter((p) => p.statut === 'recue').length,
  }

  const filtered = pieces.filter((p) => {
    const matchesFilter = filter === 'tout' || p.statut === filter
    const matchesSearch = !search ||
      p.designation.toLowerCase().includes(search.toLowerCase()) ||
      p.dossier_numero.toLowerCase().includes(search.toLowerCase()) ||
      p.dossier_client.toLowerCase().includes(search.toLowerCase()) ||
      (p.reference_oem ?? '').toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Magasin</h1>
        <p className="text-sm text-gray-500">Gestion des pièces détachées</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-xs text-gray-500 mb-1">À commander</p>
          <p className="text-2xl font-bold text-amber-600">{stats.en_attente}</p>
        </div>
        <div className="card p-4 border-blue-200 bg-blue-50">
          <p className="text-xs text-gray-500 mb-1">Commandées</p>
          <p className="text-2xl font-bold text-blue-600">{stats.commandee}</p>
        </div>
        <div className="card p-4 border-green-200 bg-green-50">
          <p className="text-xs text-gray-500 mb-1">Reçues</p>
          <p className="text-2xl font-bold text-green-600">{stats.recue}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher pièce, dossier..."
            className="input pl-9"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="tout">Tous les statuts</option>
          {Object.entries(STATUT_PIECED).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Pieces list */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucune pièce trouvée</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wide">
            <span>Pièce</span>
            <span>Référence</span>
            <span>Fournisseur</span>
            <span>Dossier</span>
            <span>Statut</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.map((p) => {
              const sc = STATUT_PIECED[p.statut]
              return (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0 min-w-[150px]">
                    <p className="text-sm font-medium text-gray-900">{p.designation}</p>
                    <p className="text-xs text-gray-400">Qté: {p.quantite}{p.prix_achat ? ` · ${p.prix_achat.toFixed(2)} €` : ''}</p>
                  </div>
                  <p className="text-xs font-mono text-gray-500 min-w-[80px]">{p.reference_oem ?? '—'}</p>
                  <p className="text-xs text-gray-500 min-w-[80px]">{p.fournisseur ?? '—'}</p>
                  <Link href={`/dossiers/${p.dossier_id}`} className="min-w-[100px]">
                    <span className="text-xs font-mono text-brand-600 hover:underline block">{p.dossier_numero}</span>
                    <span className="text-xs text-gray-400">{p.dossier_client}</span>
                  </Link>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.statut}
                      onChange={(e) => updateStatut(p.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${sc?.bg} ${sc?.color}`}
                    >
                      {Object.entries(STATUT_PIECED).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
