export type Role = 'direction' | 'chef_atelier' | 'mecanicien' | 'administratif' | 'reception' | 'magasin'

export type StatutDossier =
  | 'nouveau'
  | 'recu'
  | 'a_diagnostiquer'
  | 'diagnostique_termine'
  | 'devis_a_envoyer'
  | 'attente_validation_client'
  | 'devis_valide'
  | 'attente_pieces'
  | 'pieces_recues'
  | 'en_cours'
  | 'termine_technique'
  | 'a_facturer'
  | 'cloture'
  | 'bloque'

export type TypeVehicule = 'tracteur' | 'remorque' | 'porteur' | 'bus_car' | 'utilitaire'

export interface Dossier {
  id: string
  numero: string
  client_nom: string
  client_telephone: string
  client_email: string | null
  societe: string | null
  immatriculation: string
  vin: string | null
  marque: string
  modele: string
  type_vehicule: TypeVehicule
  kilometrage: number | null
  description_panne: string
  statut: StatutDossier
  urgence: boolean
  date_ct: string | null
  date_tachygraphe: string | null
  date_limiteur: string | null
  mecanicien_id: string | null
  created_at: string
  updated_at: string
}

export interface Profil {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  actif: boolean
  telephone: string | null
}

export interface Diagnostic {
  id: string
  dossier_id: string
  symptomes: string
  controles: string
  hypotheses: string
  travaux: string
  temps_estime: number | null
}

export interface PieceDemandee {
  id: string
  dossier_id: string
  designation: string
  reference_oem: string | null
  fournisseur: string | null
  statut: 'en_attente' | 'commandee' | 'recue' | 'installee' | 'annulee'
  quantite: number
  prix_achat: number | null
  created_at?: string
}

export interface Photo {
  id: string
  dossier_id: string
  url: string
  categorie: 'avant' | 'apres' | 'detail' | 'document' | 'autre'
  commentaire: string | null
  created_at?: string
}

export interface MessageDossier {
  id: string
  dossier_id: string
  auteur_id: string
  auteur_nom: string
  auteur_role: Role
  contenu: string
  photo_url: string | null
  type: 'message' | 'system' | 'photo'
  created_at: string
}

export interface HistoriqueAction {
  id: string
  dossier_id: string
  action: string
  ancien_statut: StatutDossier | null
  nouveau_statut: StatutDossier | null
  auteur: string
  commentaire: string | null
  created_at?: string
}

export interface FicheControle {
  id: string
  dossier_id: string
  type_vehicule: TypeVehicule
  resultats: Record<string, 'ok' | 'attention' | 'ko' | 'na'>
  observations: string | null
  pieces_a_remplacer: string | null
  temps_controle: number | null
  temps_devis_mo: number | null
  statut: 'en_cours' | 'termine'
  created_at?: string
}

export interface DashboardStats {
  urgents: number
  attente_pieces: number
  en_cours: number
  a_facturer: number
  plus_7j: number
  total_actifs: number
}
