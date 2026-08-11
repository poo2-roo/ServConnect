from rest_framework import serializers

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.CharField(source='expediteur.get_full_name', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'expediteur', 'expediteur_nom',
            'contenu', 'est_suggestion_ia', 'est_lu', 'date_envoi',
        ]
        read_only_fields = ['conversation', 'expediteur', 'est_suggestion_ia', 'est_lu', 'date_envoi']


class ConversationSerializer(serializers.ModelSerializer):
    client_nom = serializers.CharField(source='client.utilisateur.get_full_name', read_only=True)
    prestataire_nom = serializers.CharField(source='prestataire.nom_entreprise', read_only=True)
    dernier_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'client', 'client_nom', 'prestataire', 'prestataire_nom',
            'service', 'date_creation', 'derniere_activite', 'dernier_message',
        ]
        read_only_fields = ['client', 'date_creation', 'derniere_activite']

    def get_dernier_message(self, obj):
        dernier = obj.messages.order_by('-date_envoi').first()
        return MessageSerializer(dernier).data if dernier else None