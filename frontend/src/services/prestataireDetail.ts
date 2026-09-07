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