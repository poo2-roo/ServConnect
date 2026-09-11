import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { recupererUtilisateurAdmin, UtilisateurAdmin, creerLitige, leverSanction, demarrerConversationAdmin } from '../services/admin';
import { basculerActivationCompte, supprimerPublicationAdmin } from '../services/admin';
import { recupererPublications } from '../services/publications';
import { Publication } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

const IMAGE_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&q=80';

export default function AdminUtilisateurDetailScreen({ route, navigation }: any) {
  const { utilisateurId } = route.params;
  const [utilisateur, setUtilisateur] = useState<UtilisateurAdmin | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [chargement, setChargement] = useState(true);
  const [motifLitige, setMotifLitige] = useState('');
  const [affichageLitige, setAffichageLitige] = useState(false);

  async function charger() {
    setChargement(true);
    try {
      const u = await recupererUtilisateurAdmin(utilisateurId);
      setUtilisateur(u);
      if (u.profil_prestataire) {
        setPublications(await recupererPublications());
      }
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => { charger(); }, [utilisateurId]);

  const publicationsDeCetUtilisateur = publications.filter(
    (p) => utilisateur?.profil_prestataire && p.prestataire === utilisateur.profil_prestataire.id
  );

  async function handleSignaler() {
    if (!motifLitige.trim()) {
      Alert.alert('Motif requis', 'Merci de préciser le motif du signalement.');
      return;
    }
    try {
      await creerLitige(utilisateurId, motifLitige);
      Alert.alert('Signalement enregistré', 'Le litige a été créé, gérez-le depuis la liste des litiges.');
      setMotifLitige('');
      setAffichageLitige(false);
    } catch {
      Alert.alert('Erreur', 'Impossible de créer le signalement.');
    }
  }

  async function handleLeverSanction() {
    try {
      await leverSanction(utilisateurId);
      Alert.alert('Sanction levée', "L'utilisateur retrouve un accès normal.");
      charger();
    } catch {
      Alert.alert('Erreur', 'Impossible de lever la sanction.');
    }
  }

  async function handleBasculerActivation() {
    try {
      await basculerActivationCompte(utilisateurId);
      charger();
    } catch {
      Alert.alert('Erreur', 'Action impossible.');
    }
  }

  async function handleMessage() {
    try {
      const conversation = await demarrerConversationAdmin(utilisateurId);
      navigation.navigate('AdminConversation', { conversationId: conversation.id, nomInterlocuteur: utilisateur?.username });
    } catch {
      Alert.alert('Erreur', 'Impossible de démarrer la conversation.');
    }
  }

  async function handleSupprimerPublication(id: number) {
    Alert.alert('Confirmer', 'Supprimer cette publication ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive', onPress: async () => {
          try {
            await supprimerPublicationAdmin(id);
            setPublications((prev) => prev.filter((p) => p.id !== id));
          } catch {
            Alert.alert('Erreur', 'Suppression impossible.');
          }
        },
      },
    ]);
  }

  if (chargement || !utilisateur) {
    return <View style={styles.centre}><ActivityIndicator size="large" color={couleurs.bleuBase} /></View>;
  }

  return (
    <FlatList
      style={styles.conteneur}
      contentContainerStyle={{ padding: espacements.md, paddingTop: espacements.xl }}
      ListHeaderComponent={
        <>
          <View style={styles.entete}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
            </TouchableOpacity>
            <Text style={styles.titre}>{utilisateur.username}</Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.carteInfos}>
            <Text style={styles.ligne}>Nom : {utilisateur.first_name} {utilisateur.last_name}</Text>
            <Text style={styles.ligne}>Email : {utilisateur.email}</Text>
            <Text style={styles.ligne}>Téléphone : {utilisateur.telephone}</Text>
            <Text style={styles.ligne}>Rôle : {utilisateur.role}</Text>
            <Text style={styles.ligne}>Compte actif : {utilisateur.is_active ? 'Oui' : 'Non'}</Text>
            {utilisateur.est_bloque && <Text style={[styles.ligne, { color: '#DA1E28', fontWeight: '600' }]}>BLOQUÉ — {utilisateur.motif_sanction}</Text>}
            {utilisateur.est_suspendu && !utilisateur.est_bloque && (
              <Text style={[styles.ligne, { color: '#F1C21B', fontWeight: '600' }]}>
                SUSPENDU jusqu'au {new Date(utilisateur.date_fin_suspension!).toLocaleDateString('fr-FR')} — {utilisateur.motif_sanction}
              </Text>
            )}
            {utilisateur.profil_prestataire && (
              <>
                <Text style={styles.ligne}>Entreprise : {utilisateur.profil_prestataire.nom_entreprise}</Text>
                <Text style={styles.ligne}>KYC : {utilisateur.profil_prestataire.statut_kyc}</Text>
                <Text style={styles.ligne}>Note : {utilisateur.profil_prestataire.note_moyenne}/5</Text>
              </>
            )}
            {utilisateur.profil_client && (
              <Text style={styles.ligne}>Adresse : {utilisateur.profil_client.adresse_habituelle || 'Non renseignée'}</Text>
            )}
          </View>

          <View style={styles.rangeeActions}>
            <TouchableOpacity style={stylesPartages.boutonContour} onPress={handleMessage}>
              <Text style={stylesPartages.boutonContourTexte}>Envoyer un message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={stylesPartages.boutonContour} onPress={handleBasculerActivation}>
              <Text style={stylesPartages.boutonContourTexte}>{utilisateur.is_active ? 'Désactiver le compte' : 'Réactiver le compte'}</Text>
            </TouchableOpacity>
            {(utilisateur.est_bloque || utilisateur.est_suspendu) && (
              <TouchableOpacity style={[stylesPartages.boutonPrincipal, { backgroundColor: '#24A148' }]} onPress={handleLeverSanction}>
                <Text style={stylesPartages.boutonPrincipalTexte}>Lever la sanction</Text>
              </TouchableOpacity>
            )}
          </View>

          {!affichageLitige ? (
            <TouchableOpacity style={[stylesPartages.boutonPrincipal, { backgroundColor: '#DA1E28' }]} onPress={() => setAffichageLitige(true)}>
              <Text style={stylesPartages.boutonPrincipalTexte}>Signaler cet utilisateur</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.formSignalement}>
              <TextInput
                style={styles.champMotif}
                placeholder="Motif du signalement..."
                value={motifLitige}
                onChangeText={setMotifLitige}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: espacements.xs }}>
                <TouchableOpacity style={[stylesPartages.boutonContour, { flex: 1 }]} onPress={() => setAffichageLitige(false)}>
                  <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[stylesPartages.boutonPrincipal, { flex: 1 }]} onPress={handleSignaler}>
                  <Text style={stylesPartages.boutonPrincipalTexte}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {utilisateur.profil_prestataire && (
            <Text style={styles.titreSection}>Publications ({publicationsDeCetUtilisateur.length})</Text>
          )}
        </>
      }
      data={publicationsDeCetUtilisateur}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <View style={styles.cartePublication}>
          <Image source={{ uri: item.image || IMAGE_PLACEHOLDER }} style={styles.imagePublication} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={2} style={styles.texteCartePublication}>{item.contenu}</Text>
          </View>
          <TouchableOpacity onPress={() => handleSupprimerPublication(item.id)}>
            <Ionicons name="trash-outline" size={20} color="#DA1E28" />
          </TouchableOpacity>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: espacements.md },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  carteInfos: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.md },
  ligne: { fontSize: 13, color: couleurs.tertiaire, marginBottom: 4 },
  rangeeActions: { gap: espacements.xs, marginBottom: espacements.md },
  formSignalement: { marginBottom: espacements.md },
  champMotif: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: espacements.sm, backgroundColor: couleurs.blanc, minHeight: 70, marginBottom: espacements.sm,
  },
  titreSection: { fontWeight: '600', fontSize: 15, color: couleurs.tertiaire, marginBottom: espacements.sm },
  cartePublication: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs, gap: espacements.sm,
  },
  imagePublication: { width: 44, height: 44, borderRadius: rayons.petit, backgroundColor: couleurs.bordure },
  texteCartePublication: { fontSize: 13, color: couleurs.tertiaire },
});