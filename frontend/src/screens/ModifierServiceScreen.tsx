import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { modifierService } from '../services/servicesPrestataire';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function ModifierServiceScreen({ route, navigation }: any) {
  const { service } = route.params;
  const [titre, setTitre] = useState(service.titre);
  const [description, setDescription] = useState(service.description);
  const [prixMin, setPrixMin] = useState(String(service.prix_min));
  const [estActif, setEstActif] = useState(service.est_actif);
  const [enregistrement, setEnregistrement] = useState(false);

  async function handleEnregistrer() {
    setEnregistrement(true);
    try {
      await modifierService(service.id, {
        titre, description, prix_min: parseInt(prixMin, 10), est_actif: estActif,
      });
      Alert.alert('Enregistré', 'Le service a été mis à jour.');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Mise à jour impossible.');
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }} keyboardShouldPersistTaps="handled">
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Modifier le service</Text>
        <View style={{ width: 24 }} />
      </View>

      <TextInput style={styles.champ} value={titre} onChangeText={setTitre} placeholder="Titre" />
      <TextInput style={[styles.champ, { height: 80 }]} value={description} onChangeText={setDescription} placeholder="Description" multiline />
      <TextInput style={styles.champ} value={prixMin} onChangeText={setPrixMin} placeholder="Prix (FCFA)" keyboardType="numeric" />

      <TouchableOpacity style={styles.rangeeActif} onPress={() => setEstActif(!estActif)}>
        <Ionicons name={estActif ? 'checkbox' : 'square-outline'} size={22} color={couleurs.bleuBase} />
        <Text style={styles.texteActif}>Service actif (visible par les clients)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleEnregistrer} disabled={enregistrement}>
        {enregistrement ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Enregistrer</Text>}
      </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 12, marginBottom: espacements.sm, backgroundColor: couleurs.blanc },
  rangeeActif: { flexDirection: 'row', alignItems: 'center', gap: espacements.xs, marginBottom: espacements.md },
  texteActif: { color: couleurs.tertiaire, fontSize: 13 },
});