from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Commentaire, Publication
from .serializers import CommentaireSerializer, PublicationSerializer


class PublicationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/publications/ — fil d'actualité public (avec ?prestataire=<id> pour filtrer)
    POST /api/publications/ — publier (prestataire connecté uniquement)
    """

    serializer_class = PublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}

    def get_queryset(self):
        queryset = Publication.objects.select_related('prestataire').prefetch_related('utilisateurs_ayant_aime')
        prestataire_id = self.request.query_params.get('prestataire')
        if prestataire_id:
            queryset = queryset.filter(prestataire_id=prestataire_id)
        return queryset

    def perform_create(self, serializer):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut publier.")
        serializer.save(prestataire=prestataire)


class PublicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_update(self, serializer):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None or serializer.instance.prestataire != prestataire:
            raise PermissionDenied("Vous ne pouvez modifier que vos propres publications.")
        serializer.save()

    def perform_destroy(self, instance):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None or instance.prestataire != prestataire:
            raise PermissionDenied("Vous ne pouvez supprimer que vos propres publications.")
        instance.delete()


class PublicationLikeView(APIView):
    """POST /api/publications/<id>/aimer/ — bascule j'aime/plus j'aime (toggle)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            publication = Publication.objects.get(pk=pk)
        except Publication.DoesNotExist:
            return Response({"detail": "Publication introuvable."}, status=404)

        if publication.utilisateurs_ayant_aime.filter(pk=request.user.pk).exists():
            publication.utilisateurs_ayant_aime.remove(request.user)
            aime = False
        else:
            publication.utilisateurs_ayant_aime.add(request.user)
            aime = True

        return Response({"aime": aime, "nombre_likes": publication.nombre_likes})


class CommentaireListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/publications/<id>/commentaires/ — commentaires d'une publication
    POST /api/publications/<id>/commentaires/ — ajouter un commentaire
    """

    serializer_class = CommentaireSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Commentaire.objects.filter(publication_id=self.kwargs['publication_id']).select_related('auteur')

    def perform_create(self, serializer):
        serializer.save(publication_id=self.kwargs['publication_id'], auteur=self.request.user)