from django.contrib.gis.geos import Point
from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer

from .models import Localisation


class LocalisationSerializer(GeoFeatureModelSerializer):
    """
    Sérialiseur au format GeoJSON (standard pour les données géospatiales).
    Accepte latitude et longitude en écriture lors de la création et
    construit automatiquement le champ géométrique `point`.
    """

    # Champs en écriture seule pour recevoir latitude et longitude envoyées par React Native
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = Localisation
        geo_field = 'point'
        fields = [
            'id', 'prestataire', 'nom_structure', 'type_structure',
            'adresse_texte', 'quartier', 'ville', 'adresse_normalisee',
            'confiance_geocodage', 'est_verifiee', 'latitude', 'longitude',
        ]
        read_only_fields = [
            'prestataire', 'adresse_normalisee', 'confiance_geocodage', 'est_verifiee'
        ]

    def create(self, validated_data):
        # Extraire latitude et longitude du body de la requête
        lat = validated_data.pop('latitude', None)
        lon = validated_data.pop('longitude', None)

        # Si latitude et longitude sont fournies, construire l'objet Point
        if lat is not None and lon is not None:
            # Attention : la classe Point de Django GIS prend (longitude, latitude)
            validated_data['point'] = Point(float(lon), float(lat), srid=4326)

        return super().create(validated_data)

    def update(self, instance, validated_data):
        lat = validated_data.pop('latitude', None)
        lon = validated_data.pop('longitude', None)

        if lat is not None and lon is not None:
            instance.point = Point(float(lon), float(lat), srid=4326)

        return super().update(instance, validated_data)