import api from './api';

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

export async function recupererMaLocalisation(prestataireId: number) {
  const r = await api.get('/api/geolocation/localisations/', { params: { prestataire: prestataireId } });
  const donnees = Array.isArray(r.data) ? r.data : (r.data as any).results || [];
  return donnees[0] || null;
}