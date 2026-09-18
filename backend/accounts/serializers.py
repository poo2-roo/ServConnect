from django.contrib.auth.hashers import check_password
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Administrateur, Client, Litige, Prestataire, Utilisateur


class UtilisateurSerializer(serializers.ModelSerializer):
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


class ClientLocalisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['latitude', 'longitude', 'adresse_habituelle']


class CategorieSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        from services.models import Categorie
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
    class Meta:
        model = Prestataire
        fields = ['piece_identite_recto', 'piece_identite_verso', 'selfie_avec_piece']


class DevenirPrestataireSerializer(serializers.ModelSerializer):
    from services.models import Categorie
    categories = serializers.PrimaryKeyRelatedField(queryset=Categorie.objects.all(), many=True, required=False)

    class Meta:
        model = Prestataire
        fields = ['nom_entreprise', 'description', 'annees_experience', 'categories']


class UtilisateurAdminSerializer(serializers.ModelSerializer):
    profil_client = serializers.SerializerMethodField()
    profil_prestataire = serializers.SerializerMethodField()
    est_suspendu = serializers.SerializerMethodField()

    class Meta:
        model = Utilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'telephone',
            'role', 'is_active', 'est_bloque', 'date_fin_suspension', 'motif_sanction',
            'est_suspendu', 'date_creation', 'profil_client', 'profil_prestataire',
        ]

    def get_profil_client(self, obj):
        if hasattr(obj, 'profil_client'):
            return {'id': obj.profil_client.id, 'adresse_habituelle': obj.profil_client.adresse_habituelle}
        return None

    def get_profil_prestataire(self, obj):
        if hasattr(obj, 'profil_prestataire'):
            p = obj.profil_prestataire
            return {
                'id': p.id, 'nom_entreprise': p.nom_entreprise,
                'statut_kyc': p.statut_kyc, 'note_moyenne': str(p.note_moyenne),
            }
        return None

    def get_est_suspendu(self, obj):
        return bool(obj.date_fin_suspension and obj.date_fin_suspension > timezone.now())


class LitigeSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True)
    utilisateur_role = serializers.CharField(source='utilisateur.role', read_only=True)
    signale_par_nom = serializers.CharField(source='signale_par.username', read_only=True, default=None)

    class Meta:
        model = Litige
        fields = [
            'id', 'utilisateur', 'utilisateur_nom', 'utilisateur_role',
            'signale_par', 'signale_par_nom', 'motif', 'statut', 'type_sanction',
            'duree_jours', 'commentaire_resolution', 'date_creation', 'date_resolution',
        ]
        read_only_fields = ['statut', 'date_resolution']


class ConnexionSerializer(TokenObtainPairSerializer):
    """
    Authentification personnalisée par email ou téléphone.
    Retourne la structure JSON exacte lue par l'application React Native en cas de sanction.
    """
    identifier = serializers.CharField(write_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop('username', None)

    def validate(self, attrs):
        identifier = attrs.get('identifier')
        password = attrs.get('password')

        if not identifier or not password:
            raise serializers.ValidationError({'detail': 'Veuillez fournir un identifiant et un mot de passe.'})

        # 1. Recherche par email ou téléphone
        utilisateur = Utilisateur.objects.filter(email__iexact=identifier).first()
        if utilisateur is None:
            utilisateur = Utilisateur.objects.filter(telephone=identifier).first()

        # 2. Vérification des identifiants
        if utilisateur is None or not check_password(password, utilisateur.password):
            raise serializers.ValidationError({'detail': 'Email, téléphone ou mot de passe incorrect.'})

        if not utilisateur.is_active:
            raise serializers.ValidationError({'detail': 'Votre compte a été désactivé.'})

        # 3. Vérification du blocage définitif
        if utilisateur.est_bloque:
            raise serializers.ValidationError({
                'detail': f"Votre compte a été bloqué définitivement.",
                'est_sanctionne': 'true',
                'type_sanction': 'blocage',
                'motif': utilisateur.motif_sanction or 'Non spécifié'
            })

        # 4. Vérification de la suspension temporaire
        maintenant = timezone.now()
        if utilisateur.date_fin_suspension:
            if utilisateur.date_fin_suspension > maintenant:
                date_fin_str = utilisateur.date_fin_suspension.strftime('%d/%m/%Y à %H:%M')
                temps_restant = utilisateur.date_fin_suspension - maintenant
                jours = max(1, temps_restant.days)

                raise serializers.ValidationError({
                    'detail': f"Votre compte est suspendu jusqu'au {date_fin_str}.",
                    'est_sanctionne': 'true',
                    'type_sanction': 'suspension',
                    'date_fin': date_fin_str,
                    'jours_restants': str(jours),
                    'motif': utilisateur.motif_sanction or 'Non spécifié'
                })
            else:
                # Levée automatique si la date est dépassée
                utilisateur.date_fin_suspension = None
                utilisateur.save(update_fields=['date_fin_suspension'])

        # 5. Génération et retour des tokens JWT
        refresh = self.get_token(utilisateur)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }