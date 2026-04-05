'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { STATUT_CONFIG, STATUT_TRANSITIONS } from '@/lib/constants'
import type { StatutDossier } from '@/lib/types'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Props {
  dossierId: string
  statutActuel: StatutDossier
  numero: string
  onUpdated: () => void
}

export function StatusChange({ dossierId, statutActuel, numero, onUpdated }: Props) {
  const [open, setOpen] = useState(false)
  const [commentaire, setCommentaire] = useState('')
  const [selectedStatut, setSelectedStatut] = useState<StatutDossier | null>(null)
  const [loading, setLoading] = useState(false)
  const { profil } = useAuth()

  const transitions = STATUT_TRANSITIONS[statutActuel] ?? []

  const handleChange = async () => {
    if (!selectedStatut || !profil) return
    setLoading(true)

    const supabase = createClient()
    const now = new Date().toISOString()

    await supabase
      .from('dossiers')
      .update({ statut: selectedStatut, updated_at: now })
      .eq('id', dossierId)

    await supabase.from('historique_actions').insert({
      dossier_id: dossierId,
      action: 'changement_statut',
      ancien_statut: statutActuel,
      nouveau_statut: selectedStatut,
      auteur: `${profil.prenom} ${profil.nom}`,
      commentaire: commentaire || null,
    })

    // Système message
    await supabase.from('messages_dossier').insert({
      dossier_id: dossierId,
      auteur_id: profil.id,
      auteur_nom: `${profil.prenom} ${profil.nom}`,
      auteur_role: profil.role,
      contenu: `Statut changé : ${STATUT_CONFIG[statutActuel].label} → ${STATUT_CONFIG[selectedStatut].label}${commentaire ? ` — ${commentaire}` : ''}`,
      type: 'system',
    })

    setLoading(false)
    setOpen(false)
    setCommentaire('')
    setSelectedStatut(null)
    onUpdated()
  }

  if (transitions.length === 0) return null

  const currentConfig = STATUT_CONFIG[statutActuel]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
      >
        Changer le statut
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
          <div className="p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Changer le statut du dossier <span className="font-mono text-xs text-brand-600">{numero}</span>
            </p>

            <div className="space-y-2 mb-3">
              {transitions.map((s) => {
                const config = STATUT_CONFIG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedStatut(s)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                      selectedStatut === s
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                  </button>
                )
              })}
            </div>

            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Commentaire (optionnel)"
              rows={2}
              className="input resize-none text-sm mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleChange}
                disabled={!selectedStatut || loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Mise à jour...' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
