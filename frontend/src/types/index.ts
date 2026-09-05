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

export interface Publication {
  id: number;
  prestataire: number;
  prestataire_nom: string;
  prestataire_note: string;
  prestataire_avatar: string | null;
  type_publication: 'annonce' | 'promotion' | 'actualite';
  contenu: string;
  image: string | null;
  nombre_likes: number;
  nombre_commentaires: number;
  jaime_deja: boolean;
  date_creation: string;
}

export interface Categorie {
  id: number;
  nom: string;
  description: string;
  icone: string;
}

export interface Prestataire {
  id: number;
  utilisateur: Utilisateur;
  nom_entreprise: string;
  description: string;
  annees_experience: number | null;
  statut_kyc: string;
  note_moyenne: string;
  nombre_avis: number;
  est_disponible: boolean;
}