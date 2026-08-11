from django.contrib import admin
from .models import Categorie, Service, ServiceImage


@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('nom', 'categorie_parente')


class ServiceImageInline(admin.TabularInline):
    model = ServiceImage
    extra = 1


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('titre', 'prestataire', 'categorie', 'prix_min', 'est_actif')
    list_filter = ('categorie', 'est_actif')
    search_fields = ('titre', 'description')
    inlines = [ServiceImageInline]