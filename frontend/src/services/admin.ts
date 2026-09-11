import api from './api';
import { Prestataire, Categorie } from '../types';

export async function recupererPrestatairesEnAttente(): Promise<Prestataire[]> {
  const r = await api.get<{ results?: Prestataire[] } | Prestataire[]>('/api/accounts/admin/prestataires-en-attente/');
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function validerKYC(prestataireId: number, decision: 'verifie' | 'rejete', commentaire = ''): Promise<void> {
  await api.post(`/api/accounts/admin/prestataires/${prestataireId}/valider-kyc/`, { decision, commentaire });
}

export async function creerCategorie(nom: string, description = ''): Promise<Categorie> {
  const r = await api.post<Categorie>('/api/services/admin/categories/', { nom, description });
  return r.data;
}

export async function supprimerCategorie(id: number): Promise<void> {
  await api.delete(`/api/services/admin/categories/${id}/`);
}

export async function supprimerPublicationAdmin(id: number): Promise<void> {
  await api.delete(`/api/publications/admin/${id}/`);
}

export async function supprimerAvisAdmin(id: number): Promise<void> {
  await api.delete(`/api/reviews/admin/${id}/`);
}

export async function basculerActivationCompte(utilisateurId: number): Promise<{ id: number; is_active: boolean }> {
  const r = await api.post(`/api/accounts/admin/utilisateurs/${utilisateurId}/basculer-activation/`);
  return r.data;
}

export interface UtilisateurAdmin {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  role: string;
  is_active: boolean;
  est_bloque: boolean;
  date_fin_suspension: string | null;
  motif_sanction: string;
  est_suspendu: boolean;
  date_creation: string;
  profil_client: { id: number; adresse_habituelle: string } | null;
  profil_prestataire: { id: number; nom_entreprise: string; statut_kyc: string; note_moyenne: string } | null;
}

export interface Litige {
  id: number;
  utilisateur: number;
  utilisateur_nom: string;
  utilisateur_role: string;
  motif: string;
  statut: 'ouvert' | 'resolu';
  type_sanction: string;
  duree_jours: number | null;
  commentaire_resolution: string;
  date_creation: string;
  date_resolution: string | null;
}

export async function recupererUtilisateursAdmin(role?: string, search?: string): Promise<UtilisateurAdmin[]> {
  const r = await api.get<{ results?: UtilisateurAdmin[] } | UtilisateurAdmin[]>('/api/accounts/admin/utilisateurs/', {
    params: { role, search },
  });
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function recupererUtilisateurAdmin(id: number): Promise<UtilisateurAdmin> {
  const r = await api.get<UtilisateurAdmin>(`/api/accounts/admin/utilisateurs/${id}/`);
  return r.data;
}

export async function recupererLitiges(statut?: string): Promise<Litige[]> {
  const r = await api.get<{ results?: Litige[] } | Litige[]>('/api/accounts/admin/litiges/', { params: { statut } });
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function creerLitige(utilisateurId: number, motif: string): Promise<Litige> {
  const r = await api.post<Litige>('/api/accounts/admin/litiges/', { utilisateur: utilisateurId, motif });
  return r.data;
}

export async function resoudreLitige(
  litigeId: number,
  typeSanction: 'aucune' | 'suspension' | 'blocage',
  dureeJours?: number,
  commentaire?: string
): Promise<Litige> {
  const r = await api.post<Litige>(`/api/accounts/admin/litiges/${litigeId}/resoudre/`, {
    type_sanction: typeSanction, duree_jours: dureeJours, commentaire_resolution: commentaire,
  });
  return r.data;
}

export async function leverSanction(utilisateurId: number): Promise<void> {
  await api.post(`/api/accounts/admin/utilisateurs/${utilisateurId}/lever-sanction/`);
}

export async function demarrerConversationAdmin(utilisateurId: number): Promise<{ id: number; utilisateur_nom: string }> {
  const r = await api.post('/api/messaging/admin-conversations/', { utilisateur: utilisateurId });
  return r.data;
}