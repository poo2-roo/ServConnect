import api from './api';

export interface FeatureLocalisation {
  type: string;
  geometry: { type: string; coordinates: [number, number] }; 
  properties: {
    prestataire: number;
    nom_structure: string;
    quartier: string;
    ville: string;
  };
}

export async function recupererLocalisationsProximite(lat: number, lon: number, rayonKm = 15): Promise<FeatureLocalisation[]> {
  const r = await api.get<{ results?: FeatureLocalisation[] } | FeatureLocalisation[]>(
    '/api/geolocation/localisations/proximite/',
    { params: { lat, lon, rayon_km: rayonKm } }
  );
  return Array.isArray(r.data) ? r.data : r.data.results || [];
}

export async function demanderAssistant(message: string): Promise<{ categorie_id: number | null; categorie_nom: string | null; reponse_texte: string }> {
  const r = await api.post('/api/services/assistant-recherche/', { message });
  return r.data;
}