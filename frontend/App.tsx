import React from 'react';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ConnexionScreen from './src/screens/ConnexionScreen';
import { View, Text, ActivityIndicator } from 'react-native';

function Racine() {
  const { utilisateur, chargement } = useAuth();

  if (chargement) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!utilisateur) {
    return <ConnexionScreen />;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Connecté en tant que {utilisateur.username} !</Text>
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Racine />
    </AuthProvider>
  );
}