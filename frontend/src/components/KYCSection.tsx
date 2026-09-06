import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { uploaderKYC, verifierKYC } from '../services/profil';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

async function choisirImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission refusée', "L'accès à vos photos est nécessaire.");
    return null;
  }
  const resultat = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  return resultat.canceled ? null : resultat.assets[0].uri;
}

export default function KYCSection() {
  const [rectoUri, setRectoUri] = useState<string | null>(null);
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState<{ recommandation: string; justification: string } | null>(null);

  async function handleVerifier() {
    if (!rectoUri || !selfieUri) {
      Alert.alert('Photos manquantes', "Merci d'ajouter votre pièce d'identité et un selfie.");
      return;
    }
    setChargement(true);
    try {
      await uploaderKYC(rectoUri, selfieUri);
      const reponse = await verifierKYC();
      setResultat(reponse);
    } catch {
      Alert.alert('Erreur', 'La vérification a échoué. Réessayez plus tard.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Vérification d'identité (KYC)</Text>
      <Text style={styles.sousTitre}>
        Ajoutez votre pièce d'identité et un selfie pour être vérifié et gagner la confiance des clients.
      </Text>

      <View style={styles.rangeePhotos}>
        <TouchableOpacity style={styles.zonePhoto} onPress={async () => setRectoUri(await choisirImage())}>
          <Ionicons name={rectoUri ? 'checkmark-circle' : 'card-outline'} size={28} color={rectoUri ? couleurs.secondaire : couleurs.neutre} />
          <Text style={styles.zonePhotoTexte}>{rectoUri ? 'Pièce ajoutée' : "Pièce d'identité"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.zonePhoto} onPress={async () => setSelfieUri(await choisirImage())}>
          <Ionicons name={selfieUri ? 'checkmark-circle' : 'person-circle-outline'} size={28} color={selfieUri ? couleurs.secondaire : couleurs.neutre} />
          <Text style={styles.zonePhotoTexte}>{selfieUri ? 'Selfie ajouté' : 'Selfie avec pièce'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={stylesPartages.boutonIA} onPress={handleVerifier} disabled={chargement}>
        {chargement ? (
          <ActivityIndicator size="small" color={couleurs.blanc} />
        ) : (
          <>
            <Ionicons name="shield-checkmark" size={16} color={couleurs.blanc} />
            <Text style={stylesPartages.boutonIATexte}>Lancer la vérification IA</Text>
          </>
        )}
      </TouchableOpacity>

      {resultat && (
        <View style={styles.resultatConteneur}>
          <Text style={styles.resultatStatut}>
            Statut : {resultat.recommandation === 'approuver' ? '✅ Vérifié' : resultat.recommandation === 'rejeter' ? '❌ Rejeté' : '⏳ En attente de vérification manuelle'}
          </Text>
          <Text style={styles.resultatJustification}>{resultat.justification}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { width: '100%', marginBottom: espacements.md },
  titre: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.xs },
  sousTitre: { fontSize: 12, color: couleurs.neutre, marginBottom: espacements.sm, lineHeight: 16 },
  rangeePhotos: { flexDirection: 'row', gap: espacements.sm, marginBottom: espacements.sm },
  zonePhoto: {
    flex: 1, borderWidth: 1, borderColor: couleurs.bordure, borderStyle: 'dashed', borderRadius: rayons.moyen,
    padding: espacements.md, alignItems: 'center', backgroundColor: couleurs.blanc,
  },
  zonePhotoTexte: { fontSize: 11, color: couleurs.neutre, marginTop: espacements.xs, textAlign: 'center' },
  resultatConteneur: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginTop: espacements.sm },
  resultatStatut: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: 4 },
  resultatJustification: { fontSize: 12, color: couleurs.neutre, lineHeight: 16 },
});