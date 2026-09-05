from django.contrib import admin
from .models import Commentaire, Publication


@admin.register(Publication)
class PublicationAdmin(admin.ModelAdmin):
    list_display = ('prestataire', 'type_publication', 'date_creation')
    list_filter = ('type_publication',)
    search_fields = ('contenu', 'prestataire__nom_entreprise')


@admin.register(Commentaire)
class CommentaireAdmin(admin.ModelAdmin):
    list_display = ('publication', 'auteur', 'date_creation')

