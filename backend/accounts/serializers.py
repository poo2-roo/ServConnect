from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from services.models import Categorie
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Administrateur, Client, Prestataire, Utilisateur


class ConnexionSerializer(TokenObtainPairSerializer):
    """Authentifie un utilisateur avec son email ou son numéro de téléphone."""

    identifier = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('username', None)

    def validate(self, attrs):
        identifier = attrs.pop('identifier')
        password = attrs.get('password')
        utilisateur = Utilisateur.objects.filter(email__iexact=identifier).first()
        if utilisateur is None:
            utilisateur = Utilisateur.objects.filter(telephone=identifier).first()

        if utilisateur is None:
            raise serializers.ValidationError('Email, téléphone ou mot de passe incorrect.')

        utilisateur_authentifie = authenticate(
            request=self.context.get('request'),
            username=utilisateur.username,
            password=password,
        )
        if utilisateur_authentifie is None:
            raise serializers.ValidationError('Email, téléphone ou mot de passe incorrect.')

        return super().validate({
            'username': utilisateur.username,
            'password': password,
        })


class UtilisateurSerializer(serializers.ModelSerializer):
    """Représentation en lecture d'un utilisateur (pour l'API)."""

    a_profil_prestataire = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'role', 'photo_profil', 'date_naissance',
            'langue_preferee', 'telephone_verifie', 'date_creation',
            'a_profil_prestataire',
        ]
        read_only_fields = ['id', 'telephone_verifie', 'date_creation']

    def get_a_profil_prestataire(self, obj):
        return hasattr(obj, 'profil_prestataire')

class InscriptionSerializer(serializers.ModelSerializer):
    """
    Création d'un compte. Le mot de passe est en write_only (jamais renvoyé
    dans les réponses API). Selon le `role` choisi, on crée automatiquement
    le profil Client ou Prestataire associé. La position (latitude/longitude)
    capturée à l'inscription est enregistrée sur le profil Client.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])
    ville = serializers.CharField(write_only=True, required=False, allow_blank=True)
    latitude = serializers.FloatField(write_only=True, required=False, allow_null=True)
    longitude = serializers.FloatField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'role', 'password', 'ville', 'latitude', 'longitude',
        ]

    def validate_role(self, value):
        if value == Utilisateur.Role.ADMINISTRATEUR:
            raise serializers.ValidationError(
                "Impossible de créer un compte administrateur via l'inscription publique."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        ville = validated_data.pop('ville', '')
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)

        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()

        Client.objects.create(
            utilisateur=user, adresse_habituelle=ville,
            latitude=latitude, longitude=longitude,
        )
        if user.role == Utilisateur.Role.PRESTATAIRE:
            Prestataire.objects.create(utilisateur=user)

        return user


class ClientSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'utilisateur', 'adresse_habituelle', 'nombre_demandes', 'latitude', 'longitude']


class CategorieSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom']


class PrestataireSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)
    categories = CategorieSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Prestataire
        fields = [
            'id', 'utilisateur', 'nom_entreprise', 'description',
            'annees_experience', 'statut_kyc', 'note_moyenne',
            'nombre_avis', 'est_disponible', 'categories',
        ]
        read_only_fields = ['statut_kyc', 'note_moyenne', 'nombre_avis']


class PrestataireKYCUploadSerializer(serializers.ModelSerializer):
    """Permet au prestataire de téléverser sa pièce d'identité et son selfie."""

    class Meta:
        model = Prestataire
        fields = ['piece_identite_recto', 'piece_identite_verso', 'selfie_avec_piece']


class DevenirPrestataireSerializer(serializers.ModelSerializer):
    """Utilisé pour activer un profil Prestataire sur un compte existant."""

    categories = serializers.PrimaryKeyRelatedField(
        queryset=Categorie.objects.all(), many=True, required=False
    )

    class Meta:
        model = Prestataire
        fields = ['nom_entreprise', 'description', 'annees_experience', 'categories']


class ClientLocalisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['latitude', 'longitude', 'adresse_habituelle']