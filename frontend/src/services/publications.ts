import api from './api';
import { Publication } from '../types';

export async function recupererPublications(): Promise<Publication[]> {
  const reponse = await api.get<{ results?: Publication[] } | Publication[]>('/api/publications/');
  // DRF peut paginer (objet avec "results") ou non (tableau direct) selon la config
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function basculerLike(publicationId: number): Promise<{ aime: boolean; nombre_likes: number }> {
  const reponse = await api.post(`/api/publications/${publicationId}/aimer/`);
  return reponse.data;
}