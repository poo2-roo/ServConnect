import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfilScreen from '../screens/ProfilScreen';
import ModifierLocalisationScreen from '../screens/ModifierLocalisationScreen';

const Stack = createNativeStackNavigator();

export default function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilPrincipal" component={ProfilScreen} />
      <Stack.Screen name="ModifierLocalisation" component={ModifierLocalisationScreen} />
    </Stack.Navigator>
  );
}