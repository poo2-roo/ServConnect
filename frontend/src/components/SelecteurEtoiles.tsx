import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { couleurs } from '../theme/colors';

export default function SelecteurEtoiles({ note, onChange }: { note: number; onChange: (n: number) => void }) {
  return (
    <View style={styles.rangee}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)}>
          <Ionicons name={n <= note ? 'star' : 'star-outline'} size={32} color={couleurs.etoile} style={{ marginHorizontal: 4 }} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', justifyContent: 'center', marginVertical: 8 },
});