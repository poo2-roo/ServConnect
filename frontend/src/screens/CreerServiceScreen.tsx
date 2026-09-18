import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererCategories } from '../services/annuaire';
import { creerService, optimiserPrixService } from '../services/servicesPrestataire';
import { Categorie } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function CreerServiceScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieId, setCategorieId] = useState<number | null>(null);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prixMin, setPrixMin] = useState('');
  const [chargementPublication, setChargementPublication] = useState(false);
  const [chargementOptimisation, setChargementOptimisation] = useState(false);
  const [suggestionPrix, setSuggestionPrix] = useState<any>(null);
  const [serviceCreeId, setServiceCreeId] = useState<number | null>(null);

  useEffect(() => {
    recupererCategories().then(setCategories);
  }, []);

  async function handleCreerService() {
    if (!categorieId || !titre.trim() || !prixMin.trim()) {
      Alert.alert('Champs manquants', 'Merci de remplir la catégorie, le titre et le prix.');
      return;
    }
    setChargementPublication(true);
    try {
      const service = await creerService({
        categorie: categorieId, titre, description, prix_min: parseInt(prixMin, 10),
      });
      setServiceCreeId(service.id);
      Alert.alert('Service publié !', 'Vous pouvez maintenant demander une suggestion de prix IA.');
    } catch (erreur: any) {
      Alert.alert('Erreur', erreur?.response?.data ? JSON.stringify(erreur.response.data) : 'Publication impossible.');
    } finally {
      setChargementPublication(false);
    }
  }

  async function handleOptimiserPrix() {
    if (!serviceCreeId) {
      Alert.alert('Publiez d\'abord', 'Créez le service avant de demander une suggestion de prix.');
      return;
    }
    setChargementOptimisation(true);
    try {
      const resultat = await optimiserPrixService(serviceCreeId);
      setSuggestionPrix(resultat);
    } catch {
      Alert.alert('Erreur', "Impossible d'obtenir une suggestion de prix pour le moment.");
    } finally {
      setChargementOptimisation(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }}>
        <View style={styles.entete}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
          </TouchableOpacity>
          <Text style={styles.titre}>Nouveau service</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.label}>Catégorie</Text>
        <View style={styles.rangeeCategories}>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[stylesPartages.pilleCategorie, categorieId === c.id && stylesPartages.pilleCategorieActive]}
              onPress={() => setCategorieId(c.id)}
            >
              <Text style={{ color: categorieId === c.id ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>{c.nom}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.champ} placeholder="Titre du service" value={titre} onChangeText={setTitre} />
        <TextInput style={[styles.champ, { height: 80 }]} placeholder="Description" value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.champ} placeholder="Prix (FCFA)" value={prixMin} onChangeText={setPrixMin} keyboardType="numeric" />

        {!serviceCreeId ? (
          <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleCreerService} disabled={chargementPublication}>
            {chargementPublication ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Publier le service</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={stylesPartages.boutonIA} onPress={handleOptimiserPrix} disabled={chargementOptimisation}>
              {chargementOptimisation ? (
                <ActivityIndicator size="small" color={couleurs.blanc} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={couleurs.blanc} />
                  <Text style={stylesPartages.boutonIATexte}>Suggérer un prix par IA</Text>
                </>
              )}
            </TouchableOpacity>

            {suggestionPrix && (
              <View style={styles.blocSuggestion}>
                <Text style={styles.prixSuggere}>{suggestionPrix.prix_suggere} FCFA</Text>
                <Text style={styles.fourchette}>
                  Fourchette : {suggestionPrix.fourchette_basse} — {suggestionPrix.fourchette_haute} FCFA
                </Text>
                <Text style={styles.justification}>{suggestionPrix.justification}</Text>
                <Text style={styles.confiance}>Confiance : {Math.round(suggestionPrix.confiance * 100)}%</Text>
              </View>
            )}

            <TouchableOpacity style={[stylesPartages.boutonContour, { marginTop: espacements.md }]} onPress={() => navigation.goBack()}>
              <Text style={stylesPartages.boutonContourTexte}>Terminer</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  label: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.xs },
  rangeeCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginBottom: espacements.md },
  champ: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: 12, marginBottom: espacements.sm, fontSize: 14, backgroundColor: couleurs.blanc,
  },
  blocSuggestion: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginTop: espacements.sm, borderWidth: 1, borderColor: couleurs.secondaire },
  prixSuggere: { fontSize: 22, fontWeight: 'bold', color: couleurs.bleuBase },
  fourchette: { fontSize: 13, color: couleurs.tertiaire, marginBottom: espacements.xs },
  justification: { fontSize: 12, color: couleurs.neutre, marginBottom: espacements.xs },
  confiance: { fontSize: 11, color: couleurs.secondaire, fontWeight: '600' },
});