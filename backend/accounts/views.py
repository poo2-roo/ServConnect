from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Administrateur, Client, Litige, Prestataire, Utilisateur
from .permissions import EstAdministrateur
from .serializers import (
    ClientLocalisationSerializer,
    ClientSerializer,
    ConnexionSerializer,
    DevenirPrestataireSerializer,
    InscriptionSerializer,
    LitigeSerializer,
    PrestataireKYCUploadSerializer,
    PrestataireSerializer,
    UtilisateurAdminSerializer,
    UtilisateurSerializer,
)


class ConnexionView(TokenObtainPairView):
    serializer_class = ConnexionSerializer


class InscriptionView(generics.CreateAPIView):
    queryset = Utilisateur.objects.all()
    serializer_class = InscriptionSerializer
    permission_classes = [permissions.AllowAny]


class ProfilView(generics.RetrieveUpdateAPIView):
    serializer_class = UtilisateurSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = generics.RetrieveUpdateAPIView.parser_classes + []

    def get_object(self):
        return self.request.user


class ClientDetailView(generics.RetrieveAPIView):
    queryset = Client.objects.select_related('utilisateur')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClientLocalisationUpdateView(generics.UpdateAPIView):
    serializer_class = ClientLocalisationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        client = getattr(self.request.user, 'profil_client', None)
        if client is None:
            raise PermissionDenied("Vous n'avez pas de profil client.")
        return client


class PrestataireListView(generics.ListAPIView):
    queryset = Prestataire.objects.select_related('utilisateur').filter(est_disponible=True)
    serializer_class = PrestataireSerializer
    permission_classes = [permissions.AllowAny]


class PrestataireDetailView(generics.RetrieveAPIView):
    queryset = Prestataire.objects.select_related('utilisateur')
    serializer_class = PrestataireSerializer
    permission_classes = [permissions.AllowAny]


class PrestataireKYCUploadView(generics.UpdateAPIView):
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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Seul un compte prestataire peut lancer une vérification KYC.")

        from ai_services.gemini_client import ErreurAppelIA
        from ai_services.kyc import verifier_identite

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
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if hasattr(request.user, 'profil_prestataire'):
            return Response({"detail": "Vous avez déjà un profil prestataire."}, status=400)

        serializer = DevenirPrestataireSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        prestataire = serializer.save(utilisateur=request.user)

        request.user.role = Utilisateur.Role.PRESTATAIRE
        request.user.save(update_fields=['role'])

        return Response(PrestataireSerializer(prestataire).data, status=201)


class BasculerModeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        nouveau_mode = request.data.get('mode')

        if nouveau_mode not in (Utilisateur.Role.CLIENT, Utilisateur.Role.PRESTATAIRE):
            return Response({"detail": "Le champ 'mode' doit être 'client' ou 'prestataire'."}, status=400)

        if nouveau_mode == Utilisateur.Role.PRESTATAIRE and not hasattr(user, 'profil_prestataire'):
            return Response(
                {"detail": "Vous n'avez pas encore de profil prestataire. Activez-le d'abord."}, status=400
            )

        user.role = nouveau_mode
        user.save(update_fields=['role'])
        return Response(UtilisateurSerializer(user).data)


class PrestataireCategoriesUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        prestataire = getattr(request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")

        categorie_ids = request.data.get('categories', [])
        prestataire.categories.set(categorie_ids)
        return Response(PrestataireSerializer(prestataire).data)


class MonProfilPrestataireView(generics.RetrieveAPIView):
    serializer_class = PrestataireSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")
        return prestataire


class MonProfilPrestataireUpdateView(generics.UpdateAPIView):
    serializer_class = DevenirPrestataireSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        prestataire = getattr(self.request.user, 'profil_prestataire', None)
        if prestataire is None:
            raise PermissionDenied("Vous n'avez pas de profil prestataire.")
        return prestataire


class AdminPrestatairesEnAttenteView(generics.ListAPIView):
    serializer_class = PrestataireSerializer
    permission_classes = [EstAdministrateur]

    def get_queryset(self):
        return Prestataire.objects.filter(
            statut_kyc=Prestataire.StatutKYC.EN_ATTENTE
        ).select_related('utilisateur')


class AdminValiderKYCView(APIView):
    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            prestataire = Prestataire.objects.get(pk=pk)
        except Prestataire.DoesNotExist:
            return Response({"detail": "Prestataire introuvable."}, status=404)

        decision = request.data.get('decision')
        if decision not in (Prestataire.StatutKYC.VERIFIE, Prestataire.StatutKYC.REJETE):
            return Response({"detail": "Le champ 'decision' doit être 'verifie' ou 'rejete'."}, status=400)

        prestataire.statut_kyc = decision
        prestataire.kyc_commentaire = request.data.get('commentaire', '')
        prestataire.save(update_fields=['statut_kyc', 'kyc_commentaire'])

        return Response(PrestataireSerializer(prestataire).data)


class AdminBasculerActivationCompteView(APIView):
    """Active/désactive un compte manuellement (distinct d'une sanction : n'affiche pas de motif)."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            utilisateur = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        if hasattr(utilisateur, 'profil_administrateur'):
            return Response({"detail": "Impossible de désactiver un compte administrateur."}, status=400)

        utilisateur.is_active = not utilisateur.is_active
        utilisateur.save(update_fields=['is_active'])
        return Response({"id": utilisateur.id, "is_active": utilisateur.is_active})


class AdminUtilisateursListView(generics.ListAPIView):
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
    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [EstAdministrateur]


class LitigeListCreateView(generics.ListCreateAPIView):
    serializer_class = LitigeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Litige.objects.select_related('utilisateur', 'signale_par')
        if not hasattr(self.request.user, 'profil_administrateur'):
            queryset = queryset.filter(signale_par=self.request.user)
        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)
        return queryset

    def perform_create(self, serializer):
        serializer.save(signale_par=self.request.user)


class AdminResoudreLitigeView(APIView):
    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            litige = Litige.objects.select_related('utilisateur').get(pk=pk)
        except Litige.DoesNotExist:
            return Response({"detail": "Litige introuvable."}, status=404)

        type_sanction = request.data.get('type_sanction', 'aucune')
        duree_jours = request.data.get('duree_jours')
        commentaire = request.data.get('commentaire_resolution', '')

        utilisateur_cible = litige.utilisateur
        if hasattr(utilisateur_cible, 'profil_administrateur'):
            return Response({"detail": "Impossible de sanctionner un compte administrateur."}, status=400)

        if type_sanction == 'suspension':
            if not duree_jours:
                return Response({"detail": "duree_jours est obligatoire pour une suspension."}, status=400)
            utilisateur_cible.date_fin_suspension = timezone.now() + timezone.timedelta(days=int(duree_jours))
            utilisateur_cible.est_bloque = False
            utilisateur_cible.motif_sanction = litige.motif
            utilisateur_cible.save(update_fields=['date_fin_suspension', 'est_bloque', 'motif_sanction'])
        elif type_sanction == 'blocage':
            utilisateur_cible.est_bloque = True
            utilisateur_cible.date_fin_suspension = None
            utilisateur_cible.motif_sanction = litige.motif
            utilisateur_cible.save(update_fields=['est_bloque', 'date_fin_suspension', 'motif_sanction'])

        litige.statut = Litige.Statut.RESOLU
        litige.type_sanction = type_sanction
        litige.duree_jours = duree_jours
        litige.commentaire_resolution = commentaire
        litige.date_resolution = timezone.now()
        litige.save()

        return Response(LitigeSerializer(litige).data)


class AdminSanctionnerUtilisateurView(APIView):
    """Sanction directe, sans litige préalable — ne touche jamais à is_active."""

    permission_classes = [EstAdministrateur]

    def post(self, request, pk):
        try:
            utilisateur = Utilisateur.objects.get(pk=pk)
        except Utilisateur.DoesNotExist:
            return Response({"detail": "Utilisateur introuvable."}, status=404)

        if hasattr(utilisateur, 'profil_administrateur'):
            return Response({"detail": "Impossible de sanctionner un compte administrateur."}, status=400)

        type_sanction = request.data.get('type_sanction')
        duree_jours = request.data.get('duree_jours')
        motif = request.data.get('motif', '')

        if type_sanction == 'suspension':
            if not duree_jours:
                return Response({"detail": "duree_jours est obligatoire pour une suspension."}, status=400)
            utilisateur.date_fin_suspension = timezone.now() + timezone.timedelta(days=int(duree_jours))
            utilisateur.est_bloque = False
        elif type_sanction == 'blocage':
            utilisateur.est_bloque = True
            utilisateur.date_fin_suspension = None
        else:
            return Response({"detail": "type_sanction doit être 'suspension' ou 'blocage'."}, status=400)

        utilisateur.motif_sanction = motif
        utilisateur.save(update_fields=['est_bloque', 'date_fin_suspension', 'motif_sanction'])

        return Response({"id": utilisateur.id, "est_bloque": utilisateur.est_bloque, "date_fin_suspension": utilisateur.date_fin_suspension})


class AdminLeverSanctionView(APIView):
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