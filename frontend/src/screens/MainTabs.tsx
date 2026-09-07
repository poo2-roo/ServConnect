import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import ProfilScreen from '../screens/ProfilScreen';
import { couleurs } from '../theme/colors';

function AccueilScreen() {
  return null;
}

function MessagesScreen() {
  return null;
}

function RechercherScreen() {
  return null;
}

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
        tabBarStyle: { borderTopColor: couleurs.bordure, height: 60, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONES[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={AccueilScreen} />
      <Tab.Screen name="Rechercher" component={RechercherScreen} />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}