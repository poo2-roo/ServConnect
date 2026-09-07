import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
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
      })}
    >
      <Tab.Screen name="Accueil" component={AccueilStack} />
      <Tab.Screen name="Rechercher" component={RechercherStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}