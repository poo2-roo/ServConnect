import api from './api';
import { Publication } from '../types';

export async function recupererPublications(): Promise<Publication[]> {
  const reponse = await api.get<{ results?: Publication[] } | Publication[]>('/api/publications/');
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function basculerLike(publicationId: number): Promise<{ aime: boolean; nombre_likes: number }> {
  const reponse = await api.post(`/api/publications/${publicationId}/aimer/`);
  return reponse.data;
}

export interface Commentaire {
  id: number;
  publication: number;
  auteur: number;
  auteur_nom: string;
  contenu: string;
  date_creation: string;
}

export async function recupererCommentaires(publicationId: number): Promise<Commentaire[]> {
  const reponse = await api.get<{ results?: Commentaire[] } | Commentaire[]>(
    `/api/publications/${publicationId}/commentaires/`
  );
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function ajouterCommentaire(publicationId: number, contenu: string): Promise<Commentaire> {
  const reponse = await api.post<Commentaire>(`/api/publications/${publicationId}/commentaires/`, { contenu });
  return reponse.data;
}