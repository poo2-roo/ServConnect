import api from './api';
import { Utilisateur, Prestataire } from '../types';

export async function mettreAJourProfil(donnees: Partial<{
  first_name: string; last_name: string; email: string; telephone: string;
}>): Promise<Utilisateur> {
  const reponse = await api.patch<Utilisateur>('/api/accounts/moi/', donnees);
  return reponse.data;
}

export async function mettreAJourPhoto(uriImage: string): Promise<Utilisateur> {
  const formData = new FormData();
  formData.append('photo_profil', { uri: uriImage, name: 'profil.jpg', type: 'image/jpeg' } as any);
  const reponse = await api.patch<Utilisateur>('/api/accounts/moi/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return reponse.data;
}

export async function uploaderKYC(rectoUri: string, selfieUri: string): Promise<void> {
  const formData = new FormData();
  formData.append('piece_identite_recto', { uri: rectoUri, name: 'recto.jpg', type: 'image/jpeg' } as any);
  formData.append('selfie_avec_piece', { uri: selfieUri, name: 'selfie.jpg', type: 'image/jpeg' } as any);
  await api.patch('/api/accounts/moi/kyc/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function verifierKYC(): Promise<{ statut_kyc: string; recommandation: string; justification: string }> {
  const reponse = await api.post('/api/accounts/moi/kyc/verifier/');
  return reponse.data;
}

export async function devenirPrestataireAvecCategories(donnees: {
  nom_entreprise: string; description: string; annees_experience?: number; categories: number[];
}): Promise<void> {
  await api.post('/api/accounts/moi/devenir-prestataire/', donnees);
}

export async function mettreAJourCategories(categorieIds: number[]): Promise<void> {
  await api.patch('/api/accounts/moi/categories/', { categories: categorieIds });
}

export async function recupererMonProfilPrestataire(): Promise<Prestataire> {
  const reponse = await api.get<Prestataire>('/api/accounts/moi/prestataire/');
  return reponse.data;
}

export async function modifierMonProfilPrestataire(donnees: {
  nom_entreprise?: string; description?: string; annees_experience?: number;
}): Promise<Prestataire> {
  const reponse = await api.patch<Prestataire>('/api/accounts/moi/prestataire/modifier/', donnees);
  return reponse.data;
}