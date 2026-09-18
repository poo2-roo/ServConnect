import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { recupererLitiges, resoudreLitige, Litige } from '../services/admin';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function AdminLitigesScreen({ navigation }: any) {
  const [onglet, setOnglet] = useState<'ouvert' | 'resolu'>('ouvert');
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [chargement, setChargement] = useState(true);
  const [litigeEnCours, setLitigeEnCours] = useState<number | null>(null);
  const [duree, setDuree] = useState('7');
  const [commentaire, setCommentaire] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setLitiges(await recupererLitiges(onglet));
    } finally {
      setChargement(false);
    }
  }, [onglet]);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  async function handleResoudre(id: number, type: 'aucune' | 'suspension' | 'blocage') {
    try {
      await resoudreLitige(id, {
        type_sanction: type,
        duree_jours: type === 'suspension' ? parseInt(duree, 10) : undefined,
        commentaire_resolution: commentaire,
      });
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

      <View style={styles.rangeeOnglets}>
        {[{ v: 'ouvert', l: 'Nouveaux' }, { v: 'resolu', l: 'Résolus' }].map((o) => (
          <TouchableOpacity
            key={o.v}
            style={[stylesPartages.pilleCategorie, onglet === o.v && stylesPartages.pilleCategorieActive]}
            onPress={() => setOnglet(o.v as any)}
          >
            <Text style={{ color: onglet === o.v ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>{o.l}</Text>
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
          ListEmptyComponent={<Text style={styles.vide}>Aucun litige {onglet === 'ouvert' ? 'nouveau' : 'résolu'}.</Text>}
          renderItem={({ item }) => (
            <View style={styles.carte}>
              <TouchableOpacity onPress={() => navigation.navigate('AdminUtilisateurDetail', { utilisateurId: item.utilisateur })}>
                <Text style={styles.nomUtilisateur}>{item.utilisateur_nom} ({item.utilisateur_role})</Text>
              </TouchableOpacity>
              <Text style={styles.motif}>{item.motif}</Text>
              <Text style={styles.meta}>
                Signalé par {item.signale_par_nom || 'un administrateur'} · {new Date(item.date_creation).toLocaleDateString('fr-FR')}
              </Text>

              {item.statut === 'resolu' ? (
                <View style={styles.blocResolu}>
                  <Text style={styles.statutResolu}>
                    {item.type_sanction === 'blocage' ? '🔴 Bloqué' : item.type_sanction === 'suspension' ? `🟡 Suspendu ${item.duree_jours}j` : '🟢 Classé sans suite'}
                  </Text>
                  {item.commentaire_resolution ? <Text style={styles.commentaireResolu}>{item.commentaire_resolution}</Text> : null}
                  <Text style={styles.meta}>Résolu le {new Date(item.date_resolution!).toLocaleDateString('fr-FR')}</Text>
                </View>
              ) : litigeEnCours === item.id ? (
                <View>
                  <TextInput style={styles.champ} placeholder="Durée en jours (si suspension)" value={duree} onChangeText={setDuree} keyboardType="numeric" />
                  <TextInput style={styles.champ} placeholder="Commentaire de résolution" value={commentaire} onChangeText={setCommentaire} />
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
  rangeeOnglets: { flexDirection: 'row', gap: espacements.xs, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
  carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.sm },
  nomUtilisateur: { fontWeight: '600', color: couleurs.bleuBase },
  motif: { fontSize: 13, color: couleurs.tertiaire, marginVertical: 4 },
  meta: { fontSize: 11, color: couleurs.neutre, marginBottom: espacements.xs },
  blocResolu: { backgroundColor: couleurs.fond, borderRadius: rayons.petit, padding: espacements.sm },
  statutResolu: { fontSize: 13, fontWeight: '600', color: couleurs.tertiaire, marginBottom: 4 },
  commentaireResolu: { fontSize: 12, color: couleurs.neutre, fontStyle: 'italic', marginBottom: 4 },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 8, marginBottom: espacements.xs, backgroundColor: couleurs.fond },
  rangeeBoutonsSanction: { gap: espacements.xs },
  boutonSanction: { borderRadius: rayons.moyen, paddingVertical: 10, alignItems: 'center', marginBottom: 4 },
  boutonSanctionTexte: { color: couleurs.blanc, fontWeight: '600', fontSize: 13 },
});