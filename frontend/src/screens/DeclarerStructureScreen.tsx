import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import LocalisationScreen from './LocalisationScreen';
import { creerLocalisationPrestataire } from '../services/localisationPrestataire';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function DeclarerStructureScreen({ navigation }: any) {
  const [etape, setEtape] = useState<'infos' | 'carte'>('infos');
  const [nomStructure, setNomStructure] = useState('');
  const [quartier, setQuartier] = useState('');
  const [adresseTexte, setAdresseTexte] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);

  function handleContinuer() {
    if (!nomStructure.trim() || !quartier.trim() || !adresseTexte.trim()) {
      Alert.alert('Champs manquants', 'Merci de remplir le nom, le quartier et la description de l\'adresse.');
      return;
    }
    setEtape('carte');
  }

  async function handleConfirmerPosition(latitude: number, longitude: number) {
    setEnregistrement(true);
    try {
      await creerLocalisationPrestataire({
        latitude, longitude, nom_structure: nomStructure, type_structure: 'atelier',
        adresse_texte: adresseTexte, quartier, ville: 'douala',
      });
      Alert.alert('Structure enregistrée !', 'Votre position est maintenant visible pour les clients.');
      navigation.goBack();
      
    } catch (erreur: any) {
      console.log('Erreur structure:', JSON.stringify(erreur?.response?.data || erreur?.message));
      Alert.alert(
        `Erreur (statut: ${erreur?.response?.status || 'aucun'})`,
        erreur?.response?.data ? JSON.stringify(erreur.response.data) : erreur?.message || 'Erreur inconnue'
      );
    } finally {
      setEnregistrement(false);
    }
  }

  if (etape === 'carte') {
    return enregistrement ? (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={couleurs.bleuBase} />
      </View>
    ) : (
      <LocalisationScreen onConfirmer={handleConfirmerPosition} onRetour={() => setEtape('infos')} />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }} keyboardShouldPersistTaps="handled">
        <Text style={styles.titre}>Déclarer ma structure</Text>
        <TextInput style={styles.champ} placeholder="Nom de la structure (ex: Atelier Jean)" placeholderTextColor={couleurs.neutre} value={nomStructure} onChangeText={setNomStructure} />
        <TextInput style={styles.champ} placeholder="Quartier" placeholderTextColor={couleurs.neutre} value={quartier} onChangeText={setQuartier} />
        <TextInput style={styles.champ} placeholder="Description de l'adresse" placeholderTextColor={couleurs.neutre} value={adresseTexte} onChangeText={setAdresseTexte} multiline />
        <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleContinuer}>
          <Text style={stylesPartages.boutonPrincipalTexte}>Continuer vers la carte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond, padding: espacements.md, paddingTop: espacements.xl },
  titre: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire, marginBottom: espacements.md },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 12, marginBottom: espacements.sm, backgroundColor: couleurs.blanc },
});