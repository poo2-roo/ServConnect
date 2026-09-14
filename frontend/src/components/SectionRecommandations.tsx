import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { recupererRecommandations, Recommandation } from '../services/annuaire';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function SectionRecommandations() {
  const [recommandations, setRecommandations] = useState<Recommandation[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setChargement(false); return; }
        const position = await Location.getCurrentPositionAsync({});
        const resultat = await recupererRecommandations(position.coords.latitude, position.coords.longitude);
        setRecommandations(resultat);
      } catch {
        // silencieux : recommandation optionnelle, ne bloque pas l'ecran
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  if (chargement) {
    return <ActivityIndicator style={{ marginVertical: espacements.md }} color={couleurs.bleuBase} />;
  }

  if (recommandations.length === 0) return null;

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <Ionicons name="sparkles" size={16} color={couleurs.secondaire} />
        <Text style={styles.titre}>Recommandé pour vous</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {recommandations.map((r) => (
          <TouchableOpacity key={r.service_id} style={styles.carte}>
            <Text style={styles.titreService} numberOfLines={2}>{r.titre}</Text>
            <Text style={styles.prix}>{r.prix_min} FCFA</Text>
            <Text style={styles.distance}>{r.distance_km} km</Text>
            <Text style={styles.raison} numberOfLines={2}>{r.raison}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { marginBottom: espacements.md },
  entete: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  titre: { fontWeight: '600', color: couleurs.tertiaire },
  carte: {
    width: 160, backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm,
    marginLeft: espacements.md, borderWidth: 1, borderColor: couleurs.secondaire,
  },
  titreService: { fontWeight: '600', fontSize: 13, color: couleurs.tertiaire, marginBottom: 4 },
  prix: { fontSize: 13, color: couleurs.bleuBase, fontWeight: '600' },
  distance: { fontSize: 11, color: couleurs.neutre, marginBottom: 4 },
  raison: { fontSize: 10, color: couleurs.neutre, fontStyle: 'italic' },
});