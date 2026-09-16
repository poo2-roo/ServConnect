import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react me-native'; // adapter l'import selon react-native
import api from '../../services/api';

export default function AdminLitigesScreen() {
  const [litiges, setLitiges] = useState([]);
  const [litigeSelectionne, setLitigeSelectionne] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [typeSanction, setTypeSanction] = useState('aucune');
  const [dureeJours, setDureeJours] = useState('7');
  const [commentaire, setCommentaire] = useState('');

  const chargerLitiges = async () => {
    try {
      const response = await api.get('/accounts/litiges/?statut=ouvert');
      setLitiges(response.data);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de charger la liste des litiges.');
    }
  };

  useEffect(() => {
    chargerLitiges();
  }, []);

  const resoudreLitige = async () => {
    if (!litigeSelectionne) return;

    try {
      await api.post(`/accounts/admin/litiges/${litigeSelectionne.id}/resoudre/`, {
        type_sanction: typeSanction,
        duree_jours: typeSanction === 'suspension' ? parseInt(dureeJours) : null,
        commentaire_resolution: commentaire,
      });

      Alert.alert('Succès', 'Le litige a été traité avec succès.');
      setModalVisible(false);
      setCommentaire('');
      chargerLitiges();
    } catch (err) {
      Alert.alert('Erreur', 'Échec lors de la résolution du litige.');
    }
  };

  const ouvrirModalResoudre = (litige) => {
    setLitigeSelectionne(litige);
    setTypeSanction('aucune');
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Litiges en Attente</Text>

      <FlatList
        data={litiges}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Signalé : {item.utilisateur_nom} ({item.utilisateur_role})</Text>
            <Text style={styles.cardText}>Motif : {item.motif}</Text>
            <Text style={styles.cardSub}>Signalé par : {item.signale_par_nom || 'Anonyme'}</Text>
            
            <TouchableOpacity
              style={styles.btnAction}
              onPress={() => ouvrirModalResoudre(item)}
            >
              <Text style={styles.btnText}>Trancher / Résoudre</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Modal de décision admin */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Décision pour le litige #{litigeSelectionne?.id}</Text>

            <Text style={styles.label}>Type de Sanction :</Text>
            <View style={styles.row}>
              {['aucune', 'suspension', 'blocage'].map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, typeSanction === t && styles.chipSelected]}
                  onPress={() => setTypeSanction(t)}
                >
                  <Text style={typeSanction === t ? styles.chipTextSelected : styles.chipText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {typeSanction === 'suspension' && (
              <TextInput
                style={styles.input}
                placeholder="Durée (en jours)"
                keyboardType="numeric"
                value={dureeJours}
                onChangeText={setDureeJours}
              />
            )}

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Commentaire de résolution..."
              multiline
              value={commentaire}
              onChangeText={setCommentaire}
            />

            <View style={styles.rowBtn}>
              <TouchableOpacity style={styles.btnConfirm} onPress={resoudreLitige}>
                <Text style={styles.btnText}>Valider</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 16 },
  cardText: { marginVertical: 6, color: '#333' },
  cardSub: { fontSize: 12, color: '#666', marginBottom: 10 },
  btnAction: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16 },
  modalContent: { backgroundColor: '#fff', borderRadius: 10, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  label: { marginVertical: 8, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  chip: { padding: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 6 },
  chipSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText: { color: '#333' },
  chipTextSelected: { color: '#fff', fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, marginBottom: 12 },
  rowBtn: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  btnConfirm: { backgroundColor: '#28a745', padding: 12, borderRadius: 6, flex: 0.48, alignItems: 'center' },
  btnCancel: { backgroundColor: '#dc3545', padding: 12, borderRadius: 6, flex: 0.48, alignItems: 'center' },
});