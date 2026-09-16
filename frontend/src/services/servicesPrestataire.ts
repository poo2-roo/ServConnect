import api from './api';
import { Categorie } from '../types';

export interface ServicePrestataire {
  id: number;
  titre: string;
  description: string;
  prix_min: string;
  prix_max: string | null;
  prix_suggere_ia: string | null;
  categorie: number;
  est_actif: boolean;
}

export async function recupererMesServices(): Promise<ServicePrestataire[]> {
  const r = await api.get<{ results?: ServicePrestataire[] } | ServicePrestataire[]>('/api/services/services/');
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function creerService(donnees: {
  categorie: number; titre: string; description: string; prix_min: number;
}): Promise<ServicePrestataire> {
  const r = await api.post<ServicePrestataire>('/api/services/services/', donnees);
  return r.data;
}

export async function optimiserPrixService(serviceId: number): Promise<{
  prix_suggere: number; fourchette_basse: number; fourchette_haute: number;
  justification: string; confiance: number;
}> {
  const r = await api.post(`/api/services/services/${serviceId}/optimiser-prix/`);
  return r.data;
}

export async function mettreAJourPrixService(serviceId: number, prixMin: number): Promise<void> {
  await api.patch(`/api/services/services/${serviceId}/`, { prix_min: prixMin });
}

export async function modifierService(serviceId: number, donnees: {
  titre?: string; description?: string; prix_min?: number; est_actif?: boolean;
}) {
  const r = await api.patch(`/api/services/services/${serviceId}/`, donnees);
  return r.data;
}

export async function supprimerService(serviceId: number) {
  await api.delete(`/api/services/services/${serviceId}/`);
}