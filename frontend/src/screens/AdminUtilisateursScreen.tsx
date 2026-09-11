import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererUtilisateursAdmin, UtilisateurAdmin } from '../services/admin';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function AdminUtilisateursScreen({ navigation }: any) {
  const [utilisateurs, setUtilisateurs] = useState<UtilisateurAdmin[]>([]);
  const [filtreRole, setFiltreRole] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [chargement, setChargement] = useState(true);

  async function charger() {
    setChargement(true);
    try {
      setUtilisateurs(await recupererUtilisateursAdmin(filtreRole || undefined, recherche || undefined));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [filtreRole]);

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Utilisateurs</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.barreRecherche}>
        <TextInput
          style={styles.champRecherche}
          placeholder="Rechercher un identifiant..."
          value={recherche}
          onChangeText={setRecherche}
          onSubmitEditing={charger}
        />
      </View>

      <View style={styles.rangeeFiltres}>
        {[{ v: null, l: 'Tous' }, { v: 'client', l: 'Clients' }, { v: 'prestataire', l: 'Prestataires' }].map((f) => (
          <TouchableOpacity
            key={f.l}
            style={[stylesPartages.pilleCategorie, filtreRole === f.v && stylesPartages.pilleCategorieActive]}
            onPress={() => setFiltreRole(f.v)}
          >
            <Text style={{ color: filtreRole === f.v ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>{f.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={utilisateurs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: espacements.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.carte}
              onPress={() => navigation.navigate('AdminUtilisateurDetail', { utilisateurId: item.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.nom}>{item.username}</Text>
                <Text style={styles.sousTexte}>{item.role} · {item.telephone}</Text>
              </View>
              {item.est_bloque && <View style={[styles.badge, { backgroundColor: '#DA1E28' }]}><Text style={styles.badgeTexte}>Bloqué</Text></View>}
              {item.est_suspendu && !item.est_bloque && <View style={[styles.badge, { backgroundColor: '#F1C21B' }]}><Text style={styles.badgeTexte}>Suspendu</Text></View>}
              <Ionicons name="chevron-forward" size={18} color={couleurs.neutre} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: espacements.md, paddingTop: espacements.xl,
  },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  barreRecherche: { paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  champRecherche: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 10, backgroundColor: couleurs.blanc },
  rangeeFiltres: { flexDirection: 'row', gap: espacements.xs, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs, gap: espacements.xs,
  },
  nom: { fontWeight: '600', color: couleurs.tertiaire },
  sousTexte: { fontSize: 12, color: couleurs.neutre },
  badge: { borderRadius: rayons.rond, paddingVertical: 3, paddingHorizontal: 8 },
  badgeTexte: { color: couleurs.blanc, fontSize: 10, fontWeight: '600' },
});