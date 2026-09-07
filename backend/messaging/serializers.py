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
    client_avatar = serializers.SerializerMethodField()
    prestataire_avatar = serializers.SerializerMethodField()
    dernier_message = serializers.SerializerMethodField()
    messages_non_lus = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'client', 'client_nom', 'client_avatar', 'prestataire', 'prestataire_nom', 'prestataire_avatar',
            'service', 'date_creation', 'derniere_activite', 'dernier_message', 'messages_non_lus',
        ]
        read_only_fields = ['client', 'date_creation', 'derniere_activite']

    def get_dernier_message(self, obj):
        dernier = obj.messages.order_by('-date_envoi').first()
        return MessageSerializer(dernier).data if dernier else None

    def _get_avatar_url(self, utilisateur):
        photo = utilisateur.photo_profil
        if not photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(photo.url) if request else photo.url

    def get_client_avatar(self, obj):
        return self._get_avatar_url(obj.client.utilisateur)

    def get_prestataire_avatar(self, obj):
        return self._get_avatar_url(obj.prestataire.utilisateur)

    def get_messages_non_lus(self, obj):
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(est_lu=False).exclude(expediteur=request.user).count()