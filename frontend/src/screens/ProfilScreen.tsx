import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function ProfilScreen() {
  const { utilisateur, deconnexion } = useAuth();

  return (
    <View style={styles.conteneur}>
      <Text style={styles.nom}>{utilisateur?.first_name} {utilisateur?.last_name}</Text>
      <Text style={styles.role}>{utilisateur?.username} • {utilisateur?.role}</Text>

      <TouchableOpacity style={styles.bouton} onPress={deconnexion}>
        <Text style={styles.boutonTexte}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, alignItems: 'center', paddingTop: espacements.xl, backgroundColor: couleurs.fond },
  nom: { fontSize: 20, fontWeight: 'bold', color: couleurs.tertiaire },
  role: { fontSize: 14, color: couleurs.neutre, marginBottom: espacements.xl },
  bouton: {
    backgroundColor: '#DA1E28', borderRadius: rayons.moyen,
    paddingVertical: 12, paddingHorizontal: 24,
  },
  boutonTexte: { color: couleurs.blanc, fontWeight: '600' },
});