import React, { useState, useCallback } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Conversation } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function ConversationsListeScreen({ navigation }: any) {
  const { utilisateur } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(false);

  const charger = useCallback(async () => {
    try {
      const reponse = await api.get<{ results?: Conversation[] } | Conversation[]>('/api/messaging/conversations/');
      const donnees = Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
      setConversations(
        [...donnees].sort(
          (conversationA, conversationB) =>
            new Date(conversationB.derniere_activite).getTime() -
            new Date(conversationA.derniere_activite).getTime()
        )
      );
    } finally {
      setChargement(false);
      setRafraichissement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  function handleOuvrir(conversation: Conversation) {
    const estPrestataire = utilisateur?.role === 'prestataire';
    const nomInterlocuteur = estPrestataire
      ? conversation.client_nom
        || (conversation.prestataire_initiateur === utilisateur.id
          ? conversation.prestataire_nom
          : conversation.prestataire_initiateur_nom)
      : conversation.prestataire_nom;
    navigation.navigate('Conversation', {
      conversationId: conversation.id,
      nomInterlocuteur: nomInterlocuteur || 'Utilisateur',
    });
  }

  return (
    <View style={styles.conteneur}>
      <Text style={styles.titre}>Messages</Text>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.liste}
          refreshControl={
            <RefreshControl refreshing={rafraichissement} onRefresh={() => { setRafraichissement(true); charger(); }} colors={[couleurs.bleuBase]} />
          }
          renderItem={({ item }) => {
            const estPrestataire = utilisateur?.role === 'prestataire';
            const conversationEntrePrestataires = estPrestataire && !item.client;
            const interlocuteurEstInitiateur = conversationEntrePrestataires
              && item.prestataire_initiateur !== utilisateur.id;
            const nom = estPrestataire
              ? item.client_nom
                || (interlocuteurEstInitiateur ? item.prestataire_initiateur_nom : item.prestataire_nom)
              : item.prestataire_nom;
            const avatar = estPrestataire
              ? item.client_avatar
                || (interlocuteurEstInitiateur ? item.prestataire_initiateur_avatar : item.prestataire_avatar)
              : item.prestataire_avatar;
            return (
              <TouchableOpacity style={styles.carte} onPress={() => handleOuvrir(item)}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={20} color={couleurs.neutre} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.nom}>{nom || 'Utilisateur'}</Text>
                  <Text style={styles.derniereActivite}>
                    {new Date(item.derniere_activite).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                {item.messages_non_lus > 0 && <View style={styles.pointNonLu} />}
                <Ionicons name="chevron-forward" size={18} color={couleurs.neutre} />
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={<Text style={styles.vide}>Aucune conversation pour le moment.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond, paddingTop: espacements.xl },
  titre: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  liste: { padding: espacements.md, paddingTop: 0 },
  carte: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs, gap: espacements.sm,
  },
  avatar: {
    width: 44, height: 44, borderRadius: rayons.rond, backgroundColor: couleurs.fond,
    justifyContent: 'center', alignItems: 'center',
  },
  nom: { fontWeight: '600', color: couleurs.tertiaire, fontSize: 14 },
  derniereActivite: { fontSize: 12, color: couleurs.neutre, marginTop: 2 },
  pointNonLu: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#D32F2F' },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
});