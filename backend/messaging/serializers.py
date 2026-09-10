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
    client_nom = serializers.SerializerMethodField()
    prestataire_nom = serializers.CharField(source='prestataire.nom_entreprise', read_only=True)
    client_avatar = serializers.SerializerMethodField()
    prestataire_avatar = serializers.SerializerMethodField()
    prestataire_initiateur_nom = serializers.SerializerMethodField()
    prestataire_initiateur_avatar = serializers.SerializerMethodField()
    dernier_message = serializers.SerializerMethodField()
    messages_non_lus = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'client', 'client_nom', 'client_avatar', 'prestataire', 'prestataire_nom', 'prestataire_avatar',
            'prestataire_initiateur', 'prestataire_initiateur_nom', 'prestataire_initiateur_avatar',
            'service', 'date_creation', 'derniere_activite', 'dernier_message', 'messages_non_lus',
        ]
        read_only_fields = ['client', 'date_creation', 'derniere_activite']

    def get_dernier_message(self, obj):
        dernier = obj.messages.order_by('-date_envoi').first()
        return MessageSerializer(dernier).data if dernier else None

    def get_client_nom(self, obj):
        return obj.client.utilisateur.get_full_name() if obj.client else None

    def _get_avatar_url(self, utilisateur):
        photo = utilisateur.photo_profil
        if not photo:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(photo.url) if request else photo.url

    def get_client_avatar(self, obj):
        return self._get_avatar_url(obj.client.utilisateur) if obj.client else None

    def get_prestataire_avatar(self, obj):
        return self._get_avatar_url(obj.prestataire.utilisateur)

    def get_prestataire_initiateur_nom(self, obj):
        if not obj.prestataire_initiateur:
            return None
        return obj.prestataire_initiateur.nom_entreprise or obj.prestataire_initiateur.utilisateur.get_full_name()

    def get_prestataire_initiateur_avatar(self, obj):
        if not obj.prestataire_initiateur:
            return None
        return self._get_avatar_url(obj.prestataire_initiateur.utilisateur)

    def get_messages_non_lus(self, obj):
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(est_lu=False).exclude(expediteur=request.user).count()

from .models import ConversationAdmin, MessageAdmin


class MessageAdminSerializer(serializers.ModelSerializer):
    expediteur_nom = serializers.CharField(source='expediteur.username', read_only=True)
    expediteur_role = serializers.CharField(source='expediteur.role', read_only=True)

    class Meta:
        model = MessageAdmin
        fields = ['id', 'conversation', 'expediteur', 'expediteur_nom', 'expediteur_role', 'contenu', 'date_envoi']
        read_only_fields = ['conversation', 'expediteur', 'date_envoi']


class ConversationAdminSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True)
    utilisateur_role = serializers.CharField(source='utilisateur.role', read_only=True)

    class Meta:
        model = ConversationAdmin
        fields = ['id', 'administrateur', 'utilisateur', 'utilisateur_nom', 'utilisateur_role', 'derniere_activite']
        read_only_fields = ['administrateur', 'derniere_activite']    