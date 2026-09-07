import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererPrestataire, recupererAvisPrestataire, recupererServicesPrestataire } from '../services/prestataireDetail';
import { Prestataire, Avis, Service } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import { creerConversation } from '../services/messagerie';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80';

export default function PrestataireDetailScreen({ route, navigation }: any) {
  const { prestataireId } = route.params;
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [chargement, setChargement] = useState(true);
    const [creationConversation, setCreationConversation] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, s] = await Promise.all([
          recupererPrestataire(prestataireId),
          recupererAvisPrestataire(prestataireId),
          recupererServicesPrestataire(prestataireId),
        ]);
        setPrestataire(p);
        setAvis(a);
        setServices(s);
      } finally {
        setChargement(false);
      }
    })();
  }, [prestataireId]);

  if (chargement) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={couleurs.bleuBase} />
      </View>
    );
  }

  if (!prestataire) {
    return (
      <View style={styles.centre}>
        <Text style={{ color: couleurs.neutre }}>Prestataire introuvable.</Text>
      </View>
    );
  }

  async function handleEnvoyerMessage() {
    setCreationConversation(true);
    try {
      const conversation = await creerConversation(prestataireId);
      navigation.navigate('Conversation', {
        conversationId: conversation.id,
        nomInterlocuteur: prestataire?.nom_entreprise || 'Prestataire',
      });
    } catch (erreur: any) {
      Alert.alert(
        'Erreur',
        erreur?.response?.data ? JSON.stringify(erreur.response.data) : "Impossible de démarrer la conversation."
      );
    } finally {
      setCreationConversation(false);
    }
  }

  const note = parseFloat(prestataire.note_moyenne || '0');

  return (
    <ScrollView style={styles.conteneur} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.boutonRetour}>
        <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
      </TouchableOpacity>

      <Image source={{ uri: prestataire.utilisateur.photo_profil || AVATAR_PLACEHOLDER }} style={styles.avatar} />
      <Text style={styles.nom}>
        {prestataire.nom_entreprise || `${prestataire.utilisateur.first_name} ${prestataire.utilisateur.last_name}`}
      </Text>

      <View style={styles.ligneNote}>
        <Ionicons name="star" size={16} color={couleurs.etoile} />
        <Text style={styles.noteTexte}>{note.toFixed(1)}</Text>
        <Text style={styles.nombreAvis}>({prestataire.nombre_avis} avis)</Text>
        {prestataire.statut_kyc === 'verifie' && (
          <View style={styles.badgeVerifie}>
            <Ionicons name="shield-checkmark" size={12} color={couleurs.blanc} />
            <Text style={styles.badgeVerifieTexte}>Vérifié</Text>
          </View>
        )}
      </View>

      <View style={styles.rangeeCategories}>
        {prestataire.categories.map((c) => (
          <View key={c.id} style={stylesPartages.pilleCategorie}>
            <Text style={{ color: couleurs.tertiaire, fontSize: 12 }}>{c.nom}</Text>
          </View>
        ))}
      </View>

      {prestataire.description && <Text style={styles.description}>{prestataire.description}</Text>}

      <TouchableOpacity style={stylesPartages.boutonPrincipal} onPress={handleEnvoyerMessage} disabled={creationConversation}>
        {creationConversation ? (
          <ActivityIndicator color={couleurs.blanc} />
        ) : (
          <Text style={stylesPartages.boutonPrincipalTexte}>Envoyer un message</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.titreSection}>Services proposés</Text>
      {services.length === 0 ? (
        <Text style={styles.videTexte}>Aucun service publié pour le moment.</Text>
      ) : (
        services.map((s) => (
          <View key={s.id} style={styles.carteService}>
            <Text style={styles.serviceTitre}>{s.titre}</Text>
            <Text style={styles.serviceDescription} numberOfLines={2}>{s.description}</Text>
            <Text style={styles.servicePrix}>À partir de {s.prix_min} FCFA</Text>
          </View>
        ))
      )}

      <Text style={styles.titreSection}>Avis clients</Text>
      {avis.length === 0 ? (
        <Text style={styles.videTexte}>Aucun avis pour le moment.</Text>
      ) : (
        avis.map((a) => (
          <View key={a.id} style={styles.carteAvis}>
            <View style={styles.enteteAvis}>
              <Text style={styles.avisAuteur}>{a.client_nom}</Text>
              <View style={styles.ligneNote}>
                <Ionicons name="star" size={12} color={couleurs.etoile} />
                <Text style={styles.avisNote}>{a.note}</Text>
              </View>
            </View>
            <Text style={styles.avisCommentaire}>{a.commentaire}</Text>
            {a.reponse_prestataire && (
              <View style={styles.reponsePrestataire}>
                <Text style={styles.reponsePrestataireTexte}>Réponse : {a.reponse_prestataire}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond },
  scroll: { padding: espacements.md, paddingTop: espacements.xl, alignItems: 'center' },
  boutonRetour: { alignSelf: 'flex-start', marginBottom: espacements.sm },

  avatar: { width: 90, height: 90, borderRadius: rayons.rond, backgroundColor: couleurs.bordure, marginBottom: espacements.sm },
  nom: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire, textAlign: 'center' },

  ligneNote: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: espacements.xs },
  noteTexte: { fontWeight: '600', color: couleurs.tertiaire },
  nombreAvis: { fontSize: 12, color: couleurs.neutre },
  badgeVerifie: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.secondaire,
    borderRadius: rayons.rond, paddingVertical: 2, paddingHorizontal: 8, marginLeft: espacements.xs, gap: 3,
  },
  badgeVerifieTexte: { color: couleurs.blanc, fontSize: 10, fontWeight: '600' },

  rangeeCategories: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginTop: espacements.sm, marginBottom: espacements.sm, justifyContent: 'center' },
  description: { fontSize: 13, color: couleurs.neutre, textAlign: 'center', marginBottom: espacements.md, lineHeight: 18 },

  titreSection: { alignSelf: 'flex-start', fontWeight: '600', color: couleurs.tertiaire, marginTop: espacements.lg, marginBottom: espacements.sm },
  videTexte: { alignSelf: 'flex-start', color: couleurs.neutre, fontSize: 13 },

  carteService: {
    width: '100%', backgroundColor: couleurs.blanc, borderRadius: rayons.moyen,
    padding: espacements.sm, marginBottom: espacements.sm, borderWidth: 1, borderColor: couleurs.bordure,
  },
  serviceTitre: { fontWeight: '600', color: couleurs.tertiaire, fontSize: 14 },
  serviceDescription: { fontSize: 12, color: couleurs.neutre, marginTop: 2, marginBottom: 4 },
  servicePrix: { fontSize: 13, color: couleurs.bleuBase, fontWeight: '600' },

  carteAvis: {
    width: '100%', backgroundColor: couleurs.blanc, borderRadius: rayons.moyen,
    padding: espacements.sm, marginBottom: espacements.sm,
  },
  enteteAvis: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  avisAuteur: { fontWeight: '600', fontSize: 13, color: couleurs.tertiaire },
  avisNote: { fontSize: 12, color: couleurs.tertiaire },
  avisCommentaire: { fontSize: 13, color: couleurs.neutre },
  reponsePrestataire: { marginTop: espacements.xs, paddingLeft: espacements.sm, borderLeftWidth: 2, borderLeftColor: couleurs.bleuBase },
  reponsePrestataireTexte: { fontSize: 12, color: couleurs.neutre, fontStyle: 'italic' },
});