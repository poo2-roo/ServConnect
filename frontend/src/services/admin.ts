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


import { Litige } from '../types';

export async function recupererLitiges(statut = 'ouvert'): Promise<Litige[]> {
  const response = await api.get<Litige[]>(`/accounts/litiges/?statut=${statut}`);
  return response.data;
}

export async function resoudreLitige(
  id: number,
  payload: {
    type_sanction: 'aucune' | 'suspension' | 'blocage';
    duree_jours?: number | null;
    commentaire_resolution?: string;
  }
): Promise<Litige> {
  const response = await api.post<Litige>(`/accounts/admin/litiges/${id}/resoudre/`, payload);
  return response.data;
}