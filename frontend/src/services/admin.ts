import api from './api';
import { Prestataire, Categorie } from '../types';

export interface Litige {
  id: number;
  utilisateur: number;
  utilisateur_nom: string;
  utilisateur_role: string;
  signale_par: number | null;
  signale_par_nom: string | null;
  motif: string;
  statut: 'ouvert' | 'resolu';
  type_sanction: string;
  duree_jours: number | null;
  commentaire_resolution: string;
  date_creation: string;
  date_resolution: string | null;
}

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

export async function recupererUtilisateursAdmin(role?: string, search?: string) {
  const r = await api.get('/api/accounts/admin/utilisateurs/', { params: { role, search } });
  return Array.isArray(r.data) ? r.data : (r.data as any).results || [];
}

export async function recupererUtilisateurAdmin(id: number) {
  const r = await api.get(`/api/accounts/admin/utilisateurs/${id}/`);
  return r.data;
}

export async function leverSanction(utilisateurId: number): Promise<void> {
  await api.post(`/api/accounts/admin/utilisateurs/${utilisateurId}/lever-sanction/`);
}

export async function demarrerConversationAdmin(utilisateurId: number) {
  const r = await api.post('/api/messaging/admin-conversations/', { utilisateur: utilisateurId });
  return r.data;
}

export async function creerLitige(donnees: { utilisateurCibleId: number; motif: string }): Promise<Litige> {
  const r = await api.post<Litige>('/api/accounts/litiges/', {
    utilisateur: donnees.utilisateurCibleId,
    motif: donnees.motif.trim(),
  });
  return r.data;
}

export async function recupererLitiges(statut = 'ouvert'): Promise<Litige[]> {
  const r = await api.get<{ results?: Litige[] } | Litige[]>('/api/accounts/litiges/', { params: { statut } });
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function resoudreLitige(
  id: number,
  payload: { type_sanction: 'aucune' | 'suspension' | 'blocage'; duree_jours?: number | null; commentaire_resolution?: string }
): Promise<Litige> {
  const r = await api.post<Litige>(`/api/accounts/admin/litiges/${id}/resoudre/`, payload);
  return r.data;
}

export async function sanctionnerUtilisateur(
  utilisateurId: number,
  payload: { type_sanction: 'suspension' | 'blocage'; duree_jours?: number | null; motif?: string }
): Promise<void> {
  await api.post(`/api/accounts/admin/utilisateurs/${utilisateurId}/sanctionner/`, payload);
}