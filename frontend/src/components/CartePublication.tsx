import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Publication } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import { basculerLike } from '../services/publications';

const IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&q=80';

export default function CartePublication({ publication }: { publication: Publication }) {
  const [aime, setAime] = useState(publication.jaime_deja);
  const [nombreLikes, setNombreLikes] = useState(publication.nombre_likes);

  async function handleLike() {
    // Mise a jour optimiste : on change l'affichage immediatement, sans attendre le serveur
    setAime(!aime);
    setNombreLikes(nombreLikes + (aime ? -1 : 1));
    try {
      const resultat = await basculerLike(publication.id);
      setAime(resultat.aime);
      setNombreLikes(resultat.nombre_likes);
    } catch {
      // en cas d'echec, on annule le changement optimiste
      setAime(aime);
      setNombreLikes(nombreLikes);
    }
  }

  const note = parseFloat(publication.prestataire_note || '0');

  return (
    <View style={stylesPartages.carte}>
      <View style={styles.entete}>
        <Image
          source={{ uri: publication.prestataire_avatar || IMAGE_PLACEHOLDER }}
          style={styles.avatar}
        />
        <Text style={styles.nomPrestataire}>{publication.prestataire_nom || 'Prestataire'}</Text>
      </View>

      <View style={styles.imageConteneur}>
        <Image
          source={{ uri: publication.image || IMAGE_PLACEHOLDER }}
          style={styles.image}
        />
        {note > 0 && (
          <View style={stylesPartages.badgeNote}>
            <Ionicons name="star" size={12} color={couleurs.etoile} />
            <Text style={stylesPartages.badgeNoteTexte}>{note.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <View style={styles.rangeeActions}>
        <TouchableOpacity style={styles.action} onPress={handleLike}>
          <Ionicons name={aime ? 'heart' : 'heart-outline'} size={20} color={aime ? '#DA1E28' : couleurs.neutre} />
          <Text style={styles.actionTexte}>{nombreLikes}</Text>
        </TouchableOpacity>
        <View style={styles.action}>
          <Ionicons name="chatbubble-outline" size={18} color={couleurs.neutre} />
          <Text style={styles.actionTexte}>{publication.nombre_commentaires}</Text>
        </View>
      </View>

      <Text style={styles.contenu} numberOfLines={4}>{publication.contenu}</Text>

      <TouchableOpacity style={styles.boutonProfil}>
        <Text style={styles.boutonProfilTexte}>Voir le profil</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center', marginBottom: espacements.sm },
  avatar: { width: 36, height: 36, borderRadius: rayons.rond, marginRight: espacements.sm, backgroundColor: couleurs.bordure },
  nomPrestataire: { fontWeight: '600', color: couleurs.tertiaire, fontSize: 14 },

  imageConteneur: { position: 'relative', marginBottom: espacements.sm },
  image: { width: '100%', height: 180, borderRadius: rayons.moyen, backgroundColor: couleurs.bordure },

  rangeeActions: { flexDirection: 'row', gap: espacements.md, marginBottom: espacements.xs },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionTexte: { fontSize: 13, color: couleurs.neutre },

  contenu: { fontSize: 13, color: couleurs.tertiaire, lineHeight: 18, marginBottom: espacements.sm },

  boutonProfil: {
    backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen,
    paddingVertical: 10, alignItems: 'center',
  },
  boutonProfilTexte: { color: couleurs.blanc, fontWeight: '600', fontSize: 13 },
});