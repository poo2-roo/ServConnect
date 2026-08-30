from django.urls import path

from .views import (
    CommentaireListCreateView,
    PublicationDetailView,
    PublicationLikeView,
    PublicationListCreateView,
)

urlpatterns = [
    path('', PublicationListCreateView.as_view(), name='publication-list-create'),
    path('<int:pk>/', PublicationDetailView.as_view(), name='publication-detail'),
    path('<int:pk>/aimer/', PublicationLikeView.as_view(), name='publication-aimer'),
    path('<int:publication_id>/commentaires/', CommentaireListCreateView.as_view(), name='commentaire-list-create'),
]