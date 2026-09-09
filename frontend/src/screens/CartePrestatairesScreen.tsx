import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { recupererLocalisationsProximite } from '../services/recherche';
import { recupererPrestataires } from '../services/annuaire';
import { Prestataire } from '../types';
import { couleurs } from '../theme/colors';
import { espacements } from '../theme/styles';

function genererHtmlCarte(lat: number, lon: number, marqueurs: any[]): string {
  const marqueursJs = marqueurs.map((m) => `
    L.marker([${m.lat}, ${m.lon}]).addTo(map)
      .bindPopup('<b>${m.nom.replace(/'/g, "")}</b><br/>${m.categories.replace(/'/g, "")}<br/><a href="#" onclick="envoyer(${m.prestataireId})">Voir le profil</a>');
  `).join('\n');

  return `
<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>html,body,#carte{height:100%;margin:0;padding:0;}</style>
</head><body>
<div id="carte"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map('carte').setView([${lat}, ${lon}], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  L.circleMarker([${lat}, ${lon}], {color: '#0F62FE', radius: 8}).addTo(map).bindPopup('Vous êtes ici');
  ${marqueursJs}
  function envoyer(id) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ prestataireId: id }));
  }
</script>
</body></html>`;
}

export default function CartePrestatairesScreen({ route, navigation }: any) {
  const { categorieId, recherche } = route.params || {};
  const [html, setHtml] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErreur('Localisation refusée.');
          setChargement(false);
          return;
        }
        const position = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = position.coords;

        const [localisations, prestataires] = await Promise.all([
          recupererLocalisationsProximite(latitude, longitude, 20),
          recupererPrestataires(),
        ]);

        const prestatairesParId: Record<number, Prestataire> = {};
        prestataires.forEach((p) => { prestatairesParId[p.id] = p; });

        const marqueurs = localisations
          .map((loc) => {
            const p = prestatairesParId[loc.properties.prestataire];
            if (!p) return null;
            if (categorieId && !p.categories.some((c) => c.id === categorieId)) return null;
            if (recherche && !(p.nom_entreprise || '').toLowerCase().includes(recherche.toLowerCase())) return null;
            return {
              lat: loc.geometry.coordinates[1],
              lon: loc.geometry.coordinates[0],
              nom: p.nom_entreprise || p.utilisateur.username,
              categories: p.categories.map((c) => c.nom).join(', '),
              prestataireId: p.id,
            };
          })
          .filter(Boolean);

        setHtml(genererHtmlCarte(latitude, longitude, marqueurs as any[]));
      } catch {
        setErreur('Impossible de charger la carte.');
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      navigation.navigate('PrestataireDetail', { prestataireId: data.prestataireId });
    } catch {}
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Prestataires à proximité</Text>
        <View style={{ width: 24 }} />
      </View>

      {chargement ? (
        <View style={styles.centre}><ActivityIndicator size="large" color={couleurs.bleuBase} /></View>
      ) : erreur ? (
        <View style={styles.centre}><Text style={{ color: couleurs.neutre }}>{erreur}</Text></View>
      ) : (
        <WebView source={{ html: html! }} onMessage={handleMessage} style={{ flex: 1 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.blanc },
  entete: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: espacements.md, paddingTop: espacements.xl,
  },
  titre: { fontSize: 16, fontWeight: '600', color: couleurs.tertiaire },
  centre: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});