import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import {
  recupererPrestatairesEnAttente, validerKYC,
  creerCategorie, supprimerCategorie,
  recupererLitiges, resoudreLitige,
} from '../services/admin';
import { recupererCategories } from '../services/annuaire';
import { Prestataire, Categorie, Litige } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const { deconnexion } = useAuth();
  const [enAttente, setEnAttente] = useState<Prestataire[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [litiges, setLitiges] = useState<Litige[]>([]);
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [chargement, setChargement] = useState(true);

  // États pour la modale de litige
  const [litigeSelectionne, setLitigeSelectionne] = useState<Litige | null>(null);
  const [typeSanction, setTypeSanction] = useState<'aucune' | 'suspension' | 'blocage'>('aucune');
  const [dureeJours, setDureeJours] = useState('7');
  const [commentaire, setCommentaire] = useState('');

  async function charger() {
    try {
      const [p, c, l] = await Promise.all([
        recupererPrestatairesEnAttente(),
        recupererCategories(),
        recupererLitiges('ouvert'),
      ]);
      setEnAttente(p);
      setCategories(c);
      setLitiges(l);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function handleValiderKYC(id: number, decision: 'verifie' | 'rejete') {
    try {
      await validerKYC(id, decision);
      setEnAttente((prev) => prev.filter((p) => p.id !== id));
    } catch {
      Alert.alert('Erreur', 'Action KYC impossible.');
    }
  }

  async function handleResoudreLitige() {
    if (!litigeSelectionne) return;
    try {
      await resoudreLitige(litigeSelectionne.id, {
        type_sanction: typeSanction,
        duree_jours: typeSanction === 'suspension' ? parseInt(dureeJours, 10) : null,
        commentaire_resolution: commentaire,
      });
      setLitiges((prev) => prev.filter((l) => l.id !== litigeSelectionne.id));
      setLitigeSelectionne(null);
      setCommentaire('');
      Alert.alert('Succès', 'Le litige a été traité.');
    } catch {
      Alert.alert('Erreur', 'Impossible de résoudre le litige.');
    }
  }

  async function handleAjouterCategorie() {
    if (!nouvelleCategorie.trim()) return;
    try {
      const cat = await creerCategorie(nouvelleCategorie);
      setCategories((prev) => [...prev, cat]);
      setNouvelleCategorie('');
    } catch {
      Alert.alert('Erreur', 'Impossible de créer la catégorie.');
    }
  }

  async function handleSupprimerCategorie(id: number) {
    try {
      await supprimerCategorie(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer la catégorie.');
    }
  }

  if (chargement) {
    return <View style={styles.centre}><ActivityIndicator size="large" color={couleurs.bleuBase} /></View>;
  }

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }}>
      <View style={styles.entete}>
        <Text style={styles.titre}>Administration</Text>
        <TouchableOpacity onPress={deconnexion}>
          <Ionicons name="log-out-outline" size={24} color="#DA1E28" />
        </TouchableOpacity>
      </View>

      {/* RACCOURCIS DE NAVIGATION VERS D'AUTRES ÉCRANS */}
      <Text style={styles.titreSection}>Gestion du système</Text>
      <View style={styles.grilleNavigation}>
        <TouchableOpacity 
          style={styles.carteNavigation} 
          onPress={() => navigation.navigate('AdminUtilisateurs')}
        >
          <Ionicons name="people-outline" size={24} color={couleurs.bleuBase} />
          <Text style={styles.texteNav}>Utilisateurs</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.carteNavigation} 
          onPress={() => navigation.navigate('AdminLitiges')}
        >
          <Ionicons name="warning-outline" size={24} color="#DA1E28" />
          <Text style={styles.texteNav}>Litiges</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.carteNavigation} 
          onPress={() => navigation.navigate('AdminKYC')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#24A148" />
          <Text style={styles.texteNav}>Vérifications KYC</Text>
        </TouchableOpacity>
      </View>

      {/* SECTION LITIGES */}
      <View style={styles.enteteSection}>
        <Text style={styles.titreSection}>Litiges & Signalements ({litiges.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminLitiges')}>
          <Text style={styles.lienVoirTout}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {litiges.length === 0 ? (
        <Text style={styles.vide}>Aucun litige ouvert.</Text>
      ) : (
        litiges.map((l) => (
          <View key={l.id} style={styles.carte}>
            <TouchableOpacity onPress={() => navigation.navigate('AdminUtilisateurDetail', { utilisateurId: l.utilisateur })}>
              <Text style={styles.nomCarteLien}>Mis en cause : {l.utilisateur_nom} ({l.utilisateur_role})</Text>
            </TouchableOpacity>
            <Text style={styles.souscarte}>Motif : {l.motif}</Text>
            <Text style={styles.souscarte}>Signalé par : {l.signale_par_nom || 'Anonyme'}</Text>
            <TouchableOpacity
              style={[styles.boutonAction, { backgroundColor: couleurs.bleuBase }]}
              onPress={() => { setLitigeSelectionne(l); setTypeSanction('aucune'); }}
            >
              <Text style={styles.boutonTexte}>Traiter le litige</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* SECTION KYC */}
      <View style={styles.enteteSection}>
        <Text style={styles.titreSection}>KYC en attente ({enAttente.length})</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AdminKYC')}>
          <Text style={styles.lienVoirTout}>Voir tout</Text>
        </TouchableOpacity>
      </View>

      {enAttente.length === 0 ? (
        <Text style={styles.vide}>Aucun dossier en attente.</Text>
      ) : (
        enAttente.map((p) => (
          <View key={p.id} style={styles.carte}>
            <TouchableOpacity onPress={() => navigation.navigate('AdminUtilisateurDetail', { utilisateurId: p.utilisateur.id })}>
              <Text style={styles.nomCarteLien}>{p.nom_entreprise || p.utilisateur.username}</Text>
            </TouchableOpacity>
            <Text style={styles.souscarte}>{p.utilisateur.telephone}</Text>
            <View style={styles.rangeeBoutons}>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#24A148' }]} onPress={() => handleValiderKYC(p.id, 'verifie')}>
                <Text style={styles.boutonPetitTexte}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#DA1E28' }]} onPress={() => handleValiderKYC(p.id, 'rejete')}>
                <Text style={styles.boutonPetitTexte}>Rejeter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {/* SECTION CATÉGORIES */}
      <Text style={styles.titreSection}>Catégories ({categories.length})</Text>
      <View style={styles.rangeeAjoutCategorie}>
        <TextInput
          style={styles.champ}
          placeholder="Nouvelle catégorie"
          value={nouvelleCategorie}
          onChangeText={setNouvelleCategorie}
        />
        <TouchableOpacity style={styles.boutonAjouter} onPress={handleAjouterCategorie}>
          <Ionicons name="add" size={22} color={couleurs.blanc} />
        </TouchableOpacity>
      </View>
      {categories.map((c) => (
        <View key={c.id} style={styles.ligneCategorie}>
          <Text style={styles.nomCarte}>{c.nom}</Text>
          <TouchableOpacity onPress={() => handleSupprimerCategorie(c.id)}>
            <Ionicons name="trash-outline" size={18} color="#DA1E28" />
          </TouchableOpacity>
        </View>
      ))}

      {/* MODALE DE RÉSOLUTION DE LITIGE */}
      <Modal visible={!!litigeSelectionne} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitre}>Décision pour le litige #{litigeSelectionne?.id}</Text>

            <Text style={styles.label}>Sanction :</Text>
            <View style={styles.rangeeChips}>
              {(['aucune', 'suspension', 'blocage'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, typeSanction === s && styles.chipActif]}
                  onPress={() => setTypeSanction(s)}
                >
                  <Text style={typeSanction === s ? styles.chipTexteActif : styles.chipTexte}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {typeSanction === 'suspension' && (
              <TextInput
                style={styles.champ}
                placeholder="Durée (en jours)"
                keyboardType="numeric"
                value={dureeJours}
                onChangeText={setDureeJours}
              />
            )}

            <TextInput
              style={[styles.champ, { height: 80, marginTop: espacements.xs }]}
              placeholder="Commentaire de résolution..."
              multiline
              value={commentaire}
              onChangeText={setCommentaire}
            />

            <View style={styles.rangeeBoutonsModal}>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#24A148' }]} onPress={handleResoudreLitige}>
                <Text style={styles.boutonPetitTexte}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#DA1E28' }]} onPress={() => setLitigeSelectionne(null)}>
                <Text style={styles.boutonPetitTexte}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 22, fontWeight: 'bold', color: couleurs.tertiaire },
  titreSection: { fontWeight: '600', fontSize: 16, color: couleurs.tertiaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  enteteSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  lienVoirTout: { color: couleurs.bleuBase, fontSize: 13, fontWeight: '600' },
  
  grilleNavigation: { flexDirection: 'row', gap: espacements.xs },
  carteNavigation: {
    flex: 1,
    backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen,
    padding: espacements.sm,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  texteNav: { fontSize: 11, fontWeight: '600', color: couleurs.tertiaire, marginTop: 4, textAlign: 'center' },

  vide: { color: couleurs.neutre, fontSize: 13 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.sm },
  nomCarte: { fontWeight: '600', color: couleurs.tertiaire },
  nomCarteLien: { fontWeight: '600', color: couleurs.bleuBase },
  souscarte: { fontSize: 12, color: couleurs.neutre, marginVertical: 2 },
  rangeeBoutons: { flexDirection: 'row', gap: espacements.xs, marginTop: espacements.xs },
  boutonAction: { paddingVertical: 8, borderRadius: rayons.moyen, alignItems: 'center', marginTop: espacements.xs },
  boutonTexte: { color: couleurs.blanc, fontSize: 12, fontWeight: '600' },
  boutonPetit: { flex: 1, borderRadius: rayons.moyen, paddingVertical: 10, alignItems: 'center' },
  boutonPetitTexte: { color: couleurs.blanc, fontSize: 12, fontWeight: '600' },
  rangeeAjoutCategorie: { flexDirection: 'row', gap: espacements.xs, marginBottom: espacements.sm },
  champ: { borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 10, backgroundColor: couleurs.blanc, flex: 1 },
  boutonAjouter: { backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen, width: 44, justifyContent: 'center', alignItems: 'center' },
  ligneCategorie: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: espacements.md },
  modalContent: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.md },
  modalTitre: { fontSize: 16, fontWeight: 'bold', color: couleurs.tertiaire, marginBottom: espacements.sm },
  label: { fontSize: 13, fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.xs },
  rangeeChips: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: espacements.sm },
  chip: { padding: 8, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, flex: 0.3, alignItems: 'center' },
  chipActif: { backgroundColor: couleurs.bleuBase, borderColor: couleurs.bleuBase },
  chipTexte: { color: couleurs.tertiaire, fontSize: 12 },
  chipTexteActif: { color: couleurs.blanc, fontSize: 12, fontWeight: 'bold' },
  rangeeBoutonsModal: { flexDirection: 'row', gap: espacements.xs, marginTop: espacements.md },
});