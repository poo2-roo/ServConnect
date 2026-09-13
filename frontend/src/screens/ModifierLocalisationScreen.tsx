import React, { useState } from 'react';
import { Alert, ActivityIndicator, View } from 'react-native';
import LocalisationScreen from './LocalisationScreen';
import { mettreAJourLocalisationClient } from '../services/profil';
import { couleurs } from '../theme/colors';

export default function ModifierLocalisationScreen({ navigation }: any) {
  const [enregistrement, setEnregistrement] = useState(false);

  async function handleConfirmer(latitude: number, longitude: number) {
    setEnregistrement(true);
    try {
      await mettreAJourLocalisationClient(latitude, longitude);
      Alert.alert('Position mise à jour', 'Votre localisation a bien été enregistrée.');
      navigation.goBack();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour votre position.');
    } finally {
      setEnregistrement(false);
    }
  }

  if (enregistrement) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={couleurs.bleuBase} />
      </View>
    );
  }

  return <LocalisationScreen onConfirmer={handleConfirmer} onRetour={() => navigation.goBack()} />;
}