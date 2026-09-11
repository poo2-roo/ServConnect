from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .auth import ConnexionView

from .views import (
    AdminBasculerActivationCompteView,
    AdminLeverSanctionView,
    AdminLitigeListCreateView,
    AdminLitigeResoudreView,
    AdminPrestatairesEnAttenteView,
    AdminUtilisateurDetailView,
    AdminUtilisateursListView,
    AdminValiderKYCView,
    BasculerModeView,
    ClientDetailView,
    ClientLocalisationUpdateView,
    DevenirPrestataireView,
    InscriptionView,
    MonProfilPrestataireUpdateView,
    MonProfilPrestataireView,
    PrestataireCategoriesUpdateView,
    PrestataireDetailView,
    PrestataireKYCUploadView,
    PrestataireKYCVerifierView,
    PrestataireListView,
    ProfilView,
)
from .serializers import ConnexionSerializer


class ConnexionView(TokenObtainPairView):
    serializer_class = ConnexionSerializer

urlpatterns = [
    path('inscription/', InscriptionView.as_view(), name='inscription'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('connexion/rafraichir/', TokenRefreshView.as_view(), name='connexion-rafraichir'),

    path('moi/', ProfilView.as_view(), name='profil'),
    path('clients/<int:pk>/', ClientDetailView.as_view(), name='client-detail'),
    path('prestataires/', PrestataireListView.as_view(), name='prestataire-list'),
    path('prestataires/<int:pk>/', PrestataireDetailView.as_view(), name='prestataire-detail'),
    path('moi/kyc/', PrestataireKYCUploadView.as_view(), name='prestataire-kyc-upload'),
    path('moi/kyc/verifier/', PrestataireKYCVerifierView.as_view(), name='prestataire-kyc-verifier'),
    path('moi/devenir-prestataire/', DevenirPrestataireView.as_view(), name='devenir-prestataire'),
    path('moi/basculer-mode/', BasculerModeView.as_view(), name='basculer-mode'),
    path('admin/prestataires-en-attente/', AdminPrestatairesEnAttenteView.as_view(), name='admin-prestataires-en-attente'),
    path('admin/prestataires/<int:pk>/valider-kyc/', AdminValiderKYCView.as_view(), name='admin-valider-kyc'),
    path('admin/utilisateurs/<int:pk>/basculer-activation/', AdminBasculerActivationCompteView.as_view(), name='admin-basculer-activation'),
    path('moi/categories/', PrestataireCategoriesUpdateView.as_view(), name='prestataire-categories'),
    path('moi/prestataire/', MonProfilPrestataireView.as_view(), name='mon-profil-prestataire'),
    path('moi/prestataire/modifier/', MonProfilPrestataireUpdateView.as_view(), name='mon-profil-prestataire-modifier'),
    path('admin/utilisateurs/', AdminUtilisateursListView.as_view(), name='admin-utilisateurs-list'),
    path('admin/utilisateurs/<int:pk>/', AdminUtilisateurDetailView.as_view(), name='admin-utilisateur-detail'),
    path('admin/utilisateurs/<int:pk>/lever-sanction/', AdminLeverSanctionView.as_view(), name='admin-lever-sanction'),
    path('admin/litiges/', AdminLitigeListCreateView.as_view(), name='admin-litige-list-create'),
    path('admin/litiges/<int:pk>/resoudre/', AdminLitigeResoudreView.as_view(), name='admin-litige-resoudre'),
    path('moi/localisation/', ClientLocalisationUpdateView.as_view(), name='client-localisation-update'),    
]