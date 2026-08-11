from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Avis
from .serializers import AvisSerializer


class AvisListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/reviews/avis/  — liste publique (avec ?prestataire=<id> pour filtrer)
    POST /api/reviews/avis/  — un client connecté laisse un avis
    """

    serializer_class = AvisSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = Avis.objects.select_related('client__utilisateur', 'prestataire')
        prestataire_id = self.request.query_params.get('prestataire')
        if prestataire_id:
            queryset = queryset.filter(prestataire_id=prestataire_id)
        return queryset

    def perform_create(self, serializer):
        client = getattr(self.request.user, 'profil_client', None)
        if client is None:
            raise PermissionDenied("Seul un compte client peut laisser un avis.")
        serializer.save(client=client)


class AvisReponseView(APIView):
    """POST /api/reviews/avis/<id>/reponse/ — le prestataire répond à un avis."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            avis = Avis.objects.select_related('prestataire').get(pk=pk)
        except Avis.DoesNotExist:
            return Response({"detail": "Avis introuvable."}, status=404)

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or avis.prestataire != prestataire:
            raise PermissionDenied("Vous ne pouvez répondre qu'à vos propres avis.")

        avis.reponse_prestataire = request.data.get('reponse_prestataire', '')
        avis.save(update_fields=['reponse_prestataire'])
        return Response(AvisSerializer(avis).data)