'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Dossier, StatutDossier } from '@/lib/types'
import { STATUT_CONFIG, TYPE_VEHICULE_CONFIG } from '@/lib/constants'
import { formatRelativeDate, getDaysOld } from '@/lib/utils'
import { Plus, Search, Filter, AlertTriangle, X } from 'lucide-react'

const ALL_STATUTS: StatutDossier[] = [
  'nouveau', 'recu', 'a_diagnostiquer', 'diagnostique_termine',
  'devis_a_envoyer', 'attente_validation_client', 'devis_valide',
  'attente_pieces', 'pieces_recues', 'en_cours', 'termine_technique',
  'a_facturer', 'cloture', 'bloque',
]

export default function DossiersPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [filtered, setFiltered] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statutFilter, setStatutFilter] = useState<StatutDossier | ''>('')
  const [urgentOnly, setUrgentOnly] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('dossiers')
        .select('*')
        .order('created_at', { ascending: false })
      setDossiers(data ?? [])
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let result = [...dossiers]
    if (search) {
      const s = search.toLowerCase()
      result = result.filter(
        (d) =>
          d.client_nom.toLowerCase().includes(s) ||
          d.immatriculation.toLowerCase().includes(s) ||
          d.numero.toLowerCase().includes(s) ||
          d.marque.toLowerCase().includes(s) ||
          (d.societe ?? '').toLowerCase().includes(s),
      )
    }
    if (statutFilter) result = result.filter((d) => d.statut === statutFilter)
    if (urgentOnly) result = result.filter((d) => d.urgence)
    setFiltered(result)
  }, [dossiers, search, statutFilter, urgentOnly])

  if (loading) return <PageLoader />

  const hasFilters = search || statutFilter || urgentOnly

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dossiers</h1>
          <p className="text-sm text-gray-500">{filtered.length} dossier{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dossiers/nouveau" className="btn-primary">
          <Plus className="w-4 h-4" />
          Nouveau
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher client, immat, numéro..."
              className="input pl-9"
            />
          </div>

          {/* Statut */}
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value as StatutDossier | '')}
            className="input w-auto min-w-40"
          >
            <option value="">Tous les statuts</option>
            {ALL_STATUTS.map((s) => (
              <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
            ))}
          </select>

          {/* Urgent toggle */}
          <button
            onClick={() => setUrgentOnly(!urgentOnly)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              urgentOnly
                ? 'bg-red-100 border-red-300 text-red-700'
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Urgents
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setStatutFilter(''); setUrgentOnly(false) }}
              className="btn-ghost"
            >
              <X className="w-4 h-4" />
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-lg mb-1">Aucun dossier trouvé</p>
            <p className="text-sm">Modifiez vos filtres ou créez un nouveau dossier</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Numéro</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Client</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Véhicule</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Statut</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Créé</th>
                    <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-3">Âge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((d) => {
                    const days = getDaysOld(d.created_at)
                    return (
                      <tr
                        key={d.id}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/dossiers/${d.id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-brand-600 font-medium">{d.numero}</span>
                            {d.urgence && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">URGENT</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{d.client_nom}</p>
                          {d.societe && <p className="text-xs text-gray-400">{d.societe}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span>{TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon}</span>
                            <div>
                              <p className="text-sm text-gray-800 font-mono font-medium">{d.immatriculation}</p>
                              <p className="text-xs text-gray-400">{d.marque} {d.modele}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge statut={d.statut} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {formatRelativeDate(d.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${days > 7 ? 'text-red-600' : days > 3 ? 'text-amber-600' : 'text-gray-400'}`}>
                            {days}j
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-gray-100">
              {filtered.map((d) => (
                <Link key={d.id} href={`/dossiers/${d.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50">
                  <span className="text-2xl shrink-0">{TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{d.client_nom}</span>
                      {d.urgence && <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">URGENT</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{d.immatriculation} · {d.numero}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge statut={d.statut} size="sm" />
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(d.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
