import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ConnexionScreen from './src/screens/ConnexionScreen';
import InscriptionScreen from './src/screens/InscriptionScreen';
import MainTabs from './src/navigation/MainTabs';

function Racine() {
  const { utilisateur, chargement } = useAuth();
  const [afficherInscription, setAfficherInscription] = useState(false);

  if (chargement) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!utilisateur) {
    return afficherInscription ? (
      <InscriptionScreen onRetourConnexion={() => setAfficherInscription(false)} />
    ) : (
      <ConnexionScreen onAllerInscription={() => setAfficherInscription(true)} />
    );
  }

  return <MainTabs />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Racine />
      </NavigationContainer>
    </AuthProvider>
  );
}