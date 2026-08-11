from django.contrib.gis.geos import Point
from django.contrib.gis.db.models.functions import Distance
from django.contrib.gis.measure import D
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied, ValidationError

from .models import Localisation
from .serializers import LocalisationSerializer


class LocalisationListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/geolocation/localisations/ — liste publique
    POST /api/geolocation/localisations/ — ajouter une structure (prestataire connecté)
    """

    queryset = Localisation.objects.all()
    serializer_class = LocalisationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut déclarer une structure.")
        serializer.save(prestataire=prestataire)


class LocalisationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Localisation.objects.all()
    serializer_class = LocalisationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class LocalisationProximiteView(generics.ListAPIView):
    """
    GET /api/geolocation/localisations/proximite/?lat=4.05&lon=9.70&rayon_km=5

    Renvoie les structures situées à moins de `rayon_km` kilomètres du point
    donné, triées de la plus proche à la plus loin. C'est le cœur du moteur
    de mise en relation géolocalisée de ServConnect.
    """

    serializer_class = LocalisationSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        lat = self.request.query_params.get('lat')
        lon = self.request.query_params.get('lon')
        rayon_km = self.request.query_params.get('rayon_km', 5)

        if lat is None or lon is None:
            raise ValidationError("Les paramètres 'lat' et 'lon' sont obligatoires.")

        try:
            point_utilisateur = Point(float(lon), float(lat), srid=4326)
            rayon_km = float(rayon_km)
        except (TypeError, ValueError):
            raise ValidationError("lat, lon et rayon_km doivent être des nombres.")

        return (
            Localisation.objects.filter(point__distance_lte=(point_utilisateur, D(km=rayon_km)))
            .annotate(distance=Distance('point', point_utilisateur))
            .order_by('distance')
        )
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini_client import ErreurAppelIA
from ai_services.nlp_adresses import analyser_adresse


class AnalyserAdresseView(APIView):
    """POST /api/geolocation/localisations/<id>/analyser/ — lance le module NLP adresses."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        try:
            localisation = Localisation.objects.select_related('prestataire').get(pk=pk)
        except Localisation.DoesNotExist:
            raise NotFound("Localisation introuvable.")

        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None or localisation.prestataire != prestataire:
            return Response(
                {"detail": "Vous ne pouvez analyser que vos propres localisations."}, status=403
            )

        try:
            resultat = analyser_adresse(
                adresse_texte=localisation.adresse_texte,
                ville=localisation.get_ville_display(),
                quartier=localisation.quartier,
                utilisateur=request.user,
            )
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        localisation.adresse_normalisee = resultat['adresse_normalisee']
        localisation.confiance_geocodage = resultat['confiance']
        localisation.save(update_fields=['adresse_normalisee', 'confiance_geocodage'])

        return Response({
            'adresse_normalisee': resultat['adresse_normalisee'],
            'points_de_repere': resultat['points_de_repere'],
            'confiance': resultat['confiance'],
            'raison_confiance': resultat.get('raison_confiance', ''),
        })

class LocalisationETAView(APIView):
    """GET /api/geolocation/localisations/<id>/eta/?lat=..&lon=.. — estimation de temps de trajet."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            localisation = Localisation.objects.get(pk=pk)
        except Localisation.DoesNotExist:
            raise NotFound("Localisation introuvable.")

        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        if lat is None or lon is None or localisation.point is None:
            return Response(
                {"detail": "Les paramètres 'lat' et 'lon' sont obligatoires, et la localisation doit avoir un point GPS."},
                status=400,
            )

        try:
            point_client = Point(float(lon), float(lat), srid=4326)
        except (TypeError, ValueError):
            raise ValidationError("lat et lon doivent être des nombres.")

        from django.contrib.gis.db.models.functions import Distance
        distance_km = (
            Localisation.objects.filter(pk=pk)
            .annotate(distance=Distance('point', point_client))
            .first()
            .distance.km
        )

        from ai_services.routage_eta import estimer_eta
        try:
            resultat = estimer_eta(
                distance_km, localisation.get_ville_display(), utilisateur=request.user
            )
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response(resultat)