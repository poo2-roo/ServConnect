import axios from 'axios';
import * as SecureStore from 'expo-secure-store';


const BASE_URL = 'https://servconnect-production.up.railway.app';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Ajoute automatiquement le token JWT à chaque requête, si disponible
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;