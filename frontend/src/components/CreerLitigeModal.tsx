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
import api from '../services/api';

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
      await api.post('/accounts/litiges/', {
        utilisateur: utilisateurCibleId,
        motif: motif.trim(),
      });

      Alert.alert(
        'Signalement envoyé',
        'Votre litige a été transmis à notre équipe de modération. Nous traiterons votre demande dans les plus brefs délais.'
      );
      setMotif('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      const messageErreur =
        error.response?.data?.detail ||
        'Impossible d’enregistrer le litige pour le moment.';
      Alert.alert('Erreur', messageErreur);
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
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={SoumettreSignalement}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Envoyer</Text>
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
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  targetName: {
    fontWeight: '600',
    color: '#111',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#F9F9F9',
    height: 120,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 0.48,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#DC3545',
  },
  submitButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
});