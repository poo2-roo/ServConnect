from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Administrateur, Client, Prestataire, Utilisateur


@admin.register(Utilisateur)
class UtilisateurAdmin(UserAdmin):
    list_display = ('username', 'telephone', 'role', 'email', 'is_active', 'est_bloque')
    list_filter = ('role', 'is_active', 'est_bloque', 'langue_preferee')
    fieldsets = UserAdmin.fieldsets + (
        ('Informations ServConnect', {
            'fields': ('telephone', 'role', 'photo_profil', 'date_naissance',
                       'langue_preferee', 'telephone_verifie'),
        }),
        ('Sanctions & Modération', {
            'fields': ('est_bloque', 'date_fin_suspension', 'motif_sanction'),
        }),
    )


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'adresse_habituelle', 'nombre_demandes')
    search_fields = ('utilisateur__username', 'utilisateur__telephone')


@admin.register(Prestataire)
class PrestataireAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'nom_entreprise', 'statut_kyc', 'note_moyenne', 'est_disponible')
    list_filter = ('statut_kyc', 'est_disponible')
    search_fields = ('utilisateur__username', 'nom_entreprise')


@admin.register(Administrateur)
class AdministrateurAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'niveau_acces')


from .models import Litige  # Ajoutez Litige à vos imports existants

@admin.register(Litige)
class LitigeAdmin(admin.ModelAdmin):
    list_display = ('id', 'utilisateur', 'statut', 'type_sanction', 'date_creation')
    list_filter = ('statut', 'type_sanction')
    search_fields = ('utilisateur__username', 'motif')