import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

export default function ConnexionScreen() {
  const { connexion } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleConnexion() {
    if (!username || !password) {
      Alert.alert('Champs manquants', 'Merci de remplir votre identifiant et votre mot de passe.');
      return;
    }
    setChargement(true);
    try {
      await connexion(username, password);
    } catch (erreur) {
      Alert.alert('Connexion impossible', 'Identifiant ou mot de passe incorrect.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.conteneur}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Photo héro (à remplacer plus tard par une vraie image de prestataire) */}
        <View style={styles.heroConteneur}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1622396636133-ba608305f3ce?w=300&q=80' }}
            style={styles.heroImage}
          />
        </View>

        <Text style={styles.titre}>ServConnect</Text>
        <Text style={styles.accroche}>Trouvez le bon prestataire près de chez vous</Text>
        <Text style={styles.description}>
          Plombiers, électriciens, ménage, et plus encore. Tous nos prestataires sont vérifiés, fiables et disponibles.
        </Text>

        <TextInput
          style={styles.champ}
          placeholder="Email ou numéro de téléphone"
          placeholderTextColor={couleurs.neutre}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.champ}
          placeholder="Mot de passe"
          placeholderTextColor={couleurs.neutre}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={styles.bouton}
          onPress={handleConnexion}
          disabled={chargement}
        >
          {chargement ? (
            <ActivityIndicator color={couleurs.blanc} />
          ) : (
            <Text style={styles.boutonTexte}>Continuer</Text>
          )}
        </TouchableOpacity>

        <View style={styles.separateurLigne}>
          <View style={styles.trait} />
          <Text style={styles.separateurTexte}>ou continuer avec</Text>
          <View style={styles.trait} />
        </View>

        <View style={styles.rangeeSociale}>
          <TouchableOpacity style={styles.boutonSocial}>
            <Ionicons name="logo-google" size={20} color={couleurs.tertiaire} />
            <Text style={styles.boutonSocialTexte}>Google</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boutonSocial}>
            <Ionicons name="logo-apple" size={20} color={couleurs.tertiaire} />
            <Text style={styles.boutonSocialTexte}>Apple</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.piedDePage}>
          <Text style={styles.piedDePageTexte}>
            Nouveau sur ServConnect ? <Text style={styles.piedDePageLien}>Créer un compte</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.blanc },
  scroll: { flexGrow: 1, padding: espacements.lg, alignItems: 'center' },

  heroConteneur: { marginTop: espacements.lg, marginBottom: espacements.md },
  heroImage: {
    width: 280, height: 280, borderRadius: rayons.rond,
    borderWidth: 3, borderColor: couleurs.bleuBase,
  },

  titre: { fontSize: 26, fontWeight: 'bold', color: couleurs.bleuBase, marginBottom: espacements.xs },
  accroche: {
    fontSize: 17, fontWeight: '600', color: couleurs.tertiaire,
    textAlign: 'center', marginBottom: espacements.sm,
  },
  description: {
    fontSize: 13, color: couleurs.neutre, textAlign: 'center',
    marginBottom: espacements.lg, paddingHorizontal: espacements.md, lineHeight: 18,
  },

  champ: {
    width: '100%', borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: 14, marginBottom: espacements.sm, fontSize: 15, backgroundColor: couleurs.fond,
  },

  bouton: {
    width: '100%', backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen,
    padding: 16, alignItems: 'center', marginTop: espacements.xs,
  },
  boutonTexte: { color: couleurs.blanc, fontSize: 16, fontWeight: '600' },

  separateurLigne: {
    flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: espacements.lg,
  },
  trait: { flex: 1, height: 1, backgroundColor: couleurs.bordure },
  separateurTexte: { color: couleurs.neutre, fontSize: 12, marginHorizontal: espacements.sm },

  rangeeSociale: { flexDirection: 'row', gap: espacements.sm, width: '100%' },
  boutonSocial: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    paddingVertical: 12, gap: espacements.xs,
  },
  boutonSocialTexte: { color: couleurs.tertiaire, fontWeight: '500' },

  piedDePage: { marginTop: espacements.lg, marginBottom: espacements.md },
  piedDePageTexte: { color: couleurs.neutre, fontSize: 13 },
  piedDePageLien: { color: couleurs.bleuBase, fontWeight: '600' },
});