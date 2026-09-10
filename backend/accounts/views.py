from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from .models import Client, Prestataire, Utilisateur
from .serializers import (
    ClientLocalisationSerializer,
    ClientSerializer,
    DevenirPrestataireSerializer,
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

class PrestataireCategoriesUpdateView(APIView):
    """PATCH /api/accounts/moi/categories/ — modifier les catégories de son profil prestataire."""

    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")

        categorie_ids = request.data.get('categories', [])
        prestataire.categories.set(categorie_ids)

        return Response(PrestataireSerializer(prestataire).data)

class MonProfilPrestataireView(generics.RetrieveAPIView):
    """GET /api/accounts/moi/prestataire/ — mon propre profil prestataire complet."""

    serializer_class = PrestataireSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")
        return prestataire

class MonProfilPrestataireUpdateView(generics.UpdateAPIView):
    """PATCH /api/accounts/moi/prestataire/modifier/ — modifier nom_entreprise/description/experience."""

    serializer_class = DevenirPrestataireSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")
        return prestataire


class ClientLocalisationUpdateView(generics.UpdateAPIView):
    """PATCH /api/accounts/moi/localisation/ — modifier la position par defaut du client."""

    serializer_class = ClientLocalisationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        client = getattr(self.request.user, 'profil_client', None)
        if client is None:
            raise PermissionDenied("Vous n'avez pas de profil client.")
        return client    

from django.utils import timezone
from .models import Litige
from .serializers import LitigeSerializer, ResoudreLitigeSerializer, UtilisateurAdminSerializer


class AdminUtilisateursListView(generics.ListAPIView):
    """GET /api/accounts/admin/utilisateurs/?role=client|prestataire — tous les comptes."""

    serializer_class = UtilisateurAdminSerializer
    permission_classes = [EstAdministrateur]

    def get_queryset(self):
        queryset = Utilisateur.objects.all().order_by('-date_creation')
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        recherche = self.request.query_params.get('search')
        if recherche:
            queryset = queryset.filter(username__icontains=recherche)
        return queryset


class AdminUtilisateurDetailView(generics.RetrieveAPIView):
    """GET /api/accounts/admin/utilisateurs/<id>/ — détail complet d'un compte."""

    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [EstAdministrateur]


class AdminLitigeListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/accounts/admin/litiges/ — tous les litiges (filtrable par ?statut=ouvert)
    POST /api/accounts/admin/litiges/ — ouvrir un litige contre un utilisateur
    """

    serializer_class = LitigeSerializer
    permission_classes = [EstAdministrateur]

    def get_queryset(self):
        queryset = Litige.objects.select_related('utilisateur', 'signale_par')
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def perform_create(self, serializer):
        serializer.save(signale_par=self.request.user)


class AdminLitigeResoudreView(APIView):
    """POST /api/accounts/admin/litiges/<id>/resoudre/ — applique une sanction et clôt le litige."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            litige = Litige.objects.select_related('utilisateur').get(pk=pk)
        except Litige.DoesNotExist:
            return Response({"detail": "Litige introuvable."}, status=404)

        serializer = ResoudreLitigeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donnees = serializer.validated_data

        utilisateur_cible = litige.utilisateur
        if hasattr(utilisateur_cible, 'profil_administrateur'):
            return Response({"detail": "Impossible de sanctionner un compte administrateur."}, status=400)

        type_sanction = donnees['type_sanction']
        if type_sanction == Litige.TypeSanction.SUSPENSION:
            duree = donnees.get('duree_jours')
            if not duree:
                return Response({"detail": "duree_jours est obligatoire pour une suspension."}, status=400)
            utilisateur_cible.date_fin_suspension = timezone.now() + timezone.timedelta(days=duree)
            utilisateur_cible.est_bloque = False
            utilisateur_cible.motif_sanction = litige.motif
            utilisateur_cible.save(update_fields=['date_fin_suspension', 'est_bloque', 'motif_sanction'])
        elif type_sanction == Litige.TypeSanction.BLOCAGE:
            utilisateur_cible.est_bloque = True
            utilisateur_cible.date_fin_suspension = None
            utilisateur_cible.motif_sanction = litige.motif
            utilisateur_cible.save(update_fields=['est_bloque', 'date_fin_suspension', 'motif_sanction'])
        # AUCUNE : ne modifie rien sur l'utilisateur, juste clôture le litige

        litige.statut = Litige.Statut.RESOLU
        litige.type_sanction = type_sanction
        litige.duree_jours = donnees.get('duree_jours')
        litige.commentaire_resolution = donnees.get('commentaire_resolution', '')
        litige.date_resolution = timezone.now()
        litige.save()

        return Response(LitigeSerializer(litige).data)


class AdminLeverSanctionView(APIView):
    """POST /api/accounts/admin/utilisateurs/<id>/lever-sanction/ — retire une suspension/blocage."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            utilisateur = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        utilisateur.est_bloque = False
        utilisateur.date_fin_suspension = None
        utilisateur.motif_sanction = ''
        utilisateur.save(update_fields=['est_bloque', 'date_fin_suspension', 'motif_sanction'])

        return Response(UtilisateurAdminSerializer(utilisateur).data)    