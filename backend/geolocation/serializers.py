from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import Localisation


class LocalisationSerializer(GeoFeatureModelSerializer):
    """
    Sérialiseur au format GeoJSON (standard pour les données géospatiales).
    Chaque Localisation est renvoyée comme une "Feature" avec sa géométrie
    (`point`) séparée de ses propriétés — directement exploitable par
    Mapbox/OpenStreetMap côté frontend Expo.
    """

    class Meta:
        model = Localisation
        geo_field = 'point'
        fields = [
            'id', 'prestataire', 'nom_structure', 'type_structure',
            'adresse_texte', 'quartier', 'ville', 'adresse_normalisee',
            'confiance_geocodage', 'est_verifiee',
        ]
        read_only_fields = ['prestataire', 'adresse_normalisee', 'confiance_geocodage', 'est_verifiee']