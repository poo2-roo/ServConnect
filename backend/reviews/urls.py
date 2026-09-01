from django.urls import path

from .views import AdminAvisSupprimerView, AvisListCreateView, AvisReponseView

urlpatterns = [
    path('avis/', AvisListCreateView.as_view(), name='avis-list-create'),
    path('avis/<int:pk>/reponse/', AvisReponseView.as_view(), name='avis-reponse'),
    path('admin/<int:pk>/', AdminAvisSupprimerView.as_view(), name='admin-avis-supprimer'),
]