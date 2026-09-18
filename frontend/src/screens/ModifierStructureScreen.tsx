import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LocalisationScreen from './LocalisationScreen';
import { modifierInfosStructure, modifierPositionStructure } from '../services/localisationPrestataire';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function ModifierStructureScreen({ route, navigation }: any) {
  const { structure } = route.params;
  const [etape, setEtape] = useState<'infos' | 'carte'>('infos');
  const [nomStructure, setNomStructure] = useState(structure.properties?.nom_structure || '');
  const [quartier, setQuartier] = useState(structure.properties?.quartier || '');
  const [adresseTexte, setAdresseTexte] = useState(structure.properties?.adresse_texte || '');
  const [enregistrement, setEnregistrement] = useState(false);

  async function handleSauvegarderInfos() {
    if (!nomStructure.trim() || !quartier.trim() || !adresseTexte.trim()) {
      Alert.alert('Champs manquants', 'Merci de remplir tous les champs.');
      return;
    }
    setEnregistrement(true);
    try {
      await modifierInfosStructure(structure.id, {
        nom_structure: nomStructure, quartier, adresse_texte: adresseTexte,
      });
      Alert.alert('Enregistré', 'Les informations ont été mises à jour.');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Mise à jour impossible.');
    } finally {
      setEnregistrement(false);
    }
  }

  async function handleConfirmerPosition(latitude: number, longitude: number) {
    setEnregistrement(true);
    try {
      await modifierPositionStructure(structure.id, latitude, longitude);
      Alert.alert('Position mise à jour', 'La localisation a bien été modifiée.');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour la position.');
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }} keyboardShouldPersistTaps="handled">
        <View style={styles.entete}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
          </TouchableOpacity>
          <Text style={styles.titre}>Modifier la structure</Text>
          <View style={{ width: 24 }} />
        </View>

        <TextInput style={styles.champ} placeholder="Nom de la structure" placeholderTextColor={couleurs.neutre} value={nomStructure} onChangeText={setNomStructure} />
        <TextInput style={styles.champ} placeholder="Quartier" placeholderTextColor={couleurs.neutre} value={quartier} onChangeText={setQuartier} />
        <TextInput style={[styles.champ, { height: 80 }]} placeholder="Description de l'adresse" placeholderTextColor={couleurs.neutre} value={adresseTexte} onChangeText={setAdresseTexte} multiline />

        <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleSauvegarderInfos} disabled={enregistrement}>
          {enregistrement ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Enregistrer les informations</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[stylesPartages.boutonContour, { marginTop: espacements.sm }]} onPress={() => setEtape('carte')}>
          <Text style={stylesPartages.boutonContourTexte}>Modifier la position sur la carte</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond, padding: espacements.md, paddingTop: espacements.xl },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 12, marginBottom: espacements.sm, backgroundColor: couleurs.blanc },
});