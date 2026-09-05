import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';
import LocalisationScreen from './LocalisationScreen';

function genererUsername(email: string, telephone: string): string {
  const base = (email.split('@')[0] || telephone).toLowerCase().replace(/[^a-z0-9]/g, '');
  const suffixe = Math.floor(1000 + Math.random() * 9000);
  return `${base}${suffixe}`;
}





export default function InscriptionScreen({ onRetourConnexion }: { onRetourConnexion: () => void }) {
  const { inscription } = useAuth();
  const [etape, setEtape] = useState<'formulaire' | 'localisation'>('formulaire');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [chargement, setChargement] = useState(false);

  function handleValiderFormulaire() {
    if (!nom || !prenom || !telephone || !motDePasse) {
      Alert.alert('Champs manquants', 'Merci de remplir au minimum le nom, le prénom, le téléphone et le mot de passe.');
      return;
    }
     if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Email invalide', 'Merci de saisir une adresse email au format valide (exemple@gmail.com).');
      return;
    }
    if (motDePasse.length < 8) {
      Alert.alert('Mot de passe trop court', 'Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (/^\d+$/.test(motDePasse)) {
      Alert.alert('Mot de passe invalide', 'Le mot de passe ne peut pas être entièrement numérique.');
      return;
    }
    if (motDePasse !== confirmation) {
      Alert.alert('Mots de passe différents', 'Le mot de passe et sa confirmation ne correspondent pas.');
      return;
    }
    setEtape('localisation');
  }

  async function handleConfirmerLocalisation(latitude: number, longitude: number) {
    setChargement(true);
    try {
      const username = genererUsername(email, telephone);
      await inscription({
        username, password: motDePasse, telephone,
        email, first_name: prenom, last_name: nom, latitude, longitude,
      });
       } catch (erreur: any) {
      console.log('Erreur complete:', JSON.stringify(erreur, null, 2));
      const detail = erreur?.response?.data;
      const status = erreur?.response?.status;
      const message = detail
        ? JSON.stringify(detail)
        : `Pas de réponse du serveur. Code: ${erreur?.code || 'inconnu'}. Message: ${erreur?.message || 'inconnu'}.`;
      Alert.alert(`Inscription impossible (statut: ${status || 'aucun'})`, message);
      setEtape('formulaire');
    }finally {
      setChargement(false);
    }
  }

  if (etape === 'localisation') {
    return (
      <LocalisationScreen
        onConfirmer={handleConfirmerLocalisation}
        onRetour={() => setEtape('formulaire')}
      />
    );
  }

  return (
    <KeyboardAvoidingView style={styles.conteneur} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.titre}>Créer un compte</Text>
        <Text style={styles.accroche}>Rejoignez notre communauté professionnelle aujourd'hui</Text>

        <TextInput style={styles.champ} placeholder="Nom" placeholderTextColor={couleurs.neutre} value={nom} onChangeText={setNom} />
        <TextInput style={styles.champ} placeholder="Prénom" placeholderTextColor={couleurs.neutre} value={prenom} onChangeText={setPrenom} />
        <TextInput style={styles.champ} placeholder="E-mail" placeholderTextColor={couleurs.neutre} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        <TextInput style={styles.champ} placeholder="Numéro de téléphone" placeholderTextColor={couleurs.neutre} value={telephone} onChangeText={setTelephone} keyboardType="phone-pad" />
        <TextInput style={styles.champ} placeholder="Mot de passe" placeholderTextColor={couleurs.neutre} value={motDePasse} onChangeText={setMotDePasse} secureTextEntry />
        <Text style={styles.indication}>Au moins 8 caractères, ni trop courant, ni entièrement numérique.</Text>
        <TextInput style={styles.champ} placeholder="Confirmer le mot de passe" placeholderTextColor={couleurs.neutre} value={confirmation} onChangeText={setConfirmation} secureTextEntry />

        <TouchableOpacity style={styles.bouton} onPress={handleValiderFormulaire} disabled={chargement}>
          {chargement ? <ActivityIndicator color={couleurs.blanc} /> : <Text style={styles.boutonTexte}>Continuer</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.piedDePage} onPress={onRetourConnexion}>
          <Text style={styles.piedDePageTexte}>
            Déjà un compte ? <Text style={styles.piedDePageLien}>Se connecter</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.blanc },
  scroll: { flexGrow: 1, padding: espacements.lg, alignItems: 'center' },
  titre: { fontSize: 24, fontWeight: 'bold', color: couleurs.bleuBase, marginTop: espacements.lg, marginBottom: espacements.xs, textAlign: 'center' },
  accroche: { fontSize: 14, color: couleurs.neutre, textAlign: 'center', marginBottom: espacements.lg },
  champ: {
    width: '100%', borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    padding: 14, marginBottom: espacements.sm, fontSize: 15, backgroundColor: couleurs.fond,
  },
  bouton: {
    width: '100%', backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen,
    padding: 16, alignItems: 'center', marginTop: espacements.xs,
  },
  boutonTexte: { color: couleurs.blanc, fontSize: 16, fontWeight: '600' },
  separateurLigne: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: espacements.lg },
  trait: { flex: 1, height: 1, backgroundColor: couleurs.bordure },
  separateurTexte: { color: couleurs.neutre, fontSize: 12, marginHorizontal: espacements.sm },
  rangeeSociale: { flexDirection: 'row', gap: espacements.sm, width: '100%' },
  boutonSocial: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: couleurs.bordure, borderRadius: rayons.moyen,
    paddingVertical: 12, gap: espacements.xs,
  },
    indication: {
    fontSize: 11, color: couleurs.neutre, alignSelf: 'flex-start',
    marginTop: -espacements.xs, marginBottom: espacements.sm, marginLeft: 4,
  },
  boutonSocialTexte: { color: couleurs.tertiaire, fontWeight: '500' },
  piedDePage: { marginTop: espacements.lg, marginBottom: espacements.md },
  piedDePageTexte: { color: couleurs.neutre, fontSize: 13 },
  piedDePageLien: { color: couleurs.bleuBase, fontWeight: '600' },
});