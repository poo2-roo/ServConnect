import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfilScreen from '../screens/ProfilScreen';
import ModifierLocalisationScreen from '../screens/ModifierLocalisationScreen';
import DeclarerStructureScreen from '../screens/DeclarerStructureScreen';

import MesStructuresScreen from '../screens/MesStructuresScreen';
import ModifierStructureScreen from '../screens/ModifierStructureScreen';
import MesServicesScreen from '../screens/MesServicesScreen';
import ModifierServiceScreen from '../screens/ModifierServiceScreen';
import CreerServiceScreen from '../screens/CreerServiceScreen';
import MesMessagesAdminScreen from '../screens/MesMessagesAdminScreen';
import AdminConversationScreen from '../screens/AdminConversationScreen';

import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminUtilisateursScreen from '../screens/AdminUtilisateursScreen';
import AdminLitigesScreen from '../screens/AdminLitigesScreen';
import AdminKYCScreen from '../screens/AdminKYCScreen';
import AdminUtilisateurDetailScreen from '../screens/AdminUtilisateurDetailScreen';

const Stack = createNativeStackNavigator();

export default function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilPrincipal" component={ProfilScreen} />
      <Stack.Screen name="DeclarerStructure" component={DeclarerStructureScreen} />
      <Stack.Screen name="ModifierLocalisation" component={ModifierLocalisationScreen} />
      <Stack.Screen name="MesStructures" component={MesStructuresScreen} />
      <Stack.Screen name="ModifierStructure" component={ModifierStructureScreen} />
      <Stack.Screen name="MesServices" component={MesServicesScreen} />
      <Stack.Screen name="ModifierService" component={ModifierServiceScreen} />
      <Stack.Screen name="CreerService" component={CreerServiceScreen} />
      <Stack.Screen name="MesMessagesAdmin" component={MesMessagesAdminScreen} />     
      <Stack.Screen name="AdminConversationDepuisProfil" component={AdminConversationScreen} />


      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminUtilisateurs" component={AdminUtilisateursScreen} />
      <Stack.Screen name="AdminLitiges" component={AdminLitigesScreen} />
      <Stack.Screen name="AdminKYC" component={AdminKYCScreen} />
      <Stack.Screen name="AdminUtilisateurDetail" component={AdminUtilisateurDetailScreen} />
    </Stack.Navigator>
  );
}