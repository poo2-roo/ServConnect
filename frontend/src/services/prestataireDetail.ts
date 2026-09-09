import api from './api';
import { Prestataire, Avis, Service } from '../types';

export async function recupererPrestataire(id: number): Promise<Prestataire> {
  const reponse = await api.get<Prestataire>(`/api/accounts/prestataires/${id}/`);
  return reponse.data;
}

export async function recupererAvisPrestataire(id: number): Promise<Avis[]> {
  const reponse = await api.get<{ results?: Avis[] } | Avis[]>('/api/reviews/avis/', {
    params: { prestataire: id },
  });
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function recupererServicesPrestataire(id: number): Promise<Service[]> {
  const reponse = await api.get<{ results?: Service[] } | Service[]>('/api/services/services/', {
    params: { prestataire: id },
  });
  return Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
}

export async function laisserAvis(prestataireId: number, note: number, commentaire: string): Promise<Avis> {
  const reponse = await api.post<Avis>('/api/reviews/avis/', { prestataire: prestataireId, note, commentaire });
  return reponse.data;
}

export async function recupererLocalisationPrestataire(prestataireId: number) {
  const r = await api.get<{ results?: any[] } | any[]>('/api/geolocation/localisations/', {
    params: { prestataire: prestataireId },
  });
  const donnees = Array.isArray(r.data) ? r.data : r.data.results || [];
  return donnees[0] || null;
}

export async function recupererETA(localisationId: number, lat: number, lon: number) {
  const r = await api.get(`/api/geolocation/localisations/${localisationId}/eta/`, { params: { lat, lon } });
  return r.data;
}