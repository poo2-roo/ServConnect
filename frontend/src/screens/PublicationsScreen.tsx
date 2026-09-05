import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ameliorerImageBrouillon, genererLegende, publier } from '../services/creationPublication';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

const TYPES = [
  { valeur: 'actualite', label: 'Actualité' },
  { valeur: 'promotion', label: 'Promotion' },
  { valeur: 'annonce', label: 'Annonce' },
];

export default function PublicationsScreen() {
  const [type, setType] = useState('actualite');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [contenu, setContenu] = useState('');
  const [chargementImage, setChargementImage] = useState(false);
  const [chargementLegende, setChargementLegende] = useState(false);
  const [chargementPublication, setChargementPublication] = useState(false);

  async function choisirImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à vos photos est nécessaire pour ajouter une image.");
      return;
    }
    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!resultat.canceled) {
      setImageUri(resultat.assets[0].uri);
    }
  }

  async function handleAmeliorerImage() {
    if (!imageUri) {
      Alert.alert('Aucune image', "Choisissez d'abord une image à améliorer.");
      return;
    }
    setChargementImage(true);
    try {
      const imageAmelioree = await ameliorerImageBrouillon(imageUri);
      setImageUri(imageAmelioree);
    } catch {
      Alert.alert('Erreur', "Impossible d'améliorer l'image pour le moment.");
    } finally {
      setChargementImage(false);
    }
  }

  async function handleGenererLegende() {
    if (!contenu.trim()) {
      Alert.alert('Notes manquantes', 'Tapez quelques mots-clés décrivant votre publication avant de générer un texte.');
      return;
    }
    setChargementLegende(true);
    try {
      const legende = await genererLegende(type, contenu);
      setContenu(legende);
    } catch {
      Alert.alert('Erreur', 'Impossible de générer un texte pour le moment.');
    } finally {
      setChargementLegende(false);
    }
  }

  async function handlePublier() {
    if (!contenu.trim()) {
      Alert.alert('Contenu manquant', 'Merci de décrire votre publication.');
      return;
    }
    setChargementPublication(true);
    try {
      await publier({ type_publication: type, contenu, imageUri: imageUri || undefined });
      Alert.alert('Publié !', 'Votre publication est en ligne.');
      setContenu('');
      setImageUri(null);
    } catch (erreur: any) {
      const detail = erreur?.response?.data;
      Alert.alert('Publication impossible', detail ? JSON.stringify(detail) : 'Une erreur est survenue.');
    } finally {
      setChargementPublication(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.titre}>Créer une publication</Text>

        <View style={styles.rangeeTypes}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.valeur}
              style={[stylesPartages.pilleCategorie, type === t.valeur && stylesPartages.pilleCategorieActive]}
              onPress={() => setType(t.valeur)}
            >
              <Text style={{ color: type === t.valeur ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.zoneImage} onPress={choisirImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imageApercu} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="image-outline" size={32} color={couleurs.neutre} />
              <Text style={styles.placeholderTexte}>Visuel de la publication</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={stylesPartages.boutonIA} onPress={handleAmeliorerImage} disabled={chargementImage}>
          {chargementImage ? (
            <ActivityIndicator size="small" color={couleurs.blanc} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={couleurs.blanc} />
              <Text style={stylesPartages.boutonIATexte}>Améliorer l'image par IA</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.zoneTexte}
          placeholder="Décrivez votre service ou réalisation..."
          placeholderTextColor={couleurs.neutre}
          value={contenu}
          onChangeText={setContenu}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity style={stylesPartages.boutonIA} onPress={handleGenererLegende} disabled={chargementLegende}>
          {chargementLegende ? (
            <ActivityIndicator size="small" color={couleurs.blanc} />
          ) : (
            <>
              <Ionicons name="sparkles" size={16} color={couleurs.blanc} />
              <Text style={stylesPartages.boutonIATexte}>Générer un texte avec l'IA</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.boutonPublier} onPress={handlePublier} disabled={chargementPublication}>
          {chargementPublication ? (
            <ActivityIndicator color={couleurs.blanc} />
          ) : (
            <Text style={styles.boutonPublierTexte}>Publier</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  scroll: { padding: espacements.md, paddingTop: espacements.xl },
  titre: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire, marginBottom: espacements.md },

  rangeeTypes: { flexDirection: 'row', gap: espacements.xs, marginBottom: espacements.md },

  zoneImage: {
    width: '100%', height: 180, borderRadius: rayons.grand, overflow: 'hidden',
    backgroundColor: couleurs.blanc, borderWidth: 1, borderColor: couleurs.bordure,
    marginBottom: espacements.sm,
  },
  imageApercu: { width: '100%', height: '100%' },
  placeholderImage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderTexte: { color: couleurs.neutre, fontSize: 13, marginTop: espacements.xs },

  label: { fontWeight: '600', color: couleurs.tertiaire, marginTop: espacements.md, marginBottom: espacements.xs },
  zoneTexte: {
    backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, borderWidth: 1, borderColor: couleurs.bordure,
    padding: espacements.sm, fontSize: 14, minHeight: 90, textAlignVertical: 'top', marginBottom: espacements.sm,
  },

  boutonPublier: {
    backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen,
    padding: 16, alignItems: 'center', marginTop: espacements.md, marginBottom: espacements.xl,
  },
  boutonPublierTexte: { color: couleurs.blanc, fontSize: 16, fontWeight: '600' },
});