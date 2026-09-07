import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ConversationsListeScreen from '../screens/ConversationsListeScreen';
import ConversationScreen from '../screens/ConversationScreen';

const Stack = createNativeStackNavigator();

export default function MessagesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConversationsListe" component={ConversationsListeScreen} />
      <Stack.Screen name="Conversation" component={ConversationScreen} />
    </Stack.Navigator>
  );
}