import api from './api';

function extraireFeatures(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.results?.features)) return data.results.features;
  if (Array.isArray(data?.features)) return data.features;
  return [];
}

export async function creerLocalisationPrestataire(donnees: {
  latitude: number; longitude: number; nom_structure: string;
  type_structure: string; adresse_texte: string; quartier: string; ville: string;
}) {
  const geojson = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [donnees.longitude, donnees.latitude] },
    properties: {
      nom_structure: donnees.nom_structure,
      type_structure: donnees.type_structure,
      adresse_texte: donnees.adresse_texte,
      quartier: donnees.quartier,
      ville: donnees.ville,
    },
  };
  const r = await api.post('/api/geolocation/localisations/', geojson);
  return r.data;
}

export async function recupererLocalisationsPrestataire(prestataireId: number) {
  const r = await api.get('/api/geolocation/localisations/', { params: { prestataire: prestataireId } });
  return extraireFeatures(r.data);
}

export async function recupererLocalisationPrestataire(prestataireId: number) {
  const liste = await recupererLocalisationsPrestataire(prestataireId);
  return liste[0] || null;
}

export async function modifierInfosStructure(id: number, donnees: {
  nom_structure?: string; type_structure?: string; adresse_texte?: string; quartier?: string; ville?: string;
}) {
  const geojson = { type: 'Feature', properties: donnees };
  const r = await api.patch(`/api/geolocation/localisations/${id}/`, geojson);
  return r.data;
}

export async function modifierPositionStructure(id: number, latitude: number, longitude: number) {
  const geojson = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
  };
  const r = await api.patch(`/api/geolocation/localisations/${id}/`, geojson);
  return r.data;
}

export async function supprimerStructure(id: number) {
  await api.delete(`/api/geolocation/localisations/${id}/`);
}