import React, { useState } from 'react';
import SelecteurCategories from '../components/SelecteurCategories';
import { devenirPrestataireAvecCategories, mettreAJourCategories } from '../services/profil';
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { mettreAJourPhoto, mettreAJourProfil, devenirPrestataire } from '../services/profil';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import KYCSection from '../components/KYCSection';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80';

export default function ProfilScreen() {
  const { utilisateur, deconnexion, rafraichirUtilisateur } = useAuth();
  const [enEdition, setEnEdition] = useState(false);
  const [prenom, setPrenom] = useState(utilisateur?.first_name || '');
  const [nom, setNom] = useState(utilisateur?.last_name || '');
  const [email, setEmail] = useState(utilisateur?.email || '');
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [chargementSauvegarde, setChargementSauvegarde] = useState(false);

    const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<number[]>([]);

  // Formulaire "devenir prestataire"
  const [afficherFormPrestataire, setAfficherFormPrestataire] = useState(false);
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [descriptionEntreprise, setDescriptionEntreprise] = useState('');
  const [chargementPrestataire, setChargementPrestataire] = useState(false);

  async function handleChangerPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à vos photos est nécessaire.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (resultat.canceled) return;

    setChargementPhoto(true);
    try {
      await mettreAJourPhoto(resultat.assets[0].uri);
      await rafraichirUtilisateur();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la photo.');
    } finally {
      setChargementPhoto(false);
    }
  }

  async function handleSauvegarderInfos() {
    setChargementSauvegarde(true);
    try {
      await mettreAJourProfil({ first_name: prenom, last_name: nom, email });
      await rafraichirUtilisateur();
      setEnEdition(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder les modifications.');
    } finally {
      setChargementSauvegarde(false);
    }
  }

  async function handleDevenirPrestataire() {
    if (!nomEntreprise.trim()) {
      Alert.alert('Champ manquant', "Merci d'indiquer le nom de votre activité.");
      return;
    }
    setChargementPrestataire(true);
    try {
      await devenirPrestataireAvecCategories({
        nom_entreprise: nomEntreprise, description: descriptionEntreprise,
        categories: categoriesSelectionnees,
      });
      await rafraichirUtilisateur();
      setAfficherFormPrestataire(false);
      Alert.alert('Profil activé !', 'Votre profil prestataire est maintenant actif.');
    } catch (erreur: any) {
      const detail = erreur?.response?.data?.detail || '';
      if (detail.includes('déjà un profil prestataire')) {
        // Le profil a bien été créé lors d'une tentative précédente, seul le
        // rafraîchissement avait échoué (probablement un souci réseau).
        try {
          await rafraichirUtilisateur();
          setAfficherFormPrestataire(false);
          Alert.alert('Profil déjà activé', 'Votre profil prestataire était déjà actif.');
        } catch {
          Alert.alert('Erreur réseau', 'Le profil existe mais la synchronisation a échoué. Vérifiez votre connexion et rouvrez l\'app.');
        }
      } else {
        Alert.alert('Erreur', detail ? JSON.stringify(erreur.response.data) : "Impossible d'activer le profil prestataire.");
      }
    } finally {
      setChargementPrestataire(false);
    }
  }

  if (!utilisateur) return null;

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={handleChangerPhoto} style={styles.avatarConteneur}>
        <Image source={{ uri: utilisateur.photo_profil || AVATAR_PLACEHOLDER }} style={styles.avatar} />
        <View style={styles.badgeAppareil}>
          {chargementPhoto ? (
            <ActivityIndicator size="small" color={couleurs.blanc} />
          ) : (
            <Ionicons name="camera" size={14} color={couleurs.blanc} />
          )}
        </View>
      </TouchableOpacity>

      {enEdition ? (
        <View style={styles.formEdition}>
          <TextInput style={styles.champ} value={prenom} onChangeText={setPrenom} placeholder="Prénom" />
          <TextInput style={styles.champ} value={nom} onChangeText={setNom} placeholder="Nom" />
          <TextInput style={styles.champ} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" />
          <View style={styles.rangeeBoutons}>
            <TouchableOpacity style={[stylesPartages.boutonContour, { flex: 1 }]} onPress={() => setEnEdition(false)}>
              <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stylesPartages.boutonPrincipal, { flex: 1 }]} onPress={handleSauvegarderInfos} disabled={chargementSauvegarde}>
              {chargementSauvegarde ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.nomComplet}>{utilisateur.first_name} {utilisateur.last_name}</Text>
          <Text style={styles.role}>@{utilisateur.username} • {utilisateur.role}</Text>
          <TouchableOpacity onPress={() => setEnEdition(true)}>
            <Text style={styles.lienModifier}>Modifier mes informations</Text>
          </TouchableOpacity>
        </>
      )}

      <View style={styles.separateur} />

      {!utilisateur.a_profil_prestataire && !afficherFormPrestataire && (
        <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={() => setAfficherFormPrestataire(true)}>
          <Text style={stylesPartages.boutonPrincipalTexte}>Devenir prestataire</Text>
        </TouchableOpacity>
      )}

      {afficherFormPrestataire && (
        <View style={styles.formEdition}>
          <Text style={styles.titreSection}>Créer mon profil prestataire</Text>
          <TextInput style={styles.champ} value={nomEntreprise} onChangeText={setNomEntreprise} placeholder="Nom de votre activité" />
          <TextInput style={[styles.champ, { height: 80 }]} value={descriptionEntreprise} onChangeText={setDescriptionEntreprise} placeholder="Description" multiline />
                    <Text style={styles.label}>Catégories de services proposées</Text>
          <SelecteurCategories selection={categoriesSelectionnees} onChange={setCategoriesSelectionnees} />
          <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleDevenirPrestataire} disabled={chargementPrestataire}>
            {chargementPrestataire ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Activer</Text>}
          </TouchableOpacity>
        </View>
      )}

      {utilisateur.a_profil_prestataire && <KYCSection />}

      <TouchableOpacity style={styles.boutonDeconnexion} onPress={deconnexion}>
        <Text style={styles.boutonDeconnexionTexte}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  scroll: { alignItems: 'center', padding: espacements.md, paddingTop: espacements.xl },

  avatarConteneur: { position: 'relative', marginBottom: espacements.sm },
  avatar: { width: 100, height: 100, borderRadius: rayons.rond, backgroundColor: couleurs.bordure },
  badgeAppareil: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: couleurs.bleuBase,
    borderRadius: rayons.rond, width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: couleurs.fond,
  },

  nomComplet: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire },
  role: { fontSize: 13, color: couleurs.neutre, marginBottom: espacements.xs },
  lienModifier: { color: couleurs.bleuBase, fontSize: 13, fontWeight: '600', marginBottom: espacements.md },

  formEdition: { width: '100%', marginTop: espacements.sm },
  titreSection: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.sm },
  champ: {
    width: '100%', borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: 12, marginBottom: espacements.sm, fontSize: 14, backgroundColor: couleurs.blanc,
  },
    label: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.xs, alignSelf: 'flex-start' },
  rangeeBoutons: { flexDirection: 'row', gap: espacements.sm },

  separateur: { width: '100%', height: 1, backgroundColor: couleurs.bordure, marginVertical: espacements.md },

  boutonDeconnexion: {
    marginTop: espacements.lg, marginBottom: espacements.xl,
    borderWidth: 1, borderColor: '#DA1E28', borderRadius: rayons.moyen,
    paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center',
  },
  boutonDeconnexionTexte: { color: '#DA1E28', fontWeight: '600' },
});