'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { StatusChange } from '@/components/dossiers/StatusChange'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import type { Dossier, Diagnostic, PieceDemandee, HistoriqueAction, FicheControle, Profil } from '@/lib/types'
import { TYPE_VEHICULE_CONFIG, STATUT_PIECED } from '@/lib/constants'
import { formatDate, formatDateTime, formatRelativeDate } from '@/lib/utils'
import {
  ArrowLeft, Wrench, Package, MessageCircle, Camera, FileText,
  AlertTriangle, Phone, Mail, Building, Calendar, Gauge, Hash,
  UserCheck, ClipboardList,
} from 'lucide-react'

interface Props { params: { id: string } }

export default function DossierDetailPage({ params }: Props) {
  const { id } = params
  const [dossier, setDossier] = useState<Dossier | null>(null)
  const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null)
  const [pieces, setPieces] = useState<PieceDemandee[]>([])
  const [historique, setHistorique] = useState<HistoriqueAction[]>([])
  const [ficheControle, setFicheControle] = useState<FicheControle | null>(null)
  const [mecaniciens, setMecaniciens] = useState<Profil[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'apercu' | 'pieces' | 'historique' | 'controle'>('apercu')

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      // Fetch dossier first — required to render anything
      const { data: d, error: dossierErr } = await supabase
        .from('dossiers')
        .select('*')
        .eq('id', id)
        .single()

      if (dossierErr || !d) {
        setError(dossierErr?.message ?? 'Dossier introuvable')
        return
      }

      setDossier(d)

      // Secondary data — use maybeSingle() so missing rows return null instead of error
      const [
        { data: diag },
        { data: p },
        { data: hist },
        { data: fc },
        { data: mecas },
      ] = await Promise.all([
        supabase.from('diagnostics').select('*').eq('dossier_id', id).maybeSingle(),
        supabase.from('pieces_demandes').select('*').eq('dossier_id', id).order('created_at', { ascending: false }),
        supabase.from('historique_actions').select('*').eq('dossier_id', id).order('created_at', { ascending: false }),
        supabase.from('fiches_controle').select('*').eq('dossier_id', id).maybeSingle(),
        supabase.from('profils').select('*').in('role', ['mecanicien', 'chef_atelier']).eq('actif', true),
      ])

      setDiagnostic(diag)
      setPieces(p ?? [])
      setHistorique(hist ?? [])
      setFicheControle(fc)
      setMecaniciens(mecas ?? [])
    } catch (err) {
      console.error('[DossierDetail] fetchAll error:', err)
      setError('Erreur de connexion. Vérifiez votre réseau et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [id])

  if (loading) return <PageLoader />

  if (error || !dossier) {
    return (
      <div className="max-w-5xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dossiers" className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="text-sm text-gray-500">Retour aux dossiers</span>
        </div>
        <div className="card p-10 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium mb-1">
            {error ?? 'Dossier introuvable'}
          </p>
          <p className="text-sm text-gray-400 mb-4">ID : {id}</p>
          <button onClick={fetchAll} className="btn-primary text-sm">
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  const vehiculeConfig = TYPE_VEHICULE_CONFIG[dossier.type_vehicule]

  const TABS = [
    { id: 'apercu',    label: 'Aperçu',      icon: FileText },
    { id: 'pieces',    label: `Pièces (${pieces.length})`,  icon: Package },
    { id: 'historique',label: 'Historique',   icon: ClipboardList },
    { id: 'controle',  label: 'Contrôle',     icon: ClipboardList },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/dossiers" className="btn-ghost p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-brand-600 font-medium">{dossier.numero}</span>
              {dossier.urgence && (
                <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                  <AlertTriangle className="w-3 h-3" /> URGENT
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{dossier.client_nom}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge statut={dossier.statut} size="lg" />
          <StatusChange
            dossierId={dossier.id}
            statutActuel={dossier.statut}
            numero={dossier.numero}
            onUpdated={fetchAll}
          />
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href={`/dossiers/${id}/diagnostic`} className="card p-3 flex items-center gap-2 hover:border-brand-300 hover:shadow-sm transition-all group">
          <div className="p-2 bg-brand-50 rounded-lg group-hover:bg-brand-100 transition-colors">
            <Wrench className="w-4 h-4 text-brand-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Diagnostic</span>
        </Link>
        <Link href={`/dossiers/${id}/chat`} className="card p-3 flex items-center gap-2 hover:border-brand-300 hover:shadow-sm transition-all group">
          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
            <MessageCircle className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Messages</span>
        </Link>
        <Link href={`/dossiers/${id}/photos`} className="card p-3 flex items-center gap-2 hover:border-brand-300 hover:shadow-sm transition-all group">
          <div className="p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
            <Camera className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Photos</span>
        </Link>
        <button
          onClick={() => setActiveTab('pieces')}
          className="card p-3 flex items-center gap-2 hover:border-brand-300 hover:shadow-sm transition-all group text-left"
        >
          <div className="p-2 bg-amber-50 rounded-lg group-hover:bg-amber-100 transition-colors">
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">Pièces ({pieces.length})</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'apercu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Client */}
          <div className="card">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Client</h3>
            </div>
            <div className="card-body space-y-3">
              <InfoRow icon={UserCheck} label="Nom" value={dossier.client_nom} />
              {dossier.societe && <InfoRow icon={Building} label="Société" value={dossier.societe} />}
              <InfoRow icon={Phone} label="Téléphone">
                <a href={`tel:${dossier.client_telephone}`} className="text-brand-600 hover:underline text-sm font-medium">
                  {dossier.client_telephone}
                </a>
              </InfoRow>
              {dossier.client_email && (
                <InfoRow icon={Mail} label="Email">
                  <a href={`mailto:${dossier.client_email}`} className="text-brand-600 hover:underline text-sm">
                    {dossier.client_email}
                  </a>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Véhicule */}
          <div className="card">
            <div className="card-header flex items-center gap-2">
              <span className="text-xl">{vehiculeConfig?.icon}</span>
              <h3 className="font-semibold text-gray-900">Véhicule</h3>
            </div>
            <div className="card-body space-y-3">
              <InfoRow icon={Hash} label="Immatriculation">
                <span className="font-mono font-bold text-gray-900">{dossier.immatriculation}</span>
              </InfoRow>
              <InfoRow icon={Wrench} label="Marque / Modèle" value={`${dossier.marque} ${dossier.modele}`} />
              {dossier.vin && <InfoRow icon={Hash} label="VIN">
                <span className="font-mono text-xs text-gray-600">{dossier.vin}</span>
              </InfoRow>}
              {dossier.kilometrage && <InfoRow icon={Gauge} label="Kilométrage" value={`${dossier.kilometrage.toLocaleString('fr-FR')} km`} />}
            </div>
          </div>

          {/* Dates réglementaires */}
          {(dossier.date_ct || dossier.date_tachygraphe || dossier.date_limiteur) && (
            <div className="card">
              <div className="card-header">
                <h3 className="font-semibold text-gray-900">Dates réglementaires</h3>
              </div>
              <div className="card-body space-y-3">
                {dossier.date_ct && <InfoRow icon={Calendar} label="Contrôle technique" value={formatDate(dossier.date_ct)} />}
                {dossier.date_tachygraphe && <InfoRow icon={Calendar} label="Tachygraphe" value={formatDate(dossier.date_tachygraphe)} />}
                {dossier.date_limiteur && <InfoRow icon={Calendar} label="Limiteur vitesse" value={formatDate(dossier.date_limiteur)} />}
              </div>
            </div>
          )}

          {/* Description panne */}
          <div className="card lg:col-span-2">
            <div className="card-header">
              <h3 className="font-semibold text-gray-900">Description de la panne</h3>
            </div>
            <div className="card-body">
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{dossier.description_panne}</p>
            </div>
          </div>

          {/* Diagnostic summary */}
          {diagnostic && (
            <div className="card lg:col-span-2">
              <div className="card-header flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Diagnostic</h3>
                <Link href={`/dossiers/${id}/diagnostic`} className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                  Modifier →
                </Link>
              </div>
              <div className="card-body grid sm:grid-cols-2 gap-4">
                {diagnostic.symptomes && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Symptômes</p>
                    <p className="text-sm text-gray-700">{diagnostic.symptomes}</p>
                  </div>
                )}
                {diagnostic.travaux && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Travaux</p>
                    <p className="text-sm text-gray-700">{diagnostic.travaux}</p>
                  </div>
                )}
                {diagnostic.temps_estime && (
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Temps estimé</p>
                    <p className="text-sm text-gray-700">{diagnostic.temps_estime}h</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pieces' && (
        <PiecesTab dossierId={id} pieces={pieces} onRefresh={fetchAll} />
      )}

      {activeTab === 'historique' && (
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900">Historique des actions</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {historique.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Aucune action enregistrée</div>
            ) : (
              historique.map((h) => (
                <div key={h.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{h.auteur}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{h.action.replace(/_/g, ' ')}</p>
                      {(h.ancien_statut || h.nouveau_statut) && (
                        <div className="flex items-center gap-2 mt-1.5">
                          {h.ancien_statut && <StatusBadge statut={h.ancien_statut} size="sm" />}
                          {h.ancien_statut && h.nouveau_statut && <span className="text-gray-300">→</span>}
                          {h.nouveau_statut && <StatusBadge statut={h.nouveau_statut} size="sm" />}
                        </div>
                      )}
                      {h.commentaire && (
                        <p className="text-xs text-gray-500 italic mt-1">"{h.commentaire}"</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0">{formatRelativeDate(h.created_at ?? '')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'controle' && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Fiche de contrôle</h3>
            <Link href={`/dossiers/${id}/diagnostic`} className="btn-secondary text-xs">
              Éditer →
            </Link>
          </div>
          <div className="card-body">
            {!ficheControle ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-3">Aucune fiche de contrôle pour ce dossier</p>
                <Link href={`/dossiers/${id}/diagnostic`} className="btn-primary text-sm">
                  Créer la fiche de contrôle
                </Link>
              </div>
            ) : (
              <FicheControleDisplay fiche={ficheControle} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({
  icon: Icon, label, value, children,
}: {
  icon: React.ElementType
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-400 leading-none mb-0.5">{label}</p>
        {children ?? <p className="text-sm font-medium text-gray-800">{value}</p>}
      </div>
    </div>
  )
}

function PiecesTab({ dossierId, pieces, onRefresh }: { dossierId: string; pieces: PieceDemandee[]; onRefresh: () => void }) {
  const [form, setForm] = useState({ designation: '', reference_oem: '', fournisseur: '', quantite: '1', prix_achat: '' })
  const [adding, setAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('pieces_demandes').insert({
      dossier_id: dossierId,
      designation: form.designation,
      reference_oem: form.reference_oem || null,
      fournisseur: form.fournisseur || null,
      quantite: parseInt(form.quantite) || 1,
      prix_achat: form.prix_achat ? parseFloat(form.prix_achat) : null,
      statut: 'en_attente',
    })
    setForm({ designation: '', reference_oem: '', fournisseur: '', quantite: '1', prix_achat: '' })
    setAdding(false)
    setLoading(false)
    onRefresh()
  }

  const updateStatut = async (pieceId: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('pieces_demandes').update({ statut }).eq('id', pieceId)
    onRefresh()
  }

  return (
    <div className="card">
      <div className="card-header flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Pièces demandées</h3>
        <button onClick={() => setAdding(!adding)} className="btn-primary text-xs">
          + Ajouter
        </button>
      </div>
      {adding && (
        <form onSubmit={handleAdd} className="p-4 border-b border-gray-100 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div className="col-span-2">
              <input required value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="input" placeholder="Désignation *" />
            </div>
            <input value={form.reference_oem} onChange={(e) => setForm({ ...form, reference_oem: e.target.value })}
              className="input" placeholder="Réf. OEM" />
            <input value={form.fournisseur} onChange={(e) => setForm({ ...form, fournisseur: e.target.value })}
              className="input" placeholder="Fournisseur" />
            <input type="number" value={form.quantite} onChange={(e) => setForm({ ...form, quantite: e.target.value })}
              className="input" placeholder="Qté" min="1" />
            <input type="number" value={form.prix_achat} onChange={(e) => setForm({ ...form, prix_achat: e.target.value })}
              className="input" placeholder="Prix HT (€)" step="0.01" />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAdding(false)} className="btn-secondary text-xs">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary text-xs">{loading ? 'Ajout...' : 'Ajouter'}</button>
          </div>
        </form>
      )}
      <div className="divide-y divide-gray-50">
        {pieces.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Aucune pièce demandée</div>
        ) : (
          pieces.map((p) => {
            const sc = STATUT_PIECED[p.statut]
            return (
              <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{p.designation}</p>
                  <p className="text-xs text-gray-400">
                    {p.reference_oem && `Réf: ${p.reference_oem} · `}
                    {p.fournisseur && `${p.fournisseur} · `}
                    Qté: {p.quantite}
                    {p.prix_achat && ` · ${p.prix_achat.toFixed(2)} €`}
                  </p>
                </div>
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
            )
          })
        )}
      </div>
    </div>
  )
}

function FicheControleDisplay({ fiche }: { fiche: FicheControle }) {
  const resultats = fiche.resultats ?? {}
  const COLORS = {
    ok:        'bg-green-100 text-green-700',
    attention: 'bg-amber-100 text-amber-700',
    ko:        'bg-red-100 text-red-700',
    na:        'bg-gray-100 text-gray-400',
  }

  return (
    <div className="space-y-4">
      {Object.entries(resultats).map(([item, val]) => (
        <div key={item} className="flex items-center justify-between py-1">
          <span className="text-sm text-gray-700">{item}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COLORS[val as keyof typeof COLORS] ?? 'bg-gray-100 text-gray-400'}`}>
            {val?.toUpperCase() ?? 'N/A'}
          </span>
        </div>
      ))}
      {fiche.observations && (
        <div className="pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Observations</p>
          <p className="text-sm text-gray-700">{fiche.observations}</p>
        </div>
      )}
    </div>
  )
}
