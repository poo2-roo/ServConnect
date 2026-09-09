import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RechercherScreen from '../screens/RechercherScreen';
import PrestataireDetailScreen from '../screens/PrestataireDetailScreen';
import ConversationScreen from '../screens/ConversationScreen';
import CartePrestatairesScreen from '../screens/CartePrestatairesScreen';
import AssistantRechercheScreen from '../screens/AssistantRechercheScreen';

const Stack = createNativeStackNavigator();

export default function RechercherStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RechercherListe" component={RechercherScreen} />
      <Stack.Screen name="PrestataireDetail" component={PrestataireDetailScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
      <Stack.Screen name="CartePrestataires" component={CartePrestatairesScreen} />
      <Stack.Screen name="AssistantRecherche" component={AssistantRechercheScreen} />
    </Stack.Navigator>
  );
}