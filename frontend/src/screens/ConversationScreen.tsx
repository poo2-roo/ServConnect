import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { recupererMessages, envoyerMessage } from '../services/messagerie';
import { Message } from '../types';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function ConversationScreen({ route, navigation }: any) {
  const { conversationId, nomInterlocuteur } = route.params;
  const { utilisateur } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const listeRef = useRef<FlatList>(null);
  const chargementEnCours = useRef(false);

  const charger = useCallback(async () => {
    if (chargementEnCours.current) return;
    chargementEnCours.current = true;
    try {
      const donnees = await recupererMessages(conversationId);
      setMessages(donnees);
    } finally {
      setChargement(false);
      chargementEnCours.current = false;
    }
  }, [conversationId]);

  useFocusEffect(
    useCallback(() => {
    charger();
    const intervalle = setInterval(charger, 3000);

    return () => clearInterval(intervalle);
    }, [charger])
  );

  async function handleEnvoyer() {
    if (!nouveauMessage.trim()) return;
    setEnvoiEnCours(true);
    const contenu = nouveauMessage;
    setNouveauMessage('');
    try {
      const message = await envoyerMessage(conversationId, contenu);
      setMessages((precedent) => [...precedent, message]);
      setTimeout(() => listeRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (erreur: any) {
      setNouveauMessage(contenu); // on remet le texte si l'envoi a échoué
      const detail = erreur?.response?.data;
      Alert.alert(
        'Envoi impossible',
        detail ? JSON.stringify(detail) : 'Vérifiez votre connexion et réessayez.',
      );
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
        <Text style={styles.titre}>{nomInterlocuteur}</Text>
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          ref={listeRef}
          data={messages}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listeMessages}
          onContentSizeChange={() => listeRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const estMoi = item.expediteur === utilisateur?.id;
            return (
              <View style={[styles.bulle, estMoi ? styles.bulleMoi : styles.bulleAutre]}>
                <Text style={estMoi ? styles.texteMoi : styles.texteAutre}>{item.contenu}</Text>
              </View>
            );
          }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun message pour l'instant. Dites bonjour !</Text>}
        />
      )}

      <View style={styles.zoneSaisie}>
        <TextInput
          style={styles.champ}
          placeholder="Écrire un message..."
          placeholderTextColor={couleurs.neutre}
          value={nouveauMessage}
          onChangeText={setNouveauMessage}
          multiline
        />
        <TouchableOpacity style={styles.boutonEnvoyer} onPress={handleEnvoyer} disabled={envoiEnCours}>
          {envoiEnCours ? (
            <ActivityIndicator size="small" color={couleurs.blanc} />
          ) : (
            <Ionicons name="send" size={18} color={couleurs.blanc} />
          )}
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

  listeMessages: { padding: espacements.md, flexGrow: 1, justifyContent: 'flex-end' },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },

  bulle: { maxWidth: '75%', borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs },
  bulleMoi: { backgroundColor: couleurs.bleuBase, alignSelf: 'flex-end' },
  bulleAutre: { backgroundColor: couleurs.blanc, alignSelf: 'flex-start', borderWidth: 1, borderColor: couleurs.bordure },
  texteMoi: { color: couleurs.blanc, fontSize: 14 },
  texteAutre: { color: couleurs.tertiaire, fontSize: 14 },

  zoneSaisie: {
    flexDirection: 'row', alignItems: 'flex-end', padding: espacements.sm,
    backgroundColor: couleurs.blanc, borderTopWidth: 1, borderTopColor: couleurs.bordure, gap: espacements.xs,
  },
  champ: {
    flex: 1, borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.grand,
    paddingHorizontal: espacements.sm, paddingVertical: 10, fontSize: 14, maxHeight: 100, backgroundColor: couleurs.fond,
  },
  boutonEnvoyer: {
    backgroundColor: couleurs.bleuBase, borderRadius: rayons.rond,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
});