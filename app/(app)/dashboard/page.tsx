'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { StatusChart } from '@/components/dashboard/StatusChart'
import { DossierAlerts } from '@/components/dashboard/DossierAlerts'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import type { Dossier, DashboardStats, StatutDossier } from '@/lib/types'
import { formatRelativeDate, getDaysOld } from '@/lib/utils'
import { TYPE_VEHICULE_CONFIG } from '@/lib/constants'
import { Plus, RefreshCw } from 'lucide-react'

const ACTIFS: StatutDossier[] = [
  'nouveau', 'recu', 'a_diagnostiquer', 'diagnostique_termine',
  'devis_a_envoyer', 'attente_validation_client', 'devis_valide',
  'attente_pieces', 'pieces_recues', 'en_cours', 'termine_technique', 'a_facturer', 'bloque',
]

export default function DashboardPage() {
  const { profil } = useAuth()
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchDossiers = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('dossiers')
      .select('*')
      .in('statut', ACTIFS)
      .order('created_at', { ascending: false })

    setDossiers(data ?? [])
    setLoading(false)
    setLastRefresh(new Date())
  }

  useEffect(() => {
    fetchDossiers()
    const interval = setInterval(fetchDossiers, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <PageLoader />

  const stats: DashboardStats = {
    urgents:       dossiers.filter((d) => d.urgence).length,
    en_cours:      dossiers.filter((d) => d.statut === 'en_cours').length,
    attente_pieces: dossiers.filter((d) => d.statut === 'attente_pieces').length,
    a_facturer:    dossiers.filter((d) => d.statut === 'a_facturer').length,
    plus_7j:       dossiers.filter((d) => getDaysOld(d.created_at) > 7).length,
    total_actifs:  dossiers.length,
  }

  const urgents = dossiers.filter((d) => d.urgence)
  const bloques = dossiers.filter((d) => d.statut === 'bloque')
  const vieux   = dossiers.filter((d) => getDaysOld(d.created_at) > 7 && d.statut !== 'bloque')

  const chartData = ACTIFS.map((s) => ({
    statut: s,
    count: dossiers.filter((d) => d.statut === s).length,
  }))

  const recent = dossiers.slice(0, 10)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bonjour {profil?.prenom} · Mis à jour {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDossiers}
            className="btn-secondary"
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link href="/dossiers/nouveau" className="btn-primary">
            <Plus className="w-4 h-4" />
            Nouveau dossier
          </Link>
        </div>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Alerts */}
      <DossierAlerts urgents={urgents} bloques={bloques} vieux={vieux} />

      {/* Chart + recent */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1">
          <StatusChart data={chartData} />
        </div>

        <div className="xl:col-span-2 card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Dossiers récents</h3>
            <Link href="/dossiers" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
              Voir tout →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucun dossier actif</div>
            ) : (
              recent.map((d) => (
                <Link
                  key={d.id}
                  href={`/dossiers/${d.id}`}
                  className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-lg shrink-0">
                    {TYPE_VEHICULE_CONFIG[d.type_vehicule]?.icon ?? '🚛'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 truncate">{d.client_nom}</span>
                      {d.urgence && (
                        <span className="shrink-0 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                          URGENT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">
                      {d.immatriculation} · {d.marque} {d.modele}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <StatusBadge statut={d.statut} size="sm" />
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeDate(d.created_at)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
