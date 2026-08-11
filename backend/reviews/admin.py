from django.contrib import admin
from .models import Avis


@admin.register(Avis)
class AvisAdmin(admin.ModelAdmin):
    list_display = ('prestataire', 'client', 'note', 'date_creation')
    list_filter = ('note',)