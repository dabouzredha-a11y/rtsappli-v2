'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { VoiceTextarea } from '@/components/ui/VoiceInput'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { FICHES_BY_TYPE } from '@/lib/constants'
import type { Dossier, Diagnostic, FicheControle } from '@/lib/types'
import { ArrowLeft, Save, ClipboardList, Wrench } from 'lucide-react'

interface Props { params: Promise<{ id: string }> }

type ControleValue = 'ok' | 'attention' | 'ko' | 'na'

const RESULT_OPTS: { value: ControleValue; label: string; color: string }[] = [
  { value: 'ok',        label: 'OK',       color: 'bg-green-100 text-green-700 border-green-300' },
  { value: 'attention', label: 'ATTN',     color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { value: 'ko',        label: 'KO',       color: 'bg-red-100 text-red-700 border-red-300' },
  { value: 'na',        label: 'N/A',      color: 'bg-gray-100 text-gray-400 border-gray-200' },
]

export default function DiagnosticPage({ params }: Props) {
  const { id } = use(params)
  const { profil } = useAuth()
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'diagnostic' | 'controle'>('diagnostic')

  const [diag, setDiag] = useState<Omit<Diagnostic, 'id' | 'dossier_id'>>({
    symptomes: '',
    controles: '',
    hypotheses: '',
    travaux: '',
    temps_estime: null,
  })
  const [diagId, setDiagId] = useState<string | null>(null)

  const [resultats, setResultats] = useState<Record<string, ControleValue>>({})
  const [observations, setObservations] = useState('')
  const [piecesRemplacer, setPiecesRemplacer] = useState('')
  const [tempsControle, setTempsControle] = useState('')
  const [ficheId, setFicheId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const supabase = createClient()
      const [{ data: d }, { data: diag }, { data: fc }] = await Promise.all([
        supabase.from('dossiers').select('*').eq('id', id).single(),
        supabase.from('diagnostics').select('*').eq('dossier_id', id).single(),
        supabase.from('fiches_controle').select('*').eq('dossier_id', id).single(),
      ])
      setDossier(d)
      if (diag) {
        setDiagId(diag.id)
        setDiag({
          symptomes:    diag.symptomes ?? '',
          controles:    diag.controles ?? '',
          hypotheses:   diag.hypotheses ?? '',
          travaux:      diag.travaux ?? '',
          temps_estime: diag.temps_estime,
        })
      }
      if (fc) {
        setFicheId(fc.id)
        setResultats(fc.resultats ?? {})
        setObservations(fc.observations ?? '')
        setPiecesRemplacer(fc.pieces_a_remplacer ?? '')
        setTempsControle(fc.temps_controle?.toString() ?? '')
      }
      setLoading(false)
    }
    init()
  }, [id])

  const saveDiagnostic = async () => {
    if (!profil) return
    setSaving(true)
    const supabase = createClient()

    if (diagId) {
      await supabase.from('diagnostics').update({ ...diag }).eq('id', diagId)
    } else {
      const { data } = await supabase.from('diagnostics').insert({ dossier_id: id, ...diag }).select('id').single()
      if (data) setDiagId(data.id)
    }

    await supabase.from('historique_actions').insert({
      dossier_id: id,
      action: 'diagnostic_mis_a_jour',
      auteur: `${profil.prenom} ${profil.nom}`,
      commentaire: null,
    })
    setSaving(false)
  }

  const saveFicheControle = async () => {
    if (!dossier || !profil) return
    setSaving(true)
    const supabase = createClient()

    const payload = {
      dossier_id: id,
      type_vehicule: dossier.type_vehicule,
      resultats,
      observations: observations || null,
      pieces_a_remplacer: piecesRemplacer || null,
      temps_controle: tempsControle ? parseFloat(tempsControle) : null,
      statut: 'en_cours',
    }

    if (ficheId) {
      await supabase.from('fiches_controle').update(payload).eq('id', ficheId)
    } else {
      const { data } = await supabase.from('fiches_controle').insert(payload).select('id').single()
      if (data) setFicheId(data.id)
    }

    setSaving(false)
  }

  const toggleResult = (item: string, current: ControleValue | undefined) => {
    const order: ControleValue[] = ['ok', 'attention', 'ko', 'na']
    const next = order[(order.indexOf(current ?? 'na') + 1) % order.length]
    setResultats((r) => ({ ...r, [item]: next }))
  }

  if (loading) return <PageLoader />
  if (!dossier) return <div className="p-8 text-center text-gray-400">Dossier introuvable</div>

  const ficheItems = FICHES_BY_TYPE[dossier.type_vehicule] ?? []

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/dossiers/${id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <p className="text-xs text-gray-400 font-mono">{dossier.numero}</p>
          <h1 className="text-xl font-bold text-gray-900">Diagnostic — {dossier.client_nom}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('diagnostic')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'diagnostic' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Wrench className="w-4 h-4" />
          Diagnostic
        </button>
        <button
          onClick={() => setActiveTab('controle')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
            activeTab === 'controle' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Fiche de contrôle
        </button>
      </div>

      {activeTab === 'diagnostic' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Fiche de diagnostic</h3>
          </div>
          <div className="card-body space-y-4">
            <VoiceTextarea
              label="Symptômes constatés"
              value={diag.symptomes}
              onChange={(v) => setDiag({ ...diag, symptomes: v })}
              placeholder="Décrivez les symptômes observés..."
              rows={3}
            />
            <VoiceTextarea
              label="Contrôles effectués"
              value={diag.controles}
              onChange={(v) => setDiag({ ...diag, controles: v })}
              placeholder="Quels contrôles ont été réalisés..."
              rows={3}
            />
            <VoiceTextarea
              label="Hypothèses de panne"
              value={diag.hypotheses}
              onChange={(v) => setDiag({ ...diag, hypotheses: v })}
              placeholder="Causes probables identifiées..."
              rows={3}
            />
            <VoiceTextarea
              label="Travaux à effectuer"
              value={diag.travaux}
              onChange={(v) => setDiag({ ...diag, travaux: v })}
              placeholder="Travaux recommandés..."
              rows={4}
            />
            <div>
              <label className="label">Temps estimé (heures)</label>
              <input
                type="number"
                value={diag.temps_estime ?? ''}
                onChange={(e) => setDiag({ ...diag, temps_estime: e.target.value ? parseFloat(e.target.value) : null })}
                className="input w-32"
                placeholder="Ex: 4.5"
                step="0.5"
                min="0"
              />
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={saveDiagnostic} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'controle' && (
        <div className="space-y-4">
          <div className="card">
            <div className="card-header">
              <p className="text-xs text-gray-400 mb-1">
                Appuyez sur chaque élément pour faire défiler : OK → ATTN → KO → N/A
              </p>
              <h3 className="font-semibold text-gray-900">
                Fiche de contrôle — {dossier.type_vehicule.replace('_', ' ')}
              </h3>
            </div>
            <div className="card-body space-y-6">
              {ficheItems.map((section) => (
                <div key={section.section}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{section.section}</h4>
                  <div className="space-y-2">
                    {section.items.map((item) => {
                      const val = resultats[item]
                      const opt = RESULT_OPTS.find((o) => o.value === val)
                      return (
                        <div key={item} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-700">{item}</span>
                          <button
                            type="button"
                            onClick={() => toggleResult(item, val)}
                            className={`min-w-14 text-center text-xs font-bold py-1 px-2 rounded-lg border transition-all ${
                              opt ? opt.color : 'bg-gray-50 text-gray-300 border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            {opt?.label ?? '—'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body space-y-4">
              <VoiceTextarea
                label="Observations générales"
                value={observations}
                onChange={setObservations}
                placeholder="Observations, remarques..."
                rows={3}
              />
              <VoiceTextarea
                label="Pièces à remplacer"
                value={piecesRemplacer}
                onChange={setPiecesRemplacer}
                placeholder="Liste des pièces à remplacer..."
                rows={3}
              />
              <div>
                <label className="label">Temps de contrôle (h)</label>
                <input
                  type="number"
                  value={tempsControle}
                  onChange={(e) => setTempsControle(e.target.value)}
                  className="input w-28"
                  placeholder="1.5"
                  step="0.5"
                  min="0"
                />
              </div>
              <div className="flex justify-end">
                <button onClick={saveFicheControle} disabled={saving} className="btn-primary">
                  <Save className="w-4 h-4" />
                  {saving ? 'Sauvegarde...' : 'Sauvegarder la fiche'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
