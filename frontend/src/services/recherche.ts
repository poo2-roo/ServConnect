import api from './api';

export interface FeatureLocalisation {
  type: string;
  geometry: { type: string; coordinates: [number, number] }; // [lon, lat]
  properties: {
    prestataire: number;
    nom_structure: string;
    quartier: string;
    ville: string;
  };
}

export async function recupererLocalisationsProximite(lat: number, lon: number, rayonKm = 15): Promise<FeatureLocalisation[]> {
  const r = await api.get('/api/geolocation/localisations/proximite/', {
    params: { lat, lon, rayon_km: rayonKm },
  });

  const data: any = r.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.results?.features)) return data.results.features;
  if (Array.isArray(data?.features)) return data.features;

  return [];
}

export async function demanderAssistant(message: string): Promise<{ categorie_id: number | null; categorie_nom: string | null; reponse_texte: string }> {
  const r = await api.post('/api/services/assistant-recherche/', { message });
  return r.data;
}