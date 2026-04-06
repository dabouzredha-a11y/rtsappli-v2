'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { generateNumero } from '@/lib/utils'
import { VoiceTextarea } from '@/components/ui/VoiceInput'
import { Save, Send, AlertTriangle } from 'lucide-react'
import type { TypeVehicule } from '@/lib/types'
import { TYPE_VEHICULE_CONFIG } from '@/lib/constants'

const N8N_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL

export function DossierForm() {
  const router = useRouter()
  const { profil } = useAuth()
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [form, setForm] = useState({
    client_nom: '',
    client_telephone: '',
    client_email: '',
    societe: '',
    immatriculation: '',
    vin: '',
    marque: '',
    modele: '',
    type_vehicule: 'tracteur' as TypeVehicule,
    kilometrage: '',
    description_panne: '',
    urgence: false,
    date_ct: '',
    date_tachygraphe: '',
    date_limiteur: '',
  })

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profil) {
      setSubmitError('Vous devez être connecté pour créer un dossier.')
      return
    }
    setLoading(true)
    setSubmitError(null)

    try {
      const supabase = createClient()
      const numero = generateNumero()
      const now = new Date().toISOString()

      const payload = {
        ...form,
        numero,
        // Sanitize optional string fields — empty string → null
        client_email:      form.client_email      || null,
        societe:           form.societe           || null,
        vin:               form.vin               || null,
        kilometrage:       form.kilometrage ? parseInt(form.kilometrage) : null,
        date_ct:           form.date_ct           || null,
        date_tachygraphe:  form.date_tachygraphe  || null,
        date_limiteur:     form.date_limiteur     || null,
        statut: 'nouveau',
        created_at: now,
        updated_at: now,
      }

      const { data, error } = await supabase
        .from('dossiers')
        .insert(payload)
        .select('id')
        .single()

      if (error || !data) {
        setSubmitError(
          error?.message
            ? `Erreur Supabase : ${error.message}`
            : 'Erreur inconnue lors de la création du dossier.'
        )
        return
      }

      // Log history
      await supabase.from('historique_actions').insert({
        dossier_id: data.id,
        action: 'creation',
        ancien_statut: null,
        nouveau_statut: 'nouveau',
        auteur: `${profil.prenom} ${profil.nom}`,
        commentaire: 'Dossier créé',
      })

      // Notify n8n (non-bloquant — échec ignoré)
      if (N8N_URL) {
        fetch(N8N_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: data.id }),
        }).catch((err) => console.warn('[DossierForm] webhook n8n failed:', err))
      }

      router.push('/dossiers')
    } catch (err) {
      console.error('[DossierForm] handleSubmit error:', err)
      setSubmitError('Une erreur inattendue est survenue. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Urgence banner */}
      <div
        onClick={() => set('urgence', !form.urgence)}
        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          form.urgence
            ? 'border-red-400 bg-red-50'
            : 'border-dashed border-gray-300 hover:border-red-300'
        }`}
      >
        <AlertTriangle className={`w-5 h-5 ${form.urgence ? 'text-red-600' : 'text-gray-400'}`} />
        <div>
          <p className={`text-sm font-semibold ${form.urgence ? 'text-red-700' : 'text-gray-500'}`}>
            {form.urgence ? 'DOSSIER URGENT' : 'Marquer comme urgent'}
          </p>
          <p className="text-xs text-gray-400">Cliquez pour activer / désactiver</p>
        </div>
      </div>

      {/* Client */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Informations client</h3>
        </div>
        <div className="card-body grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Nom client <span className="text-red-500">*</span></label>
            <input required value={form.client_nom} onChange={(e) => set('client_nom', e.target.value)}
              className="input" placeholder="Dupont Jean" />
          </div>
          <div>
            <label className="label">Téléphone <span className="text-red-500">*</span></label>
            <input required value={form.client_telephone} onChange={(e) => set('client_telephone', e.target.value)}
              className="input" placeholder="06 00 00 00 00" />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" value={form.client_email} onChange={(e) => set('client_email', e.target.value)}
              className="input" placeholder="contact@société.fr" />
          </div>
          <div>
            <label className="label">Société</label>
            <input value={form.societe} onChange={(e) => set('societe', e.target.value)}
              className="input" placeholder="Transport Dupont SARL" />
          </div>
        </div>
      </div>

      {/* Véhicule */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Véhicule</h3>
        </div>
        <div className="card-body space-y-4">
          {/* Type vehicule */}
          <div>
            <label className="label">Type de véhicule <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.entries(TYPE_VEHICULE_CONFIG) as [TypeVehicule, { label: string; icon: string }][]).map(([key, cfg]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => set('type_vehicule', key)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                    form.type_vehicule === key
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">Immatriculation <span className="text-red-500">*</span></label>
              <input required value={form.immatriculation} onChange={(e) => set('immatriculation', e.target.value.toUpperCase())}
                className="input font-mono uppercase" placeholder="AA-123-AA" />
            </div>
            <div>
              <label className="label">Marque <span className="text-red-500">*</span></label>
              <input required value={form.marque} onChange={(e) => set('marque', e.target.value)}
                className="input" placeholder="Volvo, Scania, Mercedes..." />
            </div>
            <div>
              <label className="label">Modèle <span className="text-red-500">*</span></label>
              <input required value={form.modele} onChange={(e) => set('modele', e.target.value)}
                className="input" placeholder="FH 460, R 450..." />
            </div>
            <div>
              <label className="label">VIN</label>
              <input value={form.vin} onChange={(e) => set('vin', e.target.value.toUpperCase())}
                className="input font-mono uppercase" placeholder="VF1AG..." />
            </div>
            <div>
              <label className="label">Kilométrage</label>
              <input type="number" value={form.kilometrage} onChange={(e) => set('kilometrage', e.target.value)}
                className="input" placeholder="450000" />
            </div>
          </div>

          {/* Dates réglementaires */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="label">Date CT</label>
              <input type="date" value={form.date_ct} onChange={(e) => set('date_ct', e.target.value)}
                className="input" />
            </div>
            <div>
              <label className="label">Date tachygraphe</label>
              <input type="date" value={form.date_tachygraphe} onChange={(e) => set('date_tachygraphe', e.target.value)}
                className="input" />
            </div>
            <div>
              <label className="label">Date limiteur</label>
              <input type="date" value={form.date_limiteur} onChange={(e) => set('date_limiteur', e.target.value)}
                className="input" />
            </div>
          </div>
        </div>
      </div>

      {/* Panne */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold text-gray-900">Description de la panne</h3>
        </div>
        <div className="card-body">
          <VoiceTextarea
            value={form.description_panne}
            onChange={(v) => set('description_panne', v)}
            placeholder="Décrivez le problème signalé par le client..."
            rows={4}
            required
          />
        </div>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()} className="btn-secondary">
          Annuler
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          <Save className="w-4 h-4" />
          {loading ? 'Création...' : 'Créer le dossier'}
        </button>
      </div>
    </form>
  )
}
