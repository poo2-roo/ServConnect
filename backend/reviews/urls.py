from django.urls import path

from .views import AvisListCreateView, AvisReponseView

urlpatterns = [
    path('avis/', AvisListCreateView.as_view(), name='avis-list-create'),
    path('avis/<int:pk>/reponse/', AvisReponseView.as_view(), name='avis-reponse'),
]