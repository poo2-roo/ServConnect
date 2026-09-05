import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Prestataire } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80';

export default function CartePrestataire({ prestataire }: { prestataire: Prestataire }) {
  const note = parseFloat(prestataire.note_moyenne || '0');

  return (
    <View style={styles.carte}>
      <Image
        source={{ uri: prestataire.utilisateur.photo_profil || AVATAR_PLACEHOLDER }}
        style={styles.avatar}
      />

      <View style={styles.infos}>
        <Text style={styles.nom}>
          {prestataire.nom_entreprise || `${prestataire.utilisateur.first_name} ${prestataire.utilisateur.last_name}`}
        </Text>
        <View style={styles.ligneNote}>
          <Ionicons name="star" size={13} color={couleurs.etoile} />
          <Text style={styles.noteTexte}>{note.toFixed(1)}</Text>
          <Text style={styles.nombreAvis}>({prestataire.nombre_avis})</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={stylesPartages.boutonContour}>
          <Text style={stylesPartages.boutonContourTexte}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.boutonProfil}>
          <Text style={styles.boutonProfilTexte}>Voir le profil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc,
    borderRadius: rayons.grand, padding: espacements.sm, marginBottom: espacements.sm,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05,
    shadowRadius: 4, elevation: 1,
  },
  avatar: { width: 48, height: 48, borderRadius: rayons.rond, backgroundColor: couleurs.bordure },
  infos: { flex: 1, marginLeft: espacements.sm },
  nom: { fontWeight: '600', color: couleurs.tertiaire, fontSize: 14, marginBottom: 2 },
  ligneNote: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  noteTexte: { fontSize: 12, color: couleurs.tertiaire, fontWeight: '600' },
  nombreAvis: { fontSize: 11, color: couleurs.neutre },
  actions: { alignItems: 'flex-end', gap: 6 },
  boutonProfil: { backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen, paddingVertical: 6, paddingHorizontal: 12 },
  boutonProfilTexte: { color: couleurs.blanc, fontSize: 11, fontWeight: '600' },
});