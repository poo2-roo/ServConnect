from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Client, Prestataire, Utilisateur
from .serializers import (
    ClientSerializer,
    InscriptionSerializer,
    PrestataireSerializer,
    UtilisateurSerializer,
)


class InscriptionView(generics.CreateAPIView):
    """POST /api/accounts/inscription/ — création de compte (client ou prestataire)."""

    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]


class ProfilView(generics.RetrieveUpdateAPIView):
    """GET/PUT/PATCH /api/accounts/moi/ — consulter ou modifier son propre profil."""

    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ClientDetailView(generics.RetrieveAPIView):
    """GET /api/accounts/clients/<id>/ — profil public d'un client."""

    queryset = Client.objects.select_related('utilisateur')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]


class PrestataireListView(generics.ListAPIView):
    """GET /api/accounts/prestataires/ — liste des prestataires (annuaire public)."""

    queryset = Prestataire.objects.select_related('utilisateur').filter(est_disponible=True)
    serializer_class = PrestataireSerializer
    permission_classes = [permissions.AllowAny]


class PrestataireDetailView(generics.RetrieveAPIView):
    """GET /api/accounts/prestataires/<id>/ — fiche détaillée d'un prestataire."""

    queryset = Prestataire.objects.select_related('utilisateur')
    serializer_class = PrestataireSerializer
    permission_classes = [permissions.AllowAny]

from rest_framework.response import Response
from rest_framework.views import APIView

from ai_services.gemini_client import ErreurAppelIA
from ai_services.kyc import verifier_identite
from .serializers import PrestataireKYCUploadSerializer


class PrestataireKYCUploadView(generics.UpdateAPIView):
    """PATCH /api/accounts/moi/kyc/ — téléverser sa pièce d'identité."""

    serializer_class = PrestataireKYCUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut téléverser une pièce d'identité.")
        return prestataire

    def perform_update(self, serializer):
        serializer.save(statut_kyc=Prestataire.StatutKYC.NON_SOUMIS)


class PrestataireKYCVerifierView(APIView):
    """POST /api/accounts/moi/kyc/verifier/ — lance l'analyse IA de la pièce déjà téléversée."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut lancer une vérification KYC.")

        try:
            resultat = verifier_identite(prestataire, utilisateur=request.user)
        except ErreurAppelIA as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({
            'statut_kyc': prestataire.statut_kyc,
            'recommandation': resultat['recommandation'],
            'justification': resultat['justification'],
            'document_lisible': resultat['document_lisible'],
            'signes_suspects': resultat.get('signes_suspects', []),
        })