import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { recupererPrestatairesEnAttente, validerKYC } from '../services/admin';
import { Prestataire } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function AdminKYCScreen({ navigation }: any) {
  const [enAttente, setEnAttente] = useState<Prestataire[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setEnAttente(await recupererPrestatairesEnAttente());
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function handleValider(id: number, decision: 'verifie' | 'rejete') {
    try {
      await validerKYC(id, decision);
      setEnAttente((prev) => prev.filter((p) => p.id !== id));
    } catch {
      Alert.alert('Erreur', 'Action impossible.');
    }
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Vérifications KYC ({enAttente.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={enAttente}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: espacements.md }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun dossier en attente.</Text>}
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <TouchableOpacity onPress={() => navigation.navigate('AdminUtilisateurDetail', { utilisateurId: item.utilisateur.id })}>
                <Text style={styles.nom}>{item.nom_entreprise || item.utilisateur.username}</Text>
              </TouchableOpacity>
              <Text style={styles.souscarte}>{item.utilisateur.telephone}</Text>
              <View style={styles.rangeeBoutons}>
                <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#24A148' }]} onPress={() => handleValider(item.id, 'verifie')}>
                  <Text style={styles.boutonPetitTexte}>Approuver</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#DA1E28' }]} onPress={() => handleValider(item.id, 'rejete')}>
                  <Text style={styles.boutonPetitTexte}>Rejeter</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: espacements.md, paddingTop: espacements.xl },
  titre: { fontSize: 16, fontWeight: '600', color: couleurs.tertiaire },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.sm },
  nom: { fontWeight: '600', color: couleurs.bleuBase },
  souscarte: { fontSize: 12, color: couleurs.neutre, marginBottom: espacements.xs },
  rangeeBoutons: { flexDirection: 'row', gap: espacements.xs },
  boutonPetit: { flex: 1, borderRadius: rayons.moyen, paddingVertical: 8, alignItems: 'center' },
  boutonPetitTexte: { color: couleurs.blanc, fontSize: 12, fontWeight: '600' },
});