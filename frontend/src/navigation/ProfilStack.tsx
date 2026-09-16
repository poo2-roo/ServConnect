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
    </Stack.Navigator>
  );
}