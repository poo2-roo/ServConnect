import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartePrestataire from '../components/CartePrestataire';
import { recupererCategories, recupererPrestataires } from '../services/annuaire';
import { Categorie, Prestataire } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function RechercherScreen() {
  const [recherche, setRecherche] = useState('');
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [categorieActive, setCategorieActive] = useState<number | null>(null);
  const [prestataires, setPrestataires] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [cat, prest] = await Promise.all([recupererCategories(), recupererPrestataires()]);
        setCategories(cat);
        setPrestataires(prest);
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const prestatairesFiltres = prestataires.filter((p) => {
    const correspondRecherche = recherche === '' ||
      p.nom_entreprise.toLowerCase().includes(recherche.toLowerCase());
    return correspondRecherche;
  });

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
          renderItem={({ item }) => <CartePrestataire prestataire={item} />}
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
  champRecherche: { flex: 1, padding: 10, marginLeft: espacements.xs, fontSize: 14 },
  sousTitre: { fontWeight: '600', color: couleurs.tertiaire, marginHorizontal: espacements.md, marginBottom: espacements.sm },
  listeCategories: { paddingHorizontal: espacements.md, gap: espacements.xs, marginBottom: espacements.md },
  listePrestataires: { padding: espacements.md, paddingTop: 0 },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
});