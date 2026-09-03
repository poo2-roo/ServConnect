import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';
import { Utilisateur, TokensAuth } from '../types';

interface AuthContextType {
  utilisateur: Utilisateur | null;
  chargement: boolean;
  connexion: (username: string, password: string) => Promise<void>;
  deconnexion: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);

  // Au démarrage de l'app, vérifie si un token existe déjà (utilisateur déjà connecté avant)
  useEffect(() => {
    async function verifierSession() {
      const token = await SecureStore.getItemAsync('access_token');
      if (token) {
        try {
          const reponse = await api.get<Utilisateur>('/api/accounts/moi/');
          setUtilisateur(reponse.data);
        } catch {
          await SecureStore.deleteItemAsync('access_token');
          await SecureStore.deleteItemAsync('refresh_token');
        }
      }
      setChargement(false);
    }
    verifierSession();
  }, []);

  async function connexion(username: string, password: string) {
    const reponse = await api.post<TokensAuth>('/api/accounts/connexion/', { username, password });
    await SecureStore.setItemAsync('access_token', reponse.data.access);
    await SecureStore.setItemAsync('refresh_token', reponse.data.refresh);

    const profil = await api.get<Utilisateur>('/api/accounts/moi/');
    setUtilisateur(profil.data);
  }

  async function deconnexion() {
    await SecureStore.deleteItemAsync('access_token');
    await SecureStore.deleteItemAsync('refresh_token');
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, connexion, deconnexion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé à l\'intérieur d\'un AuthProvider');
  }
  return context;
}