import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function MesMessagesAdminScreen({ navigation }: any) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);

  const charger = useCallback(async () => {
    try {
      const r = await api.get('/api/messaging/admin-conversations/');
      setConversations(Array.isArray(r.data) ? r.data : r.data.results || []);
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { charger(); }, [charger]));

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      {chargement ? (
        <ActivityIndicator style={{ marginTop: espacements.xl }} size="large" color={couleurs.bleuBase} />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: espacements.md }}
          ListEmptyComponent={<Text style={styles.vide}>Aucun message du support pour le moment.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.carte}
              onPress={() => navigation.navigate('AdminConversationDepuisProfil', { conversationId: item.id, nomInterlocuteur: 'Support ServConnect' })}
            >
              <Ionicons name="shield-checkmark" size={20} color={couleurs.bleuBase} />
              <Text style={styles.nom}>Support ServConnect</Text>
              <Ionicons name="chevron-forward" size={18} color={couleurs.neutre} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.fond },
  entete: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: espacements.md, paddingTop: espacements.xl },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  vide: { textAlign: 'center', color: couleurs.neutre, marginTop: espacements.xl },
  carte: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, backgroundColor: couleurs.blanc, borderRadius: rayons.moyen, padding: espacements.sm, marginBottom: espacements.xs },
  nom: { flex: 1, fontWeight: '600', color: couleurs.tertiaire },
});