import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartePrestataire from '../components/CartePrestataire';
import { recupererCategories, recupererPrestataires } from '../services/annuaire';
import { Categorie, Prestataire } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import { creerConversation } from '../services/messagerie';

export default function RechercherScreen({ navigation, route }: any) {
  const [recherche, setRecherche] = useState('');
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieActive, setCategorieActive] = useState<number | null>(null);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState(true);

  // Synchronize suggested category from route params
  useEffect(() => {
    const suggestion = route?.params?.categorieSuggeree;
    if (suggestion) setCategorieActive(suggestion);
  }, [route?.params?.categorieSuggeree]);

  // Fetch initial data on mount
  useEffect(() => {
    (async () => {
      try {
        const [cat, prest] = await Promise.all([recupererCategories(), recupererPrestataires()]);
        setCategories(cat);
        setPrestataires(prest);
      } catch (err) {
        Alert.alert('Erreur', 'Impossible de charger les données.');
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const prestatairesFiltres = prestataires.filter((p) => {
    const correspondRecherche = recherche === '' ||
      p.nom_entreprise.toLowerCase().includes(recherche.toLowerCase());
    const correspondCategorie = categorieActive === null ||
      p.categories.some((c) => c.id === categorieActive);
    return correspondRecherche && correspondCategorie;
  });

  async function handleEnvoyerMessage(prestataire: Prestataire) {
    try {
      const conversation = await creerConversation(prestataire.id);
      navigation.navigate('Conversation', {
        conversationId: conversation.id,
        nomInterlocuteur: prestataire.nom_entreprise || 'Prestataire',
      });
    } catch {
      Alert.alert('Erreur', "Impossible de démarrer la conversation. Assurez-vous d'être connecté en tant que client.");
    }
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.barreRecherche}>
        <Ionicons name="search" size={18} color={couleurs.neutre} />
        <TextInput
          style={styles.champRecherche}
          placeholder="Rechercher un prestataire..."
          placeholderTextColor={couleurs.neutre}
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      <View style={styles.rangeeActionsRecherche}>
        <TouchableOpacity
          style={styles.boutonActionRecherche}
          onPress={() => navigation.navigate('CartePrestataires', { categorieId: categorieActive, recherche })}
        >
          <Ionicons name="map" size={16} color={couleurs.bleuBase} />
          <Text style={styles.boutonActionRechercheTexte}>Voir sur la carte</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.boutonActionRecherche, { backgroundColor: couleurs.secondaire }]}
          onPress={() => navigation.navigate('AssistantRecherche')}
        >
          <Ionicons name="sparkles" size={16} color={couleurs.blanc} />
          <Text style={[styles.boutonActionRechercheTexte, { color: couleurs.blanc }]}>Assistant IA</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sousTitre}>Parcourir les catégories</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listeCategories}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[stylesPartages.pilleCategorie, categorieActive === item.id && stylesPartages.pilleCategorieActive]}
            onPress={() => setCategorieActive(categorieActive === item.id ? null : item.id)}
          >
            <Text style={{ color: categorieActive === item.id ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>
              {item.nom}
            </Text>
          </TouchableOpacity>
        )}
      />

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={prestatairesFiltres}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <CartePrestataire
              prestataire={item}
              onVoirProfil={() => navigation.navigate('PrestataireDetail', { prestataireId: item.id })}
              onEnvoyerMessage={() => handleEnvoyerMessage(item)}
            />
          )}
          contentContainerStyle={styles.listePrestataires}
          ListEmptyComponent={<Text style={styles.vide}>Aucun prestataire trouvé.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond, paddingTop: espacements.xl },
  barreRecherche: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen, marginHorizontal: espacements.md, paddingHorizontal: espacements.sm,
    borderWidth: 1, borderColor: couleurs.bordure, marginBottom: espacements.md,
  },
  rangeeActionsRecherche: { flexDirection: 'row', gap: espacements.sm, paddingHorizontal: espacements.md, marginBottom: espacements.md },
  boutonActionRecherche: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1, borderColor: couleurs.bleuBase, borderRadius: rayons.moyen, paddingVertical: 10,
  },
  boutonActionRechercheTexte: { color: couleurs.bleuBase, fontWeight: '600', fontSize: 13 },
  champRecherche: { flex: 1, padding: 10, marginLeft: espacements.xs, fontSize: 14 },
  sousTitre: { fontWeight: '600', color: couleurs.tertiaire, marginHorizontal: espacements.md, marginBottom: espacements.sm },
  listeCategories: { paddingHorizontal: espacements.md, gap: espacements.xs, marginBottom: espacements.md },
  listePrestataires: { padding: espacements.md, paddingTop: 0 },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
});