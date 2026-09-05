import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CartePublication from '../components/CartePublication';
import { recupererPublications } from '../services/publications';
import { Publication } from '../types';
import { couleurs } from '../theme/colors';
import { espacements } from '../theme/styles';

export default function AccueilScreen() {
  const [publications, setPublications] = useState<Publication[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);

  const charger = useCallback(async () => {
    try {
      const donnees = await recupererPublications();
      setPublications(donnees);
    } catch {
      // On pourrait afficher un message d'erreur ici plus tard
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  function handleRafraichir() {
    setRafraichissement(true);
    charger();
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Ionicons name="menu" size={24} color={couleurs.tertiaire} />
        <Text style={styles.titre}>ServConnect</Text>
        <View style={{ width: 4 }} />
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={publications}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => <CartePublication publication={item} />}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={handleRafraichir} colors={[couleurs.bleuBase]} />
          }
          ListEmptyComponent={
            <Text style={styles.vide}>Aucune publication pour le moment.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: espacements.md, paddingTop: espacements.xl, paddingBottom: espacements.sm,
    backgroundColor: couleurs.blanc, borderBottomWidth: 1, borderBottomColor: couleurs.bordure,
  },
  titre: { fontSize: 18, fontWeight: 'bold', color: couleurs.bleuBase },
  liste: { padding: espacements.md },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
});