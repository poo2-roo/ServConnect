import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { recupererPrestatairesEnAttente, validerKYC, creerCategorie, supprimerCategorie } from '../services/admin';
import { recupererCategories } from '../services/annuaire';
import { Prestataire, Categorie } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function AdminDashboardScreen() {
  const { deconnexion } = useAuth();
  const [enAttente, setEnAttente] = useState<Prestataire[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [nouvelleCategorie, setNouvelleCategorie] = useState('');
  const [chargement, setChargement] = useState(true);

  async function charger() {
    try {
      const [p, c] = await Promise.all([recupererPrestatairesEnAttente(), recupererCategories()]);
      setEnAttente(p);
      setCategories(c);
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, []);

  async function handleValider(id: number, decision: 'verifie' | 'rejete') {
    try {
      await validerKYC(id, decision);
      setEnAttente((prev) => prev.filter((p) => p.id !== id));
    } catch {
      Alert.alert('Erreur', 'Action impossible.');
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
      Alert.alert('Erreur', 'Impossible de supprimer (des services y sont peut-être liés).');
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

      <Text style={styles.titreSection}>KYC en attente ({enAttente.length})</Text>
      {enAttente.length === 0 ? (
        <Text style={styles.vide}>Aucun dossier en attente.</Text>
      ) : (
        enAttente.map((p) => (
          <View key={p.id} style={styles.carte}>
            <Text style={styles.nomCarte}>{p.nom_entreprise || p.utilisateur.username}</Text>
            <Text style={styles.souscarte}>{p.utilisateur.telephone}</Text>
            <View style={styles.rangeeBoutons}>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#24A148' }]} onPress={() => handleValider(p.id, 'verifie')}>
                <Text style={styles.boutonPetitTexte}>Approuver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.boutonPetit, { backgroundColor: '#DA1E28' }]} onPress={() => handleValider(p.id, 'rejete')}>
                <Text style={styles.boutonPetitTexte}>Rejeter</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 22, fontWeight: 'bold', color: couleurs.tertiaire },
  titreSection: { fontWeight: '600', fontSize: 16, color: couleurs.tertiaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  vide: { color: couleurs.neutre, fontSize: 13 },
  carte: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.sm },
  nomCarte: { fontWeight: '600', color: couleurs.tertiaire },
  souscarte: { fontSize: 12, color: couleurs.neutre, marginBottom: espacements.xs },
  rangeeBoutons: { flexDirection: 'row', gap: espacements.xs },
  boutonPetit: { flex: 1, borderRadius: rayons.moyen, paddingVertical: 8, alignItems: 'center' },
  boutonPetitTexte: { color: couleurs.blanc, fontSize: 12, fontWeight: '600' },
  rangeeAjoutCategorie: { flexDirection: 'row', gap: espacements.xs, marginBottom: espacements.sm },
  champ: { flex: 1, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen, padding: 10, backgroundColor: couleurs.blanc },
  boutonAjouter: { backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen, width: 44, justifyContent: 'center', alignItems: 'center' },
  ligneCategorie: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs,
  },
});