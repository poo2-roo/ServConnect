import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import {
  mettreAJourPhoto, mettreAJourProfil, devenirPrestataireAvecCategories,
  recupererMonProfilPrestataire, mettreAJourCategories, modifierMonProfilPrestataire,
} from '../services/profil';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import { Prestataire } from '../types';
import KYCSection from '../components/KYCSection';
import SelecteurCategories from '../components/SelecteurCategories';

export default function ProfilScreen({ navigation }: any) {
  const { utilisateur, deconnexion, rafraichirUtilisateur } = useAuth();
  const [enEdition, setEnEdition] = useState(false);
  const [prenom, setPrenom] = useState(utilisateur?.first_name || '');
  const [nom, setNom] = useState(utilisateur?.last_name || '');
  const [email, setEmail] = useState(utilisateur?.email || '');
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [chargementSauvegarde, setChargementSauvegarde] = useState(false);

  const [monPrestataire, setMonPrestataire] = useState<Prestataire | null>(null);
  const [modificationCategories, setModificationCategories] = useState(false);
  const [categoriesEnEdition, setCategoriesEnEdition] = useState<number[]>([]);
  const [chargementCategories, setChargementCategories] = useState(false);

  const [enEditionPrestataire, setEnEditionPrestataire] = useState(false);
  const [nomEntrepriseEdit, setNomEntrepriseEdit] = useState('');
  const [descriptionEdit, setDescriptionEdit] = useState('');
  const [chargementEditionPrestataire, setChargementEditionPrestataire] = useState(false);

  // Formulaire "devenir prestataire"
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<number[]>([]);
  const [afficherFormPrestataire, setAfficherFormPrestataire] = useState(false);
  const [nomEntreprise, setNomEntreprise] = useState('');
  const [descriptionEntreprise, setDescriptionEntreprise] = useState('');
  const [chargementPrestataire, setChargementPrestataire] = useState(false);

  useEffect(() => {
    if (utilisateur?.a_profil_prestataire) {
      recupererMonProfilPrestataire()
        .then((p) => {
          setMonPrestataire(p);
          setCategoriesEnEdition(p.categories.map((c) => c.id));
        })
        .catch(() => {});
    }
  }, [utilisateur?.a_profil_prestataire]);

  useEffect(() => {
    if (monPrestataire) {
      setNomEntrepriseEdit(monPrestataire.nom_entreprise || '');
      setDescriptionEdit(monPrestataire.description || '');
    }
  }, [monPrestataire]);

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

  async function handleSauvegarderInfosPrestataire() {
    setChargementEditionPrestataire(true);
    try {
      const misAJour = await modifierMonProfilPrestataire({
        nom_entreprise: nomEntrepriseEdit, description: descriptionEdit,
      });
      setMonPrestataire(misAJour);
      setEnEditionPrestataire(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour les informations.');
    } finally {
      setChargementEditionPrestataire(false);
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
        try {
          await rafraichirUtilisateur();
          setAfficherFormPrestataire(false);
          Alert.alert('Profil déjà activé', 'Votre profil prestataire était déjà actif.');
        } catch {
          Alert.alert('Erreur réseau', "Le profil existe mais la synchronisation a échoué. Vérifiez votre connexion et rouvrez l'app.");
        }
      } else {
        Alert.alert('Erreur', detail ? JSON.stringify(erreur.response.data) : "Impossible d'activer le profil prestataire.");
      }
    } finally {
      setChargementPrestataire(false);
    }
  }

  async function handleSauvegarderCategories() {
    setChargementCategories(true);
    try {
      await mettreAJourCategories(categoriesEnEdition);
      const misAJour = await recupererMonProfilPrestataire();
      setMonPrestataire(misAJour);
      setModificationCategories(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour les catégories.');
    } finally {
      setChargementCategories(false);
    }
  }

  if (!utilisateur) return null;

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={handleChangerPhoto} style={styles.avatarConteneur}>
        {utilisateur.photo_profil ? (
          <Image source={{ uri: utilisateur.photo_profil }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarSansPhoto]}>
            <Ionicons name="person" size={48} color={couleurs.neutre} />
          </View>
        )}
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
        <View key="lecture-profil">
          <Text style={styles.nomComplet}>{utilisateur.first_name} {utilisateur.last_name}</Text>
          <Text style={styles.role}>@{utilisateur.username} • {utilisateur.role}</Text>
          <TouchableOpacity onPress={() => setEnEdition(true)}>
            <Text style={styles.lienModifier}>Modifier mes informations</Text>
          </TouchableOpacity>
        </View>
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

      {utilisateur.a_profil_prestataire && (
        <View key="section-prestataire" style={{ width: '100%' }}>
          <View style={styles.sectionCategories}>
          <TouchableOpacity
            style={[stylesPartages.boutonContour, { width: '100%', marginBottom: espacements.md }]}
            onPress={() => navigation.navigate('Accueil', { screen: 'CreerPublication' })}
          >
            <Text style={stylesPartages.boutonContourTexte}>Créer une publication</Text>
          </TouchableOpacity>
            <Text style={styles.titreSection}>Mon activité</Text>
            {enEditionPrestataire ? (
              <View key="edition-activite">
                <TextInput style={styles.champ} value={nomEntrepriseEdit} onChangeText={setNomEntrepriseEdit} placeholder="Nom de votre activité" />
                <TextInput style={[styles.champ, { height: 80 }]} value={descriptionEdit} onChangeText={setDescriptionEdit} placeholder="Description" multiline />
                <View style={styles.rangeeBoutons}>
                  <TouchableOpacity style={[stylesPartages.boutonContour, { flex: 1 }]} onPress={() => setEnEditionPrestataire(false)}>
                    <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[stylesPartages.boutonPrincipal, { flex: 1 }]} onPress={handleSauvegarderInfosPrestataire} disabled={chargementEditionPrestataire}>
                    {chargementEditionPrestataire ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Enregistrer</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View key="lecture-activite">
                <Text style={styles.nomEntrepriseAffiche}>{monPrestataire?.nom_entreprise || 'Nom non renseigné'}</Text>
                <Text style={styles.descriptionAffichee}>{monPrestataire?.description || 'Aucune description.'}</Text>
                <TouchableOpacity onPress={() => setEnEditionPrestataire(true)}>
                  <Text style={styles.lienModifier}>Modifier</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.sectionCategories}>
            <Text style={styles.titreSection}>Mes catégories</Text>
            {modificationCategories ? (
              <View key="edition-categories">
                <SelecteurCategories selection={categoriesEnEdition} onChange={setCategoriesEnEdition} />
                <View style={styles.rangeeBoutons}>
                  <TouchableOpacity style={[stylesPartages.boutonContour, { flex: 1 }]} onPress={() => setModificationCategories(false)}>
                    <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[stylesPartages.boutonPrincipal, { flex: 1 }]} onPress={handleSauvegarderCategories} disabled={chargementCategories}>
                    {chargementCategories ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Enregistrer</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View key="lecture-categories">
                <View style={styles.rangeeCategoriesLecture}>
                  {monPrestataire?.categories.length ? (
                    monPrestataire.categories.map((c) => (
                      <View key={c.id} style={stylesPartages.pilleCategorie}>
                        <Text style={{ color: couleurs.tertiaire, fontSize: 13 }}>{c.nom}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: couleurs.neutre, fontSize: 13 }}>Aucune catégorie sélectionnée.</Text>
                  )}
                </View>
                <TouchableOpacity onPress={() => setModificationCategories(true)}>
                  <Text style={styles.lienModifier}>Modifier mes catégories</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <KYCSection />
        </View>
      )}

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
  avatarSansPhoto: { justifyContent: 'center', alignItems: 'center' },
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

  nomEntrepriseAffiche: { fontSize: 15, fontWeight: '600', color: couleurs.tertiaire, marginBottom: 4 },
  descriptionAffichee: { fontSize: 13, color: couleurs.neutre, marginBottom: espacements.xs, lineHeight: 18 },

  sectionCategories: { width: '100%', marginBottom: espacements.md },
  rangeeCategoriesLecture: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginBottom: espacements.xs },

  separateur: { width: '100%', height: 1, backgroundColor: couleurs.bordure, marginVertical: espacements.md },

  boutonDeconnexion: {
    marginTop: espacements.lg, marginBottom: espacements.xl,
    borderWidth: 1, borderColor: '#DA1E28', borderRadius: rayons.moyen,
    paddingVertical: 12, paddingHorizontal: 24, width: '100%', alignItems: 'center',
  },
  boutonDeconnexionTexte: { color: '#DA1E28', fontWeight: '600' },
});