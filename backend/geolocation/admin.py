from django.contrib import admin
from .models import Localisation


@admin.register(Localisation)
class LocalisationAdmin(admin.ModelAdmin):
    list_display = ('nom_structure', 'prestataire', 'ville', 'quartier', 'est_verifiee')
    list_filter = ('ville', 'type_structure', 'est_verifiee')