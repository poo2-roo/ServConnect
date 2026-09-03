export interface Utilisateur {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  telephone: string;
  role: 'client' | 'prestataire' | 'administrateur';
  photo_profil: string | null;
  date_naissance: string | null;
  langue_preferee: 'fr' | 'en';
  telephone_verifie: boolean;
  date_creation: string;
}

export interface TokensAuth {
  access: string;
  refresh: string;
}