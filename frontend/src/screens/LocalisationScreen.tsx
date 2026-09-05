import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { couleurs } from '../theme/colors';
import { rayons, espacements } from '../theme/styles';

const POSITION_PAR_DEFAUT = { latitude: 4.0511, longitude: 9.7043 };

interface Props {
  onConfirmer: (latitude: number, longitude: number) => void;
  onRetour: () => void;
}

// Page HTML autonome : carte Leaflet + tuiles OpenStreetMap (gratuites, sans cle API)
function genererHtmlCarte(lat: number, lon: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #carte { height: 100%; margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="carte"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('carte', { zoomControl: false }).setView([${lat}, ${lon}], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    let marqueur = L.marker([${lat}, ${lon}], { draggable: true }).addTo(map);

    function envoyerPosition(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: latlng.lat, lng: latlng.lng }));
    }

    marqueur.on('dragend', function (e) { envoyerPosition(e.target.getLatLng()); });
    map.on('click', function (e) {
      marqueur.setLatLng(e.latlng);
      envoyerPosition(e.latlng);
    });

    // Fonction appelee depuis React Native pour recentrer la carte (bouton GPS)
    function recentrer(lat, lon) {
      map.setView([lat, lon], 15);
      marqueur.setLatLng([lat, lon]);
      envoyerPosition({ lat, lng: lon });
    }
  </script>
</body>
</html>`;
}

export default function LocalisationScreen({ onConfirmer, onRetour }: Props) {
  const webviewRef = useRef<WebView>(null);
  const [position, setPosition] = useState(POSITION_PAR_DEFAUT);
  const [chargementGPS, setChargementGPS] = useState(false);
  const [pretInitial, setPretInitial] = useState(false);

  useEffect(() => {
    (async () => {
      await utiliserPositionActuelle(true);
      setPretInitial(true);
    })();
  }, []);

  async function utiliserPositionActuelle(silencieux = false) {
    setChargementGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silencieux) {
          Alert.alert('Localisation refusée', 'Vous pouvez tout de même choisir votre position en tapant sur la carte.');
        }
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const nouvellePosition = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setPosition(nouvellePosition);
      webviewRef.current?.injectJavaScript(
        `recentrer(${nouvellePosition.latitude}, ${nouvellePosition.longitude}); true;`
      );
    } catch {
      if (!silencieux) {
        Alert.alert('Erreur', "Impossible d'obtenir votre position actuelle.");
      }
    } finally {
      setChargementGPS(false);
    }
  }

  function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      setPosition({ latitude: data.lat, longitude: data.lng });
    } catch {
      // ignore les messages inattendus
    }
  }

  return (
    <View style={styles.conteneur}>
      <View style={styles.entete}>
        <TouchableOpacity onPress={onRetour} style={styles.boutonRetour}>
          <Ionicons name="arrow-back" size={24} color={couleurs.tertiaire} />
        </TouchableOpacity>
        <Text style={styles.titre}>Votre localisation</Text>
      </View>

      <Text style={styles.consigne}>
        Touchez la carte ou déplacez le marqueur pour ajuster votre position.
      </Text>

      <View style={styles.carteConteneur}>
        {!pretInitial ? (
          <View style={styles.chargementConteneur}>
            <ActivityIndicator size="large" color={couleurs.bleuBase} />
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ html: genererHtmlCarte(position.latitude, position.longitude) }}
            onMessage={handleMessage}
            style={StyleSheet.absoluteFill}
          />
        )}

        <TouchableOpacity
          style={styles.boutonGPS}
          onPress={() => utiliserPositionActuelle(false)}
          disabled={chargementGPS}
        >
          {chargementGPS ? (
            <ActivityIndicator size="small" color={couleurs.bleuBase} />
          ) : (
            <Ionicons name="locate" size={22} color={couleurs.bleuBase} />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.boutonConfirmer}
        onPress={() => onConfirmer(position.latitude, position.longitude)}
      >
        <Text style={styles.boutonConfirmerTexte}>Confirmer cette position</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  conteneur: { flex: 1, backgroundColor: couleurs.blanc },
  entete: { flexDirection: 'row', alignItems: 'center', padding: espacements.md, paddingTop: espacements.xl },
  boutonRetour: { marginRight: espacements.sm },
  titre: { fontSize: 18, fontWeight: '600', color: couleurs.tertiaire },
  consigne: { fontSize: 13, color: couleurs.neutre, paddingHorizontal: espacements.md, marginBottom: espacements.sm },
  carteConteneur: { flex: 1, position: 'relative' },
  chargementConteneur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  boutonGPS: {
    position: 'absolute', bottom: espacements.lg, right: espacements.lg,
    backgroundColor: couleurs.blanc, borderRadius: rayons.rond,
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  boutonConfirmer: {
    backgroundColor: couleurs.bleuBase, borderRadius: rayons.moyen,
    padding: 16, alignItems: 'center', margin: espacements.md,
  },
  boutonConfirmerTexte: { color: couleurs.blanc, fontSize: 16, fontWeight: '600' },
});