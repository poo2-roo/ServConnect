import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AccueilScreen from '../screens/AccueilScreen';
import PublicationsScreen from '../screens/PublicationsScreen';

const Stack = createNativeStackNavigator();

export default function AccueilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AccueilFeed" component={AccueilScreen} />
      <Stack.Screen name="CreerPublication" component={PublicationsScreen} />
    </Stack.Navigator>
  );
}