import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { recupererCategories } from '../services/annuaire';
import { Categorie } from '../types';
import { couleurs } from '../theme/colors';
import { espacements, stylesPartages } from '../theme/styles';

interface Props {
  selection: number[];
  onChange: (ids: number[]) => void;
}

export default function SelecteurCategories({ selection, onChange }: Props) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setCategories(await recupererCategories());
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  function toggle(id: number) {
    if (selection.includes(id)) {
      onChange(selection.filter((x) => x !== id));
    } else {
      onChange([...selection, id]);
    }
  }

  if (chargement) return <ActivityIndicator color={couleurs.bleuBase} />;

  return (
    <View style={styles.conteneur}>
      {categories.map((cat) => {
        const active = selection.includes(cat.id);
        return (
          <TouchableOpacity
            key={cat.id}
            style={[stylesPartages.pilleCategorie, active && stylesPartages.pilleCategorieActive]}
            onPress={() => toggle(cat.id)}
          >
            <Text style={{ color: active ? couleurs.blanc : couleurs.tertiaire, fontSize: 13 }}>{cat.nom}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.xs, marginBottom: espacements.sm },
});