import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { demanderAssistant } from '../services/recherche';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

export default function AssistantRechercheScreen({ navigation }: any) {
  const [message, setMessage] = useState('');
  const [reponse, setReponse] = useState<{ categorie_id: number | null; categorie_nom: string | null; reponse_texte: string } | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleEnvoyer() {
    if (!message.trim()) return;
    setChargement(true);
    setReponse(null);
    try {
      const r = await demanderAssistant(message);
      setReponse(r);
    } catch {
      setReponse({ categorie_id: null, categorie_nom: null, reponse_texte: "Désolé, je n'ai pas pu traiter votre demande." });
    } finally {
      setChargement(false);
    }
  }

  function handleVoirCategorie() {
    navigation.navigate('RechercherListe', { categorieSuggeree: reponse?.categorie_id });
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Assistant de recherche</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: espacements.md }}>
        <Text style={styles.intro}>Décrivez votre besoin (ex: "j'ai un robinet qui fuit") et je vous oriente vers la bonne catégorie.</Text>

        {chargement && <ActivityIndicator style={{ marginTop: espacements.md }} color={couleurs.bleuBase} />}

        {reponse && (
          <View style={styles.bulleReponse}>
            <Text style={styles.texteReponse}>{reponse.reponse_texte}</Text>
            {reponse.categorie_id && (
              <TouchableOpacity style={[stylesPartages.boutonPrincipal, { marginTop: espacements.sm }]} onPress={handleVoirCategorie}>
                <Text style={stylesPartages.boutonPrincipalTexte}>Voir les prestataires « {reponse.categorie_nom} »</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.zoneSaisie}>
        <TextInput
          style={styles.champ}
          placeholder="Décrivez votre besoin..."
          placeholderTextColor={couleurs.neutre}
          value={message}
          onChangeText={setMessage}
        />
        <TouchableOpacity style={styles.boutonEnvoyer} onPress={handleEnvoyer} disabled={chargement}>
          <Ionicons name="send" size={18} color={couleurs.blanc} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: espacements.md, paddingTop: espacements.xl, backgroundColor: couleurs.blanc,
    borderBottomWidth: 1, borderBottomColor: couleurs.bordure,
  },
  titre: { fontSize: 16, fontWeight: '600', color: couleurs.tertiaire },
  intro: { fontSize: 13, color: couleurs.neutre, marginBottom: espacements.md },
  bulleReponse: { backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, borderWidth: 1, borderColor: couleurs.secondaire },
  texteReponse: { fontSize: 14, color: couleurs.tertiaire },
  zoneSaisie: {
    flexDirection: 'row', alignItems: 'center', padding: espacements.sm,
    backgroundColor: couleurs.blanc, borderTopWidth: 1, borderTopColor: couleurs.bordure, gap: espacements.xs,
  },
  champ: {
    flex: 1, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.grand,
    paddingHorizontal: espacements.sm, paddingVertical: 10, fontSize: 14, backgroundColor: couleurs.fond,
  },
  boutonEnvoyer: { backgroundColor: couleurs.bleuBase, borderRadius: rayons.rond, width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
});