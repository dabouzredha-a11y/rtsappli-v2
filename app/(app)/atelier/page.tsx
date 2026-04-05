'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatusChange } from '@/components/dossiers/StatusChange'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Dossier, StatutDossier } from '@/lib/types'
import { TYPE_VEHICULE_CONFIG } from '@/lib/constants'
import { formatRelativeDate, getDaysOld } from '@/lib/utils'
import { Wrench, AlertTriangle, Clock, MessageCircle, Camera, ClipboardList, Filter } from 'lucide-react'

const ATELIER_STATUTS: StatutDossier[] = [
  'recu', 'a_diagnostiquer', 'diagnostique_termine', 'devis_valide',
  'pieces_recues', 'en_cours', 'bloque',
]

export default function AtelierPage() {
  const { profil } = useAuth()
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'mes_dossiers' | 'tous'>('tous')

  const fetchDossiers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('dossiers')
      .select('*')
      .in('statut', ATELIER_STATUTS)
      .order('urgence', { ascending: false })
      .order('created_at', { ascending: false })
    setDossiers(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchDossiers() }, [])

  if (loading) return <PageLoader />

  const shown = viewMode === 'mes_dossiers' && profil
    ? dossiers.filter((d) => (d as any).mecanicien_id === profil.id)
    : dossiers

  const byStatut = ATELIER_STATUTS.map((s) => ({
    statut: s,
    items: shown.filter((d) => d.statut === s),
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atelier</h1>
          <p className="text-sm text-gray-500">{shown.length} dossier{shown.length !== 1 ? 's' : ''} actif{shown.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {profil && (
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('tous')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'tous' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setViewMode('mes_dossiers')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  viewMode === 'mes_dossiers' ? 'bg-brand-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Mes dossiers
              </button>
            </div>
          )}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun dossier en atelier</p>
        </div>
      ) : (
        byStatut.map(({ statut, items }) => (
          <div key={statut} className="card overflow-hidden">
            <div className="card-header flex items-center gap-3">
              <StatusBadge statut={statut} size="md" />
              <span className="text-sm text-gray-500 font-medium">{items.length} dossier{items.length > 1 ? 's' : ''}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((d) => (
                <AtelierCard key={d.id} dossier={d} onRefresh={fetchDossiers} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AtelierCard({ dossier: d, onRefresh }: { dossier: Dossier; onRefresh: () => void }) {
  const days = getDaysOld(d.created_at)
  return (
    <div className="px-4 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5 shrink-0">{TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon}</span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/dossiers/${d.id}`} className="font-semibold text-gray-900 hover:text-brand-600 transition-colors">
                {d.client_nom}
              </Link>
              <span className="font-mono text-xs text-gray-400">{d.immatriculation}</span>
              {d.urgence && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                  <AlertTriangle className="w-3 h-3" />URGENT
                </span>
              )}
              {days > 7 && (
                <span className="flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  <Clock className="w-3 h-3" />{days}j
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{d.marque} {d.modele} · {formatRelativeDate(d.created_at)}</p>
            {d.description_panne && (
              <p className="text-sm text-gray-600 mt-1.5 line-clamp-2">{d.description_panne}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Link href={`/dossiers/${d.id}/diagnostic`} className="btn-ghost p-2" title="Diagnostic">
            <Wrench className="w-4 h-4" />
          </Link>
          <Link href={`/dossiers/${d.id}/photos`} className="btn-ghost p-2" title="Photos">
            <Camera className="w-4 h-4" />
          </Link>
          <Link href={`/dossiers/${d.id}/chat`} className="btn-ghost p-2" title="Messages">
            <MessageCircle className="w-4 h-4" />
          </Link>
          <StatusChange
            dossierId={d.id}
            statutActuel={d.statut}
            numero={d.numero}
            onUpdated={onRefresh}
          />
        </div>
      </div>
    </div>
  )
}
