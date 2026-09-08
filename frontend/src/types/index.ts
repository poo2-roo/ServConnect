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
  a_profil_prestataire: boolean;
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
  categories: { id: number; nom: string }[];
}

export interface Avis {
  id: number;
  client_nom: string;
  note: number;
  commentaire: string;
  reponse_prestataire: string;
  date_creation: string;
}

export interface Service {
  id: number;
  titre: string;
  description: string;
  prix_min: string;
  prix_max: string | null;
  unite_prix: string;
  categorie_nom: string;
}

export interface Conversation {
  id: number;
  client: number;
  prestataire: number;
  prestataire_nom: string;
  prestataire_avatar: string | null;
  client_nom: string;
  client_avatar: string | null;
  prestataire_initiateur: number | null;
  prestataire_initiateur_nom: string | null;
  prestataire_initiateur_avatar: string | null;
  derniere_activite: string;
  messages_non_lus: number;
}

export interface Message {
  id: number;
  conversation: number;
  expediteur: number;
  expediteur_nom: string;
  contenu: string;
  est_suggestion_ia: boolean;
  est_lu: boolean;
  date_envoi: string;
}