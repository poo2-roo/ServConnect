import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://servconnect-production.up.railway.app';
const NOMBRE_TENTATIVES_MAX = 3;


let cachedAccessToken: string | null = null;

export const setApiAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, 
    'Connection': 'close',
    'Accept': 'application/json',
  },
});


api.interceptors.request.use(async (config) => {
  if (!cachedAccessToken) {
    cachedAccessToken = await SecureStore.getItemAsync('access_token');
  }
  if (cachedAccessToken) {
    config.headers.Authorization = `Bearer ${cachedAccessToken}`;
  }
  return config;
});

function attendre(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    if (erreur.response?.status === 401) {
      cachedAccessToken = null;
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
    }

    const config = erreur.config;


    if (!config || config._isRetry) {
      return Promise.reject(erreur);
    }

    const estErreurReseau = !erreur.response || erreur.code === 'ERR_NETWORK' || erreur.code === 'ECONNABORTED';
    const estLectureSeule = config.method?.toLowerCase() === 'get';

    if (estErreurReseau && estLectureSeule) {
      config.__tentatives = (config.__tentatives || 0) + 1;
      if (config.__tentatives <= NOMBRE_TENTATIVES_MAX) {
        await attendre(1000 * config.__tentatives);
        
       
        return api.request({ ...config, _isRetry: config.__tentatives >= NOMBRE_TENTATIVES_MAX });
      }
    }

    return Promise.reject(erreur);
  }
);

export default api;