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

class DevenirPrestataireView(APIView):
    """POST /api/accounts/moi/devenir-prestataire/ — active un profil Prestataire."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'profil_prestataire'):
            return Response(
                {"detail": "Vous avez déjà un profil prestataire."}, status=400
            )

        from .serializers import DevenirPrestataireSerializer
        serializer = DevenirPrestataireSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        prestataire = serializer.save(utilisateur=request.user)

        request.user.role = Utilisateur.Role.PRESTATAIRE
        request.user.save(update_fields=['role'])

        return Response(PrestataireSerializer(prestataire).data, status=201)

class BasculerModeView(APIView):
    """POST /api/accounts/moi/basculer-mode/ — change le rôle affiché (client <-> prestataire)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        nouveau_mode = request.data.get('mode')

        if nouveau_mode not in (Utilisateur.Role.CLIENT, Utilisateur.Role.PRESTATAIRE):
            return Response(
                {"detail": "Le champ 'mode' doit être 'client' ou 'prestataire'."}, status=400
            )

        if nouveau_mode == Utilisateur.Role.PRESTATAIRE and not hasattr(user, 'profil_prestataire'):
            return Response(
                {"detail": "Vous n'avez pas encore de profil prestataire. Activez-le d'abord via /moi/devenir-prestataire/."},
                status=400,
            )

        user.role = nouveau_mode
        user.save(update_fields=['role'])

        return Response(UtilisateurSerializer(user).data)

from .permissions import EstAdministrateur


class AdminPrestatairesEnAttenteView(generics.ListAPIView):
    """GET /api/accounts/admin/prestataires-en-attente/ — file d'attente KYC."""

    serializer_class = PrestataireSerializer
    permission_classes = [EstAdministrateur]

    def get_queryset(self):
        return Prestataire.objects.filter(
            statut_kyc=Prestataire.StatutKYC.EN_ATTENTE
        ).select_related('utilisateur')


class AdminValiderKYCView(APIView):
    """POST /api/accounts/admin/prestataires/<id>/valider-kyc/ — décision manuelle."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            prestataire = Prestataire.objects.get(pk=pk)
        except Prestataire.DoesNotExist:
            return Response({"detail": "Prestataire introuvable."}, status=404)

        decision = request.data.get('decision')
        if decision not in (Prestataire.StatutKYC.VERIFIE, Prestataire.StatutKYC.REJETE):
            return Response(
                {"detail": "Le champ 'decision' doit être 'verifie' ou 'rejete'."}, status=400
            )

        prestataire.statut_kyc = decision
        prestataire.kyc_commentaire = request.data.get('commentaire', '')
        prestataire.save(update_fields=['statut_kyc', 'kyc_commentaire'])

        return Response(PrestataireSerializer(prestataire).data)


class AdminBasculerActivationCompteView(APIView):
    """POST /api/accounts/admin/utilisateurs/<id>/basculer-activation/ — bannir/réactiver."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            utilisateur = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        if hasattr(utilisateur, 'profil_administrateur'):
            return Response(
                {"detail": "Impossible de désactiver un compte administrateur."}, status=400
            )

        utilisateur.is_active = not utilisateur.is_active
        utilisateur.save(update_fields=['is_active'])

        return Response({"id": utilisateur.id, "is_active": utilisateur.is_active})