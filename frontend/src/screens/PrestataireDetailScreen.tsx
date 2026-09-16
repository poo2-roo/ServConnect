import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { recupererPublicationsPrestataire } from '../services/publications';
import { Publication } from '../types';
import CartePublication from '../components/CartePublication';
import { recupererLocalisationsPrestataire } from '../services/localisationPrestataire';
import {
  recupererPrestataire,
  recupererAvisPrestataire,
  recupererServicesPrestataire,
  laisserAvis,
  recupererETA,
} from '../services/prestataireDetail';
import { creerConversation } from '../services/messagerie';
import { Prestataire, Avis, Service } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';
import SelecteurEtoiles from '../components/SelecteurEtoiles';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&q=80';

export default function PrestataireDetailScreen({ route, navigation }: any) {
  const { prestataireId } = route.params;

  const [publications, setPublications] = useState<Publication[]>([]);
  const [prestataire, setPrestataire] = useState<Prestataire | null>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [chargement, setChargement] = useState(true);
  const [creationConversation, setCreationConversation] = useState(false);
  const [afficherFormAvis, setAfficherFormAvis] = useState(false);
  const [noteChoisie, setNoteChoisie] = useState(0);
  const [commentaireAvis, setCommentaireAvis] = useState('');
  const [envoiAvisEnCours, setEnvoiAvisEnCours] = useState(false);

  // Gestion multi-structures : accordéon + ETA calculé à la demande, par structure
  const [structures, setStructures] = useState<any[]>([]);
  const [positionClient, setPositionClient] = useState<{ lat: number; lon: number } | null>(null);
  const [structureSelectionneeId, setStructureSelectionneeId] = useState<number | null>(null);
  const [etaParStructure, setEtaParStructure] = useState<Record<number, any>>({});
  const [chargementEtaId, setChargementEtaId] = useState<number | null>(null);

  // Charger les détails du prestataire, avis, services, publications
  useEffect(() => {
    (async () => {
      try {
        const [p, a, s, pubs] = await Promise.all([
          recupererPrestataire(prestataireId),
          recupererAvisPrestataire(prestataireId),
          recupererServicesPrestataire(prestataireId),
          recupererPublicationsPrestataire(prestataireId),
        ]);
        setPrestataire(p);
        setAvis(a);
        setServices(s);
        setPublications(pubs);
      } finally {
        setChargement(false);
      }
    })();
  }, [prestataireId]);

  // Charger la liste des structures + la position du client (sans calculer d'ETA tant que rien n'est sélectionné)
  useEffect(() => {
    (async () => {
      try {
        const liste = await recupererLocalisationsPrestataire(prestataireId);
        setStructures(liste);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const position = await Location.getCurrentPositionAsync({});
          setPositionClient({ lat: position.coords.latitude, lon: position.coords.longitude });
        }
      } catch (erreur) {
        console.log('Erreur chargement structures:', erreur);
      }
    })();
  }, [prestataireId]);

  async function handleSelectionnerStructure(structure: any) {
    const dejaSelectionnee = structureSelectionneeId === structure.id;
    setStructureSelectionneeId(dejaSelectionnee ? null : structure.id);

    if (dejaSelectionnee || etaParStructure[structure.id] || !positionClient) return;

    setChargementEtaId(structure.id);
    try {
      const resultat = await recupererETA(structure.id, positionClient.lat, positionClient.lon);
      setEtaParStructure((prev) => ({ ...prev, [structure.id]: resultat }));
    } catch (erreur) {
      console.log('Erreur ETA:', erreur);
    } finally {
      setChargementEtaId(null);
    }
  }

  function ouvrirItineraire(structure: any) {
    const coords = structure.geometry?.coordinates;
    if (!coords) return;
    const [lon, lat] = coords;
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lon}`,
      android: `google.navigation:q=${lat},${lon}`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
    });
  }

  async function handleEnvoyerAvis() {
    if (noteChoisie === 0) {
      Alert.alert('Note manquante', 'Merci de choisir une note avant de valider.');
      return;
    }
    setEnvoiAvisEnCours(true);
    try {
      const nouvelAvis = await laisserAvis(prestataireId, noteChoisie, commentaireAvis);
      setAvis((precedent) => [nouvelAvis, ...precedent]);
      setAfficherFormAvis(false);
      setNoteChoisie(0);
      setCommentaireAvis('');
    } catch (erreur: any) {
      const detail = erreur?.response?.data;
      Alert.alert('Erreur', detail ? JSON.stringify(detail) : "Impossible d'envoyer votre avis.");
    } finally {
      setEnvoiAvisEnCours(false);
    }
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

      {!afficherFormAvis ? (
        <TouchableOpacity style={stylesPartages.boutonContour} onPress={() => setAfficherFormAvis(true)}>
          <Text style={stylesPartages.boutonContourTexte}>Laisser un avis</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.formAvis}>
          <SelecteurEtoiles note={noteChoisie} onChange={setNoteChoisie} />
          <TextInput
            style={styles.champAvis}
            placeholder="Votre commentaire (optionnel)"
            placeholderTextColor={couleurs.neutre}
            value={commentaireAvis}
            onChangeText={setCommentaireAvis}
            multiline
          />
          <View style={styles.rangeeBoutonsAvis}>
            <TouchableOpacity style={[stylesPartages.boutonContour, { flex: 1 }]} onPress={() => setAfficherFormAvis(false)}>
              <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[stylesPartages.boutonPrincipal, { flex: 1 }]} onPress={handleEnvoyerAvis} disabled={envoiAvisEnCours}>
              {envoiAvisEnCours ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={stylesPartages.boutonPrincipalTexte}>Envoyer</Text>}
            </TouchableOpacity>
          </View>
        </View>
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

      {structures.length > 0 && (
        <View style={styles.blocEta}>
          <Text style={styles.titreSection}>Structures ({structures.length})</Text>
          {structures.map((structure) => {
            const selectionnee = structureSelectionneeId === structure.id;
            const eta = etaParStructure[structure.id];
            return (
              <View key={structure.id} style={styles.carteStructure}>
                <TouchableOpacity onPress={() => handleSelectionnerStructure(structure)} style={styles.enteteStructure}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nomStructure}>{structure.properties?.nom_structure || 'Structure'}</Text>
                    <Text style={styles.sousTexteStructure}>
                      {structure.properties?.type_structure} · {structure.properties?.quartier}, {structure.properties?.ville}
                    </Text>
                  </View>
                  <Ionicons name={selectionnee ? 'chevron-up' : 'chevron-down'} size={18} color={couleurs.neutre} />
                </TouchableOpacity>

                {selectionnee && (
                  <View style={styles.detailStructure}>
                    {chargementEtaId === structure.id ? (
                      <ActivityIndicator color={couleurs.bleuBase} style={{ marginVertical: espacements.sm }} />
                    ) : eta ? (
                      <>
                        <Text style={styles.etaTexte}>
                          {eta.distance_km} km · environ {eta.eta_minutes_min}-{eta.eta_minutes_max} min
                        </Text>
                        <Text style={styles.etaAvertissement}>{eta.avertissement}</Text>
                        <TouchableOpacity
                          style={[stylesPartages.boutonPrincipal, { marginTop: espacements.sm }]}
                          onPress={() => ouvrirItineraire(structure)}
                        >
                          <Ionicons name="navigate" size={16} color={couleurs.blanc} />
                          <Text style={stylesPartages.boutonPrincipalTexte}> Ouvrir l'itinéraire</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <Text style={styles.etaAvertissement}>Estimation indisponible (localisation non autorisée).</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.titreSection}>Publications</Text>
      {publications.length === 0 ? (
        <Text style={styles.videTexte}>Aucune publication pour le moment.</Text>
      ) : (
        publications.map((pub) => (
          <CartePublication
            key={pub.id}
            publication={pub}
            onPress={() => navigation.navigate('PublicationDetail', { publication: pub })}
          />
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
  formAvis: { width: '100%', marginBottom: espacements.md },
  champAvis: {
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: espacements.sm, fontSize: 14, backgroundColor: couleurs.blanc, minHeight: 60, marginBottom: espacements.sm,
  },
  rangeeBoutonsAvis: { flexDirection: 'row', gap: espacements.sm },
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

  blocEta: { width: '100%', marginTop: espacements.lg },
  carteStructure: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, marginBottom: espacements.sm, overflow: 'hidden' },
  enteteStructure: { flexDirection: 'row', alignItems: 'center', padding: espacements.sm },
  nomStructure: { fontWeight: '600', color: couleurs.tertiaire, fontSize: 14 },
  sousTexteStructure: { fontSize: 12, color: couleurs.neutre },
  detailStructure: { paddingHorizontal: espacements.sm, paddingBottom: espacements.sm, borderTopWidth: 1, borderTopColor: couleurs.bordure },
  etaTexte: { fontSize: 14, fontWeight: '600', color: couleurs.tertiaire, marginTop: espacements.xs },
  etaAvertissement: { fontSize: 11, color: couleurs.neutre, fontStyle: 'italic' },
});