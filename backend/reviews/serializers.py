from rest_framework import serializers

from .models import Avis


class AvisSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.utilisateur.get_full_name', read_only=True)
    prestataire_nom = serializers.CharField(source='prestataire.nom_entreprise', read_only=True)

    class Meta:
        model = Avis
        fields = [
            'id', 'client', 'client_nom', 'prestataire', 'prestataire_nom',
            'service', 'note', 'commentaire', 'reponse_prestataire', 'date_creation',
        ]
        read_only_fields = ['client', 'reponse_prestataire', 'date_creation']