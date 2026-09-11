import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererLitiges, resoudreLitige, Litige } from '../services/admin';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function AdminLitigesScreen({ navigation }: any) {
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [filtre, setFiltre] = useState<'ouvert' | 'resolu'>('ouvert');
  const [chargement, setChargement] = useState(true);
  const [litigeEnCours, setLitigeEnCours] = useState<number | null>(null);
  const [duree, setDuree] = useState('7');
  const [commentaire, setCommentaire] = useState('');

  async function charger() {
    setChargement(true);
    try {
      setLitiges(await recupererLitiges(filtre));
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [filtre]);

  async function handleResoudre(id: number, type: 'aucune' | 'suspension' | 'blocage') {
    try {
      await resoudreLitige(id, type, type === 'suspension' ? parseInt(duree, 10) : undefined, commentaire);
      Alert.alert('Litige résolu', 'La sanction a été appliquée.');
      setLitigeEnCours(null);
      setCommentaire('');
      charger();
    } catch {
      Alert.alert('Erreur', 'Impossible de résoudre le litige.');
    }
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Litiges</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.rangeeFiltres}>
        {[{ v: 'ouvert', l: 'Ouverts' }, { v: 'resolu', l: 'Résolus' }].map((f) => (
          <TouchableOpacity
            key={f.v}
            style={[stylesPartages.pilleCategorie, filtre === f.v && stylesPartages.pilleCategorieActive]}
            onPress={() => setFiltre(f.v as any)}
          >
            <Text style={{ color: filtre === f.v ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>{f.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={litiges}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: espacements.md }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun litige {filtre === 'ouvert' ? 'ouvert' : 'résolu'}.</Text>}
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <Text style={styles.nomUtilisateur}>{item.utilisateur_nom} ({item.utilisateur_role})</Text>
              <Text style={styles.motif}>{item.motif}</Text>
              <Text style={styles.date}>{new Date(item.date_creation).toLocaleDateString('fr-FR')}</Text>

              {item.statut === 'resolu' ? (
                <Text style={styles.statutResolu}>
                  Résolu — {item.type_sanction}{item.duree_jours ? ` (${item.duree_jours}j)` : ''}
                </Text>
              ) : litigeEnCours === item.id ? (
                <View>
                  <TextInput
                    style={styles.champ}
                    placeholder="Durée en jours (si suspension)"
                    value={duree}
                    onChangeText={setDuree}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={styles.champ}
                    placeholder="Commentaire de résolution (optionnel)"
                    value={commentaire}
                    onChangeText={setCommentaire}
                  />
                  <View style={styles.rangeeBoutonsSanction}>
                    <TouchableOpacity style={[styles.boutonSanction, { backgroundColor: '#24A148' }]} onPress={() => handleResoudre(item.id, 'aucune')}>
                      <Text style={styles.boutonSanctionTexte}>Classer sans suite</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.boutonSanction, { backgroundColor: '#F1C21B' }]} onPress={() => handleResoudre(item.id, 'suspension')}>
                      <Text style={styles.boutonSanctionTexte}>Suspendre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.boutonSanction, { backgroundColor: '#DA1E28' }]} onPress={() => handleResoudre(item.id, 'blocage')}>
                      <Text style={styles.boutonSanctionTexte}>Bloquer définitivement</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={stylesPartages.boutonContour} onPress={() => setLitigeEnCours(item.id)}>
                  <Text style={stylesPartages.boutonContourTexte}>Traiter ce litige</Text>
                </TouchableOpacity>
              )}
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
  rangeeFiltres: { flexDirection: 'row', gap: espacements.xs, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.sm },
  nomUtilisateur: { fontWeight: '600', color: couleurs.tertiaire },
  motif: { fontSize: 13, color: couleurs.tertiaire, marginVertical: 4 },
  date: { fontSize: 11, color: couleurs.neutre, marginBottom: espacements.xs },
  statutResolu: { fontSize: 12, color: '#24A148', fontWeight: '600' },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 8, marginBottom: espacements.xs, backgroundColor: couleurs.fond },
  rangeeBoutonsSanction: { gap: espacements.xs },
  boutonSanction: { borderRadius: rayons.moyen, paddingVertical: 10, alignItems: 'center', marginBottom: 4 },
  boutonSanctionTexte: { color: couleurs.blanc, fontWeight: '600', fontSize: 13 },
});