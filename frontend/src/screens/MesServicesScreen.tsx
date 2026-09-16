import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { recupererMesServices, supprimerService, ServicePrestataire } from '../services/servicesPrestataire';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function MesServicesScreen({ navigation }: any) {
  const [services, setServices] = useState<ServicePrestataire[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      setServices(await recupererMesServices());
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  function handleSupprimer(id: number) {
    Alert.alert('Confirmer', 'Supprimer définitivement ce service ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await supprimerService(id);
            setServices((prev) => prev.filter((s) => s.id !== id));
          } catch {
            Alert.alert('Erreur', 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Mes services</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreerService')}>
          <Ionicons name="add-circle-outline" size={26} color={couleurs.bleuBase} />
        </TouchableOpacity>
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: espacements.md }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun service publié.</Text>}
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{item.titre}</Text>
                <Text style={styles.sousTexte}>{item.prix_min} FCFA {!item.est_actif && '· Inactif'}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ModifierService', { service: item })}>
                <Ionicons name="create-outline" size={20} color={couleurs.bleuBase} style={{ marginRight: espacements.sm }} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleSupprimer(item.id)}>
                <Ionicons name="trash-outline" size={20} color="#DA1E28" />
              </TouchableOpacity>
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
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
  carte: { flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs },
  nom: { fontWeight: '600', color: couleurs.tertiaire },
  sousTexte: { fontSize: 12, color: couleurs.neutre },
});