import React, { useState, useEffect } from 'react';
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
      .bindPopup('<b>' + ${JSON.stringify(m.nom)} + '</b><br/>' + ${JSON.stringify(m.categories)} + '<br/><a href="#" onclick="envoyer(event, ${m.prestataireId})">Voir le profil</a>');
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
  function envoyer(e, id) {
    e.preventDefault();
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

        // Extraction sécurisée si l'API renvoie { results: [...] } ou un tableau direct
        const listeLocalisations = Array.isArray(localisations) 
          ? localisations 
          : (localisations as any)?.results || [];

        const prestatairesParId: Record<number, Prestataire> = {};
        if (Array.isArray(prestataires)) {
          prestataires.forEach((p) => { prestatairesParId[p.id] = p; });
        }

        const marqueurs = listeLocalisations
          .map((loc: any) => {
            const pId = loc?.properties?.prestataire ?? loc?.prestataire;
            const p = prestatairesParId[pId];
            if (!p) return null;

            if (categorieId && !p.categories.some((c) => c.id === categorieId)) return null;
            if (recherche && !(p.nom_entreprise || '').toLowerCase().includes(recherche.toLowerCase())) return null;

            const coords = loc?.geometry?.coordinates;
            const lon = coords ? parseFloat(coords[0]) : parseFloat(loc?.longitude);
            const lat = coords ? parseFloat(coords[1]) : parseFloat(loc?.latitude);

            if (isNaN(lat) || isNaN(lon)) return null;

            return {
              lat,
              lon,
              nom: p.nom_entreprise || p.utilisateur?.username || 'Prestataire',
              categories: (p.categories || []).map((c) => c.nom).join(', '),
              prestataireId: p.id,
            };
          })
          .filter(Boolean);

        setHtml(genererHtmlCarte(latitude, longitude, marqueurs as any[]));
      } catch (erreur: any) {
        console.log('Erreur carte:', JSON.stringify(erreur?.response?.data || erreur?.message || erreur));
        setErreur(`Erreur lors du chargement de la carte.`);
      } finally {
        setChargement(false);
      }
    })();
  }, [categorieId, recherche]);

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.prestataireId) {
        navigation.navigate('PrestataireDetail', { prestataireId: data.prestataireId });
      }
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