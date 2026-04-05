import type { StatutDossier, Role, TypeVehicule } from './types'

export const STATUT_CONFIG: Record<StatutDossier, { label: string; color: string; bg: string; border: string }> = {
  nouveau:                   { label: 'Nouveau',                   color: 'text-slate-700',   bg: 'bg-slate-100',   border: 'border-slate-300' },
  recu:                      { label: 'Reçu',                      color: 'text-blue-700',    bg: 'bg-blue-100',    border: 'border-blue-300' },
  a_diagnostiquer:           { label: 'À diagnostiquer',           color: 'text-violet-700',  bg: 'bg-violet-100',  border: 'border-violet-300' },
  diagnostique_termine:      { label: 'Diagnostic terminé',        color: 'text-indigo-700',  bg: 'bg-indigo-100',  border: 'border-indigo-300' },
  devis_a_envoyer:           { label: 'Devis à envoyer',           color: 'text-yellow-700',  bg: 'bg-yellow-100',  border: 'border-yellow-300' },
  attente_validation_client: { label: 'Attente validation client', color: 'text-amber-700',   bg: 'bg-amber-100',   border: 'border-amber-300' },
  devis_valide:              { label: 'Devis validé',              color: 'text-teal-700',    bg: 'bg-teal-100',    border: 'border-teal-300' },
  attente_pieces:            { label: 'Attente pièces',            color: 'text-orange-700',  bg: 'bg-orange-100',  border: 'border-orange-300' },
  pieces_recues:             { label: 'Pièces reçues',             color: 'text-cyan-700',    bg: 'bg-cyan-100',    border: 'border-cyan-300' },
  en_cours:                  { label: 'En cours',                  color: 'text-brand-700',   bg: 'bg-brand-100',   border: 'border-brand-300' },
  termine_technique:         { label: 'Terminé technique',         color: 'text-green-700',   bg: 'bg-green-100',   border: 'border-green-300' },
  a_facturer:                { label: 'À facturer',                color: 'text-pink-700',    bg: 'bg-pink-100',    border: 'border-pink-300' },
  cloture:                   { label: 'Clôturé',                   color: 'text-gray-500',    bg: 'bg-gray-100',    border: 'border-gray-200' },
  bloque:                    { label: 'Bloqué',                    color: 'text-red-700',     bg: 'bg-red-100',     border: 'border-red-300' },
}

export const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string }> = {
  direction:     { label: 'Direction',      color: 'text-purple-700',  bg: 'bg-purple-100' },
  chef_atelier:  { label: 'Chef Atelier',   color: 'text-brand-700',   bg: 'bg-brand-100' },
  mecanicien:    { label: 'Mécanicien',     color: 'text-blue-700',    bg: 'bg-blue-100' },
  administratif: { label: 'Administratif',  color: 'text-teal-700',    bg: 'bg-teal-100' },
  reception:     { label: 'Réception',      color: 'text-indigo-700',  bg: 'bg-indigo-100' },
  magasin:       { label: 'Magasin',        color: 'text-amber-700',   bg: 'bg-amber-100' },
}

export const TYPE_VEHICULE_CONFIG: Record<TypeVehicule, { label: string; icon: string }> = {
  tracteur:    { label: 'Tracteur',   icon: '🚛' },
  remorque:    { label: 'Remorque',   icon: '🚚' },
  porteur:     { label: 'Porteur',    icon: '🚜' },
  bus_car:     { label: 'Bus / Car',  icon: '🚌' },
  utilitaire:  { label: 'Utilitaire', icon: '🚐' },
}

export const STATUT_TRANSITIONS: Record<StatutDossier, StatutDossier[]> = {
  nouveau:                   ['recu', 'bloque'],
  recu:                      ['a_diagnostiquer', 'bloque'],
  a_diagnostiquer:           ['diagnostique_termine', 'bloque'],
  diagnostique_termine:      ['devis_a_envoyer', 'bloque'],
  devis_a_envoyer:           ['attente_validation_client', 'bloque'],
  attente_validation_client: ['devis_valide', 'bloque'],
  devis_valide:              ['attente_pieces', 'en_cours', 'bloque'],
  attente_pieces:            ['pieces_recues', 'bloque'],
  pieces_recues:             ['en_cours', 'bloque'],
  en_cours:                  ['termine_technique', 'bloque'],
  termine_technique:         ['a_facturer', 'bloque'],
  a_facturer:                ['cloture', 'bloque'],
  cloture:                   [],
  bloque:                    ['nouveau', 'recu', 'a_diagnostiquer', 'diagnostique_termine', 'devis_a_envoyer',
                               'attente_validation_client', 'devis_valide', 'attente_pieces', 'pieces_recues',
                               'en_cours', 'termine_technique', 'a_facturer'],
}

export const STATUT_PIECED: Record<string, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente',  color: 'text-slate-700',  bg: 'bg-slate-100' },
  commandee:  { label: 'Commandée',   color: 'text-blue-700',   bg: 'bg-blue-100' },
  recue:      { label: 'Reçue',       color: 'text-green-700',  bg: 'bg-green-100' },
  installee:  { label: 'Installée',   color: 'text-teal-700',   bg: 'bg-teal-100' },
  annulee:    { label: 'Annulée',     color: 'text-red-700',    bg: 'bg-red-100' },
}

export const CATEGORIE_PHOTO: Record<string, string> = {
  avant:    'Avant intervention',
  apres:    'Après intervention',
  detail:   'Détail',
  document: 'Document',
  autre:    'Autre',
}

// Fiches de contrôle
export const FICHE_TRACTEUR = [
  { section: 'Moteur', items: ['Niveau huile moteur', 'Niveau liquide refroidissement', 'Courroies', 'Joints / fuites', 'Filtre à air'] },
  { section: 'Transmission', items: ['Embrayage', 'Boîte de vitesses', 'Cardans / arbres', 'Huile BV'] },
  { section: 'Freinage', items: ['Plaquettes AV', 'Plaquettes AR', 'Disques AV', 'Disques AR', 'Liquide de frein', 'Frein de stationnement'] },
  { section: 'Direction', items: ['Rotules', 'Biellettes', 'Pneus AV', 'Pneus AR', 'Pression pneus'] },
  { section: 'Électrique', items: ['Batterie', 'Alternateur', 'Éclairage AV', 'Éclairage AR', 'Feux de signalisation', 'Tachygraphe'] },
  { section: 'Cabine', items: ['Essuie-glaces', 'Klaxon', 'Sécurités cabine', 'Rétroviseurs'] },
]

export const FICHE_REMORQUE = [
  { section: 'Freinage', items: ['Plaquettes AV', 'Plaquettes AR', 'Tambours', 'Réglage frein', 'Frein de stationnement'] },
  { section: 'Suspension', items: ['Soufflets pneumatiques', 'Amortisseurs', 'Timonerie'] },
  { section: 'Pneumatiques', items: ['Pneus essieu 1', 'Pneus essieu 2', 'Pneus essieu 3', 'Pressions', 'Roue de secours'] },
  { section: 'Électrique', items: ['Feux arrière', 'Feux de gabarit', 'Antipatinage', 'Abs remorque'] },
  { section: 'Structure', items: ['Plancher', 'Portes', 'Étanchéité', 'Sellette / attelage'] },
]

export const FICHE_PORTEUR = [
  { section: 'Moteur', items: ['Niveau huile moteur', 'Courroies', 'Joints', 'Filtre air', 'Liquide refroidissement'] },
  { section: 'Freinage', items: ['Plaquettes AV', 'Plaquettes AR', 'Disques/Tambours', 'Liquide frein', 'Frein de stationnement'] },
  { section: 'Direction', items: ['Rotules', 'Biellettes', 'Pneus AV', 'Pneus AR', 'Pression pneus'] },
  { section: 'Transmission', items: ['Boîte de vitesses', 'Cardans', 'Huile pont'] },
  { section: 'Électrique', items: ['Batterie', 'Alternateur', 'Éclairage AV/AR', 'Feux de travail'] },
  { section: 'Carrosserie / Benne', items: ['Hayons', 'Benne', 'Structure', 'Hydraulique benne'] },
]

export const FICHE_BUS_CAR = [
  { section: 'Moteur', items: ['Huile moteur', 'Liquide refroidissement', 'Courroies', 'Joints'] },
  { section: 'Freinage', items: ['Plaquettes AV', 'Plaquettes AR', 'Disques AV', 'Disques AR', 'Frein de stationnement', 'Freinage de ralentissement'] },
  { section: 'Direction', items: ['Rotules', 'Direction assistée', 'Pneus AV', 'Pneus AR', 'Pression pneus'] },
  { section: 'Sécurité passagers', items: ['Portes', 'Sorties de secours', 'Extincteurs', 'Trousse de secours', 'Marteaux brise-glace'] },
  { section: 'Climatisation', items: ['Filtre habitacle', 'Compresseur clim', 'Niveau réfrigérant'] },
  { section: 'Électrique', items: ['Batterie', 'Éclairage intérieur', 'Éclairage extérieur', 'Tachygraphe', 'Limiteur vitesse'] },
]

export const FICHE_UTILITAIRE = [
  { section: 'Moteur', items: ['Huile moteur', 'Liquide refroidissement', 'Courroies', 'Joints'] },
  { section: 'Freinage', items: ['Plaquettes AV', 'Plaquettes AR', 'Disques AV', 'Tambours AR', 'Liquide frein'] },
  { section: 'Direction', items: ['Rotules', 'Pneus AV', 'Pneus AR', 'Pression pneus'] },
  { section: 'Électrique', items: ['Batterie', 'Alternateur', 'Éclairage AV/AR', 'Feux de recul'] },
  { section: 'Carrosserie', items: ['Portes coulissantes', 'Portes arrière', 'Hayons', 'Éclairage caisson'] },
]

export const FICHES_BY_TYPE: Record<string, typeof FICHE_TRACTEUR> = {
  tracteur:   FICHE_TRACTEUR,
  remorque:   FICHE_REMORQUE,
  porteur:    FICHE_PORTEUR,
  bus_car:    FICHE_BUS_CAR,
  utilitaire: FICHE_UTILITAIRE,
}
