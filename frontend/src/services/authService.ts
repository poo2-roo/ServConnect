import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConnexionResponse {
  access: string;
  refresh: string;
  [key: string]: any;
}

export interface AuthResult {
  success: boolean;
  data?: ConnexionResponse;
  error?: string;
}

/**
  Authentifie un utilisateur avec son email ou numéro de téléphone.
  Stocke automatiquement les tokens JWT dans AsyncStorage en cas de succès.
 */
export const connecterUtilisateur = async (
  identifier: string,
  password: string
): Promise<AuthResult> => {
  try {
    const response = await api.post<ConnexionResponse>('/accounts/connexion/', {
      identifier,
      password,
    });

    const { access, refresh } = response.data;

    if (access) {
      await AsyncStorage.setItem('access_token', access);
    }
    if (refresh) {
      await AsyncStorage.setItem('refresh_token', refresh);
    }

    return { success: true, data: response.data };
  } catch (error: any) {
    // Intercepte les erreurs de validation, blocages et suspensions renvoyés par Django
    const messageErreur =
      error.response?.data?.non_field_errors?.[0] ||
      error.response?.data?.detail ||
      (typeof error.response?.data === 'string' ? error.response.data : null) ||
      'Une erreur est survenue lors de la connexion.';

    return { success: false, error: messageErreur };
  }
};

/**
  Déconnecte l'utilisateur en supprimant les tokens du stockage local.
 */
export const deconnecterUtilisateur = async (): Promise<void> => {
  await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
};