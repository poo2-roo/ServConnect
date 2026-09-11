import React, { useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import ConnexionScreen from './src/screens/ConnexionScreen';
import InscriptionScreen from './src/screens/InscriptionScreen';
import MainTabs from './src/navigation/MainTabs';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AdminUtilisateursScreen from './src/screens/AdminUtilisateursScreen';
import AdminUtilisateurDetailScreen from './src/screens/AdminUtilisateurDetailScreen';
import AdminLitigesScreen from './src/screens/AdminLitigesScreen';
import AdminConversationScreen from './src/screens/AdminConversationScreen';

const AdminStack = createNativeStackNavigator();

function AdminNavigator() {
  return (
    <AdminStack.Navigator screenOptions={{ headerShown: false }}>
      <AdminStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <AdminStack.Screen name="AdminUtilisateurs" component={AdminUtilisateursScreen} />
      <AdminStack.Screen name="AdminUtilisateurDetail" component={AdminUtilisateurDetailScreen} />
      <AdminStack.Screen name="AdminLitiges" component={AdminLitigesScreen} />
      <AdminStack.Screen name="AdminConversation" component={AdminConversationScreen} />
    </AdminStack.Navigator>
  );
}

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

  if (utilisateur.role === 'administrateur') {
    return <AdminNavigator />;
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