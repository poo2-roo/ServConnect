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