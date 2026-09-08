import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererCommentaires, ajouterCommentaire, Commentaire } from '../services/publications';
import { Publication } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

const IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80';

export default function PublicationDetailScreen({ route, navigation }: any) {
  const { publication }: { publication: Publication } = route.params;
  const [commentaires, setCommentaires] = useState<Commentaire[]>([]);
  const [nouveauCommentaire, setNouveauCommentaire] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setCommentaires(await recupererCommentaires(publication.id));
      } finally {
        setChargement(false);
      }
    })();
  }, [publication.id]);

  async function handleEnvoyer() {
    if (!nouveauCommentaire.trim()) return;
    setEnvoiEnCours(true);
    const contenu = nouveauCommentaire;
    setNouveauCommentaire('');
    try {
      const commentaire = await ajouterCommentaire(publication.id, contenu);
      setCommentaires((precedent) => [...precedent, commentaire]);
    } catch {
      setNouveauCommentaire(contenu);
    } finally {
      setEnvoiEnCours(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={80}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: espacements.sm }}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Publication</Text>
      </View>

      <FlatList
        data={commentaires}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          <View style={styles.entetePublication}>
            <Text style={styles.nomPrestataire}>{publication.prestataire_nom || 'Prestataire'}</Text>
            <Image source={{ uri: publication.image || IMAGE_PLACEHOLDER }} style={styles.image} />
            <Text style={styles.contenu}>{publication.contenu}</Text>
            <Text style={styles.sousTitreCommentaires}>
              {commentaires.length} commentaire{commentaires.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.carteCommentaire}>
            <Text style={styles.auteurCommentaire}>{item.auteur_nom}</Text>
            <Text style={styles.texteCommentaire}>{item.contenu}</Text>
          </View>
        )}
        ListEmptyComponent={
          !chargement ? <Text style={styles.vide}>Aucun commentaire pour le moment.</Text> : null
        }
        ListFooterComponent={chargement ? <ActivityIndicator style={{ marginTop: espacements.md }} color={couleurs.bleuBase} /> : null}
        contentContainerStyle={styles.liste}
      />

      <View style={styles.zoneSaisie}>
        <TextInput
          style={styles.champ}
          placeholder="Ajouter un commentaire..."
          placeholderTextColor={couleurs.neutre}
          value={nouveauCommentaire}
          onChangeText={setNouveauCommentaire}
        />
        <TouchableOpacity style={styles.boutonEnvoyer} onPress={handleEnvoyer} disabled={envoiEnCours}>
          {envoiEnCours ? <ActivityIndicator size="small" color={couleurs.blanc} /> : <Ionicons name="send" size={18} color={couleurs.blanc} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row', alignItems: 'center', padding: espacements.md, paddingTop: espacements.xl,
    backgroundColor: couleurs.blanc, borderBottomWidth: 1, borderBottomColor: couleurs.bordure,
  },
  titre: { fontSize: 16, fontWeight: '600', color: couleurs.tertiaire },
  liste: { padding: espacements.md },

  entetePublication: { marginBottom: espacements.md },
  nomPrestataire: { fontWeight: '600', color: couleurs.tertiaire, marginBottom: espacements.sm },
  image: { width: '100%', height: 200, borderRadius: rayons.moyen, backgroundColor: couleurs.bordure, marginBottom: espacements.sm },
  contenu: { fontSize: 14, color: couleurs.tertiaire, marginBottom: espacements.sm, lineHeight: 20 },
  sousTitreCommentaires: { fontWeight: '600', color: couleurs.tertiaire, marginTop: espacements.sm },

  carteCommentaire: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs },
  auteurCommentaire: { fontWeight: '600', fontSize: 13, color: couleurs.tertiaire },
  texteCommentaire: { fontSize: 13, color: couleurs.neutre },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.lg },

  zoneSaisie: {
    flexDirection: 'row', alignItems: 'center', padding: espacements.sm,
    backgroundColor: couleurs.blanc, borderTopWidth: 1, borderTopColor: couleurs.bordure, gap: espacements.xs,
  },
  champ: {
    flex: 1, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.grand,
    paddingHorizontal: espacements.sm, paddingVertical: 10, fontSize: 14, backgroundColor: couleurs.fond,
  },
  boutonEnvoyer: {
    backgroundColor: couleurs.bleuBase, borderRadius: rayons.rond,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
});