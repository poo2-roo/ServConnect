import api from './api';
import { Categorie, Prestataire } from '../types';

export async function recupererCategories(): Promise<Categorie[]> {
  const reponse = await api.get<{ results?: Categorie[] } | Categorie[]>('/api/services/categories/');
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function recupererPrestataires(): Promise<Prestataire[]> {
  const reponse = await api.get<{ results?: Prestataire[] } | Prestataire[]>('/api/accounts/prestataires/');
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export interface Recommandation {
  service_id: number;
  titre: string;
  prix_min: string;
  distance_km: number;
  score: number;
  raison: string;
}

export async function recupererRecommandations(lat: number, lon: number, rayonKm = 10): Promise<Recommandation[]> {
  const r = await api.get<{ recommandations: Recommandation[] }>('/api/services/services/recommandations/', {
    params: { lat, lon, rayon_km: rayonKm },
  });
  return r.data.recommandations;
}