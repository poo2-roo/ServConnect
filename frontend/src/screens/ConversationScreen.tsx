import React, { useState, useCallback, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
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

type MessageAffiche = Message & { enAttente?: boolean };

export default function ConversationScreen({ route, navigation }: any) {
  const { conversationId, nomInterlocuteur } = route.params;
  const { utilisateur } = useAuth();
  const [messages, setMessages] = useState<MessageAffiche[]>([]);
  const [nouveauMessage, setNouveauMessage] = useState('');
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const listeRef = useRef<FlatList>(null);
  const messagesEnAttente = useRef<MessageAffiche[]>([]);
  const tentativesEnCours = useRef(new Set<number>());
  const prochainIdLocal = useRef(-1);
  const cleMessagesEnAttente = `messages_en_attente_${conversationId}`;

  const sauvegarderMessagesEnAttente = useCallback(async (messagesAConserver: MessageAffiche[]) => {
    messagesEnAttente.current = messagesAConserver;
    await SecureStore.setItemAsync(cleMessagesEnAttente, JSON.stringify(messagesAConserver));
  }, [cleMessagesEnAttente]);

  const chargerMessagesEnAttente = useCallback(async () => {
    const donnees = await SecureStore.getItemAsync(cleMessagesEnAttente);
    if (!donnees) return;
    try {
      messagesEnAttente.current = JSON.parse(donnees);
      setMessages((precedent) => [...precedent, ...messagesEnAttente.current]);
    } catch {
      await SecureStore.deleteItemAsync(cleMessagesEnAttente);
    }
  }, [cleMessagesEnAttente]);

  const ajouterMessageEnvoye = useCallback((message: Message) => {
    setMessages((precedent) => [...precedent.filter((item) => item.id !== message.id), message]);
    setTimeout(() => listeRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const charger = useCallback(async () => {
    try {
      const donnees = await recupererMessages(conversationId);
      const messagesServeur: MessageAffiche[] = donnees.map((message) => ({ ...message, enAttente: false }));
      const messagesEnAttenteRestants = [...messagesEnAttente.current];
      for (const message of messagesEnAttenteRestants) {
        const indexServeur = messagesServeur.findIndex(
          (messageServeur) => messageServeur.expediteur === message.expediteur && messageServeur.contenu === message.contenu
        );
        if (indexServeur !== -1) {
          await sauvegarderMessagesEnAttente(messagesEnAttente.current.filter((item) => item.id !== message.id));
          continue;
        }
        if (tentativesEnCours.current.has(message.id)) continue;
        tentativesEnCours.current.add(message.id);
        try {
          const messageEnvoye = await envoyerMessage(conversationId, message.contenu);
          await sauvegarderMessagesEnAttente(messagesEnAttente.current.filter((item) => item.id !== message.id));
          messagesServeur.push(messageEnvoye);
        } catch {
          // Le message reste transparent et sera retente au prochain rafraichissement.
        } finally {
          tentativesEnCours.current.delete(message.id);
        }
      }
      setMessages([...messagesServeur, ...messagesEnAttente.current]);
    } finally {
      setChargement(false);
    }
  }, [ajouterMessageEnvoye, conversationId, sauvegarderMessagesEnAttente]);

  useFocusEffect(
    useCallback(() => {
    async function initialiser() {
      await chargerMessagesEnAttente();
      await charger();
    }

    initialiser();
    const intervalle = setInterval(charger, 5000);

    return () => clearInterval(intervalle);
    }, [charger, chargerMessagesEnAttente])
  );

  async function handleEnvoyer() {
    if (!nouveauMessage.trim()) return;
    setEnvoiEnCours(true);
    const contenu = nouveauMessage;
    setNouveauMessage('');
    try {
      const message = await envoyerMessage(conversationId, contenu);
      ajouterMessageEnvoye(message);
    } catch (erreur: any) {
      const erreurConfirmeeParServeur = Boolean(erreur?.response);
      if (erreurConfirmeeParServeur) {
        setNouveauMessage(contenu);
      } else {
        const messageEnAttente: MessageAffiche = {
          id: prochainIdLocal.current--,
          conversation: conversationId,
          expediteur: utilisateur?.id || 0,
          expediteur_nom: utilisateur?.username || '',
          contenu,
          est_suggestion_ia: false,
          est_lu: false,
          date_envoi: new Date().toISOString(),
          enAttente: true,
        };
        sauvegarderMessagesEnAttente([...messagesEnAttente.current, messageEnAttente]);
        setMessages((precedent) => [...precedent, messageEnAttente]);
      }
      const detail = erreur?.response?.data;
      Alert.alert(
        erreurConfirmeeParServeur
          ? `Envoi impossible (statut: ${erreur?.response?.status || 'inconnu'})`
          : 'Connexion interrompue',
        detail
          ? JSON.stringify(detail)
          : erreurConfirmeeParServeur
            ? 'Le message n’a pas pu être envoyé. Vous pouvez réessayer.'
            : 'Le message a peut-être été envoyé. Vérifiez la conversation lorsque la connexion sera rétablie.',
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
              <View style={[styles.bulle, estMoi ? styles.bulleMoi : styles.bulleAutre, item.enAttente && styles.bulleEnAttente]}>
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
  bulleEnAttente: { backgroundColor: 'rgba(30, 136, 229, 0.45)' },
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