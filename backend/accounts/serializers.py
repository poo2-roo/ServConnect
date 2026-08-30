from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Administrateur, Client, Prestataire, Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
    """Représentation en lecture d'un utilisateur (pour l'API)."""

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'role', 'photo_profil', 'date_naissance',
            'langue_preferee', 'telephone_verifie', 'date_creation',
        ]
        read_only_fields = ['id', 'telephone_verifie', 'date_creation']


class InscriptionSerializer(serializers.ModelSerializer):
    """
    Création d'un compte. Le mot de passe est en write_only (jamais renvoyé
    dans les réponses API). Selon le `role` choisi, on crée automatiquement
    le profil Client ou Prestataire associé.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'telephone', 'role', 'password',
        ]

    def validate_role(self, value):
        if value == Utilisateur.Role.ADMINISTRATEUR:
            raise serializers.ValidationError(
                "Impossible de créer un compte administrateur via l'inscription publique."
            )
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()

        if user.role == Utilisateur.Role.CLIENT:
            Client.objects.create(utilisateur=user)
        elif user.role == Utilisateur.Role.PRESTATAIRE:
            Prestataire.objects.create(utilisateur=user)

        return user


class ClientSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'utilisateur', 'adresse_habituelle', 'nombre_demandes']


class PrestataireSerializer(serializers.ModelSerializer):
    utilisateur = UtilisateurSerializer(read_only=True)

    class Meta:
        model = Prestataire
        fields = [
            'id', 'utilisateur', 'nom_entreprise', 'description',
            'annees_experience', 'statut_kyc', 'note_moyenne',
            'nombre_avis', 'est_disponible',
        ]
        read_only_fields = ['statut_kyc', 'note_moyenne', 'nombre_avis']


class PrestataireKYCUploadSerializer(serializers.ModelSerializer):
    """Permet au prestataire de téléverser sa pièce d'identité et son selfie."""

    class Meta:
        model = Prestataire
        fields = ['piece_identite_recto', 'piece_identite_verso', 'selfie_avec_piece']