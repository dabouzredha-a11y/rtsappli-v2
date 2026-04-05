'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatusChange } from '@/components/dossiers/StatusChange'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Dossier, StatutDossier } from '@/lib/types'
import { TYPE_VEHICULE_CONFIG, STATUT_CONFIG } from '@/lib/constants'
import { formatRelativeDate, getDaysOld } from '@/lib/utils'
import { FileText, Clock, CheckCircle, Receipt, Search, ExternalLink, Phone, Mail } from 'lucide-react'

const ADMIN_STATUTS: StatutDossier[] = [
  'diagnostique_termine', 'devis_a_envoyer', 'attente_validation_client',
  'devis_valide', 'termine_technique', 'a_facturer',
]

export default function AdministratifPage() {
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatutDossier | ''>('')
  const [search, setSearch] = useState('')

  const fetchDossiers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('dossiers')
      .select('*')
      .in('statut', ADMIN_STATUTS)
      .order('created_at', { ascending: false })
    setDossiers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDossiers() }, [])

  if (loading) return <PageLoader />

  const filtered = dossiers.filter((d) => {
    const matchesFilter = !filter || d.statut === filter
    const matchesSearch = !search ||
      d.client_nom.toLowerCase().includes(search.toLowerCase()) ||
      d.numero.toLowerCase().includes(search.toLowerCase()) ||
      d.immatriculation.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    devis_a_envoyer: dossiers.filter((d) => d.statut === 'devis_a_envoyer').length,
    attente_validation: dossiers.filter((d) => d.statut === 'attente_validation_client').length,
    a_facturer: dossiers.filter((d) => d.statut === 'a_facturer').length,
    total: dossiers.length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administratif</h1>
        <p className="text-sm text-gray-500">Devis, validations et facturation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 border-yellow-200 bg-yellow-50">
          <p className="text-xs text-gray-500 mb-1">Devis à envoyer</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.devis_a_envoyer}</p>
        </div>
        <div className="card p-4 border-amber-200 bg-amber-50">
          <p className="text-xs text-gray-500 mb-1">Attente validation</p>
          <p className="text-2xl font-bold text-amber-600">{stats.attente_validation}</p>
        </div>
        <div className="card p-4 border-pink-200 bg-pink-50">
          <p className="text-xs text-gray-500 mb-1">À facturer</p>
          <p className="text-2xl font-bold text-pink-600">{stats.a_facturer}</p>
        </div>
        <div className="card p-4 border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">Total en cours</p>
          <p className="text-2xl font-bold text-gray-600">{stats.total}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Client, numéro, immatriculation..."
            className="input pl-9"
          />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as StatutDossier | '')} className="input w-auto">
          <option value="">Tous les statuts</option>
          {ADMIN_STATUTS.map((s) => (
            <option key={s} value={s}>{STATUT_CONFIG[s].label}</option>
          ))}
        </select>
      </div>

      {/* Dossiers */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun dossier en cours de traitement administratif</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => {
            const days = getDaysOld(d.created_at)
            return (
              <div key={d.id} className="card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link href={`/dossiers/${d.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                          {d.client_nom}
                        </Link>
                        {d.societe && <span className="text-xs text-gray-400">— {d.societe}</span>}
                        <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{d.numero}</span>
                        {days > 7 && (
                          <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" />{days}j
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon} {d.immatriculation} · {d.marque} {d.modele}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {d.client_telephone && (
                          <a href={`tel:${d.client_telephone}`} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                            <Phone className="w-3 h-3" />{d.client_telephone}
                          </a>
                        )}
                        {d.client_email && (
                          <a href={`mailto:${d.client_email}`} className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
                            <Mail className="w-3 h-3" />{d.client_email}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <div className="text-right">
                      <StatusBadge statut={d.statut} size="md" />
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(d.created_at)}</p>
                    </div>
                    <Link href={`/dossiers/${d.id}`} className="btn-ghost p-2" title="Ouvrir le dossier">
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <StatusChange
                      dossierId={d.id}
                      statutActuel={d.statut}
                      numero={d.numero}
                      onUpdated={fetchDossiers}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
