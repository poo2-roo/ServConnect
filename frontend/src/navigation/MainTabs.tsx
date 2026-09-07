import React, { useCallback, useEffect, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import AccueilStack from './AccueilStack';
import RechercherStack from './RechercherStack';
import MessagesStack from './MessagesStack';
import ProfilScreen from '../screens/ProfilScreen';
import { couleurs } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Accueil: 'home',
  Rechercher: 'search',
  Messages: 'chatbubbles',
  Profil: 'person',
};

export default function MainTabs() {
  const [messagesNonLus, setMessagesNonLus] = useState(0);

  const chargerMessagesNonLus = useCallback(async () => {
    try {
      const reponse = await api.get<{ results?: { messages_non_lus?: number }[] } | { messages_non_lus?: number }[]>(
        '/api/messaging/conversations/'
      );
      const conversations = Array.isArray(reponse.data) ? reponse.data : reponse.data.results || [];
      setMessagesNonLus(
        conversations.reduce((total, conversation) => total + (conversation.messages_non_lus || 0), 0)
      );
    } catch {
      // Conserver la dernière valeur si le réseau est temporairement indisponible.
    }
  }, []);

  useEffect(() => {
    chargerMessagesNonLus();
    const intervalle = setInterval(chargerMessagesNonLus, 5000);
    return () => clearInterval(intervalle);
  }, [chargerMessagesNonLus]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: couleurs.bleuBase,
        tabBarInactiveTintColor: couleurs.neutre,
        tabBarStyle: { borderTopColor: couleurs.bordure, height: 100, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name]} size={size} color={color} />
        ),
        tabBarBadge: route.name === 'Messages' && messagesNonLus > 0 ? 1 : undefined,
        tabBarBadgeStyle: route.name === 'Messages' ? styles.badgeMessages : undefined,
      })}
    >
      <Tab.Screen name="Accueil" component={AccueilStack} />
      <Tab.Screen name="Rechercher" component={RechercherStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}

const styles = {
  badgeMessages: {
    backgroundColor: '#D32F2F',
    color: '#D32F2F',
    minWidth: 10,
    height: 10,
    borderRadius: 5,
    padding: 0,
    fontSize: 1,
  },
};