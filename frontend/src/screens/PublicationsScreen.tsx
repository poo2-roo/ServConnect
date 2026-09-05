import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { couleurs } from '../theme/colors';

export default function PublicationsScreen() {
  return (
    <View style={styles.conteneur}>
      <Text style={styles.texte}>Publications (créer une annonce à venir)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: couleurs.fond },
  texte: { color: couleurs.neutre },
});