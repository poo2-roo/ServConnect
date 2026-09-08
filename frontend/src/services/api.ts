import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://servconnect-production.up.railway.app';
const NOMBRE_TENTATIVES_MAX = 5;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// Ajoute automatiquement le token JWT à chaque requête, si disponible
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Ne retente automatiquement que les requêtes de lecture (GET) : elles n'ont
// aucun effet de bord, donc les répéter en cas de coupure réseau est sans
// risque. Un POST/PATCH n'est jamais retenté automatiquement, pour éviter
// de créer un doublon si la première tentative avait en fait réussi côté
// serveur et que seule la réponse s'était perdue en chemin.
api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    if (erreur.response?.status === 401) {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }

    const config = erreur.config;
    const estErreurReseau = erreur.code === 'ERR_NETWORK' || erreur.code === 'ECONNABORTED';
    const estLectureSeule = config?.method?.toLowerCase() === 'get';

    if (estErreurReseau && estLectureSeule) {
      config.__tentatives = (config.__tentatives || 0) + 1;
      if (config.__tentatives <= NOMBRE_TENTATIVES_MAX) {
        // Backoff progressif : 500ms, 1000ms, 1500ms avant chaque nouvelle tentative
        await attendre(500 * config.__tentatives);
        return api(config);
      }
    }

    return Promise.reject(erreur);
  }
);

export default api;