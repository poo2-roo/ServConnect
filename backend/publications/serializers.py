from rest_framework import serializers

from .models import Commentaire, Publication


class CommentaireSerializer(serializers.ModelSerializer):
    auteur_nom = serializers.CharField(source='auteur.get_full_name', read_only=True)

    class Meta:
        model = Commentaire
        fields = ['id', 'publication', 'auteur', 'auteur_nom', 'contenu', 'date_creation']
        read_only_fields = ['publication', 'auteur', 'date_creation']


class PublicationSerializer(serializers.ModelSerializer):
    prestataire_nom = serializers.CharField(source='prestataire.nom_entreprise', read_only=True)
    prestataire_note = serializers.DecimalField(source='prestataire.note_moyenne', max_digits=3, decimal_places=2, read_only=True)
    prestataire_avatar = serializers.ImageField(source='prestataire.utilisateur.photo_profil', read_only=True)
    nombre_likes = serializers.IntegerField(read_only=True)
    nombre_commentaires = serializers.SerializerMethodField()
    jaime_deja = serializers.SerializerMethodField()

    class Meta:
        model = Publication
        fields = [
            'id', 'prestataire', 'prestataire_nom', 'prestataire_note', 'prestataire_avatar',
            'type_publication', 'contenu', 'image', 'service_associe',
            'nombre_likes', 'nombre_commentaires', 'jaime_deja',
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['prestataire', 'date_creation', 'date_modification']

    def get_nombre_commentaires(self, obj):
        return obj.commentaires.count()

    def get_jaime_deja(self, obj):
        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            return False
        return obj.utilisateurs_ayant_aime.filter(pk=request.user.pk).exists()