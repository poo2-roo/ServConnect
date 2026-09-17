import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { creerLitige } from '../services/admin';
import { couleurs } from '../theme/colors';
import { rayons, espacements, stylesPartages } from '../theme/styles';

interface CreerLitigeModalProps {
  visible: boolean;
  onClose: () => void;
  utilisateurCibleId: number;
  utilisateurCibleNom?: string;
  onSuccess?: () => void;
}

export const CreerLitigeModal: React.FC<CreerLitigeModalProps> = ({
  visible,
  onClose,
  utilisateurCibleId,
  utilisateurCibleNom,
  onSuccess,
}) => {
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(false);

  const SoumettreSignalement = async () => {
    if (!motif.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir le motif de votre signalement.');
      return;
    }

    setLoading(true);
    try {
      await creerLitige({
        utilisateurCibleId,
        motif: motif.trim(),
      });

      Alert.alert(
        'Signalement envoyé',
        'Votre litige a été transmis à notre équipe de modération.'
      );
      setMotif('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.log('Erreur litige response backend:', error?.response?.data);

      const dataErreur = error?.response?.data;
      let messageErreur = 'Impossible d’enregistrer le litige pour le moment.';

      if (dataErreur) {
        if (typeof dataErreur === 'string') {
          messageErreur = dataErreur;
        } else if (typeof dataErreur === 'object') {
          messageErreur = Object.entries(dataErreur)
            .map(([cle, val]) => `${cle}: ${Array.isArray(val) ? val.join(', ') : val}`)
            .join('\n');
        }
      }

      Alert.alert('Erreur de signalement', messageErreur);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Signaler un problème</Text>

          {utilisateurCibleNom && (
            <Text style={styles.subTitle}>
              Utilisateur concerné : <Text style={styles.targetName}>{utilisateurCibleNom}</Text>
            </Text>
          )}

          <Text style={styles.label}>Motif du litige :</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Décrivez précisément ce qui s'est passé (non-respect du contrat, comportement inadapté, retard...)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            value={motif}
            onChangeText={setMotif}
            maxLength={500}
          />

          <View style={styles.actions}>
            <TouchableOpacity
              style={[stylesPartages.boutonContour, { flex: 0.48 }]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={stylesPartages.boutonContourTexte}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[stylesPartages.boutonPrincipal, { flex: 0.48, backgroundColor: '#DC3545' }]}
              onPress={SoumettreSignalement}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={couleurs.blanc} size="small" />
              ) : (
                <Text style={stylesPartages.boutonPrincipalTexte}>Envoyer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: espacements.md,
  },
  modalContainer: {
    backgroundColor: couleurs.blanc,
    borderRadius: rayons.moyen,
    padding: espacements.md,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: couleurs.tertiaire,
    marginBottom: espacements.xs,
  },
  subTitle: {
    fontSize: 14,
    color: couleurs.neutre,
    marginBottom: espacements.sm,
  },
  targetName: {
    fontWeight: '600',
    color: couleurs.tertiaire,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: couleurs.tertiaire,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: couleurs.bordure,
    borderRadius: rayons.moyen,
    padding: espacements.sm,
    fontSize: 14,
    color: couleurs.tertiaire,
    backgroundColor: couleurs.fond,
    height: 120,
    marginBottom: espacements.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});