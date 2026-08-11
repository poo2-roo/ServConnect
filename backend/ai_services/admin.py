from django.contrib import admin
from .models import JournalAppelIA


@admin.register(JournalAppelIA)
class JournalAppelIAAdmin(admin.ModelAdmin):
    list_display = ('module', 'utilisateur', 'succes', 'date_appel')
    list_filter = ('module', 'succes')