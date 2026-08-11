from rest_framework import serializers

from .models import Categorie, Service, ServiceImage


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'description', 'icone', 'categorie_parente']


class ServiceImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceImage
        fields = ['id', 'image_originale', 'image_amelioree', 'est_principale']
        read_only_fields = ['image_amelioree']


class ServiceSerializer(serializers.ModelSerializer):
    """Représentation d'un service : lecture enrichie + écriture contrôlée."""

    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    prestataire_nom = serializers.CharField(source='prestataire.nom_entreprise', read_only=True)
    images = ServiceImageSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'prestataire', 'prestataire_nom', 'categorie', 'categorie_nom',
            'localisation', 'titre', 'description', 'prix_min', 'prix_max',
            'unite_prix', 'prix_suggere_ia', 'est_actif', 'images',
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['prestataire', 'prix_suggere_ia', 'date_creation', 'date_modification']