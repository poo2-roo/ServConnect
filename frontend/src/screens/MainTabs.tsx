import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AccueilScreen from '../screens/AccueilScreen';
import RechercherScreen from '../screens/RechercherScreen';
import PublicationsScreen from '../screens/PublicationsScreen';
import ProfilScreen from '../screens/ProfilScreen';
import { couleurs } from '../theme/colors';

const Tab = createBottomTabNavigator();

const ICONES: Record<string, keyof typeof Ionicons.glyphMap> = {
  Accueil: 'home',
  Rechercher: 'search',
  Publications: 'newspaper',
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
      <Tab.Screen name="Publications" component={PublicationsScreen} />
      <Tab.Screen name="Profil" component={ProfilScreen} />
    </Tab.Navigator>
  );
}