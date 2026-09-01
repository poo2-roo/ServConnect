from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, generics, permissions
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from .serializers import ServiceImageSerializer

from .models import Categorie, Service, ServiceImage

from .models import Categorie, Service
from .serializers import CategorieSerializer, ServiceSerializer


class EstProprietaireOuLectureSeule(permissions.BasePermission):
    """Seul le prestataire propriétaire du service peut le modifier ou le supprimer."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return (
            hasattr(request.user, 'profil_prestataire')
            and obj.prestataire == request.user.profil_prestataire
        )


class CategorieListView(generics.ListAPIView):
    """GET /api/services/categories/ — liste publique des catégories."""

    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [permissions.AllowAny]


class ServiceListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/services/services/  — liste publique (avec filtres/recherche)
    POST /api/services/services/  — publication d'un service (prestataire connecté uniquement)
    """

    queryset = Service.objects.filter(est_actif=True).select_related('categorie', 'prestataire')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['categorie', 'prestataire']
    search_fields = ['titre', 'description']
    ordering_fields = ['prix_min', 'date_creation']

    def perform_create(self, serializer):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut publier un service.")
        serializer.save(prestataire=prestataire)


class ServiceDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/services/services/<id>/"""

    queryset = Service.objects.select_related('categorie', 'prestataire')
    serializer_class = ServiceSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, EstProprietaireOuLectureSeule]

from rest_framework.exceptions import PermissionDenied as PermDenied
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini_client import ErreurAppelIA
from ai_services.optimisation_prix import optimiser_prix


class ServiceOptimiserPrixView(APIView):
    """POST /api/services/services/<id>/optimiser-prix/ — suggestion de prix par IA."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service = Service.objects.select_related('categorie', 'localisation', 'prestataire').get(pk=pk)
        except Service.DoesNotExist:
            return Response({"detail": "Service introuvable."}, status=404)

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or service.prestataire != prestataire:
            raise PermDenied("Vous ne pouvez optimiser le prix que de vos propres services.")

        try:
            resultat = optimiser_prix(service, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response(resultat)

class RecommandationServicesView(APIView):
    """GET /api/services/services/recommandations/?lat=..&lon=..&rayon_km=10"""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        client = getattr(request.user, 'profil_client', None)
        if client is None:
            raise PermDenied("Seul un compte client peut recevoir des recommandations.")

        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        if lat is None or lon is None:
            return Response({"detail": "Les paramètres 'lat' et 'lon' sont obligatoires."}, status=400)

        rayon_km = request.query_params.get('rayon_km', 10)

        try:
            from ai_services.recommandation import recommander_services
            resultats = recommander_services(
                client, lat, lon, rayon_km=float(rayon_km), utilisateur=request.user
            )
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)
        except (TypeError, ValueError):
            return Response({"detail": "lat, lon et rayon_km doivent être des nombres."}, status=400)

        return Response({"recommandations": resultats})

class RedigerDescriptionView(APIView):
    """POST /api/services/rediger-description/ — génère des propositions de description."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermDenied("Seul un compte prestataire peut utiliser cet outil.")

        categorie_nom = request.data.get('categorie_nom', '')
        titre = request.data.get('titre', '')
        notes_brutes = request.data.get('notes_brutes', '')

        try:
            from ai_services.redaction_contenu import rediger_description
            propositions = rediger_description(
                categorie_nom, titre, notes_brutes, utilisateur=request.user
            )
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({"propositions": propositions})

class ServiceImageAmeliorerView(APIView):
    """POST /api/services/images/<id>/ameliorer/ — retouche IA d'une photo de service."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service_image = ServiceImage.objects.select_related('service__prestataire').get(pk=pk)
        except ServiceImage.DoesNotExist:
            return Response({"detail": "Image introuvable."}, status=404)

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or service_image.service.prestataire != prestataire:
            raise PermDenied("Vous ne pouvez retoucher que les images de vos propres services.")

        try:
            from ai_services.retouche_image import ameliorer_image_service
            ameliorer_image_service(service_image, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)
        
        from .serializers import ServiceImageSerializer
        return Response(ServiceImageSerializer(service_image).data)

class ServiceImageUploadView(generics.CreateAPIView):
    """POST /api/services/services/<id>/images/ — ajouter une photo à un service."""

    serializer_class = ServiceImageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        service = get_object_or_404(Service, pk=self.kwargs['pk'])
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None or service.prestataire != prestataire:
            raise PermDenied("Vous ne pouvez ajouter des photos qu'à vos propres services.")
        serializer.save(service=service)

class ServiceGenererImageView(APIView):
    """POST /api/services/services/<id>/generer-image/ — image illustrative générée par IA."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            service = Service.objects.select_related('categorie', 'prestataire').get(pk=pk)
        except Service.DoesNotExist:
            return Response({"detail": "Service introuvable."}, status=404)

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or service.prestataire != prestataire:
            raise PermDenied("Vous ne pouvez générer une image que pour vos propres services.")

        try:
            from ai_services.generation_image import generer_image_illustrative
            fichier_image = generer_image_illustrative(service, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        service_image = ServiceImage.objects.create(service=service, image_originale=fichier_image)

        return Response(ServiceImageSerializer(service_image).data, status=201)

from accounts.permissions import EstAdministrateur


class AdminCategorieListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/services/admin/categories/ — gestion complète des catégories."""

    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [EstAdministrateur]


class AdminCategorieDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/services/admin/categories/<id>/"""

    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [EstAdministrateur]